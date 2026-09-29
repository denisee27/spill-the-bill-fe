import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  DollarSign,
  Clock,
  Users,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { useState } from 'react';
import api from '../../../shared/services/api';
import { getDashboardChartData } from '../../orders/services/order.service';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import { DateRangeFilter } from '../../../shared/components/DateRangeFilter';
import { formatCurrency, formatDate } from '../../../shared/utils/format';
import { useAuth } from '../../auth/hooks/useAuth';

async function getDashboardStats({ startDate, endDate } = {}) {
  const res = await api.get('/orders/admin/stats', {
    params: { startDate: startDate || undefined, endDate: endDate || undefined },
  });
  return res.data;
}

async function getPendingVerification() {
  const res = await api.get('/orders/admin', {
    params: { status: 'CHECKING_PAYMENT', limit: 5 },
  });
  return res.data;
}

function StatCard({ icon: Icon, label, value, color = 'brand' }) {
  const colors = {
    brand:  { bg: 'bg-brand-100 text-brand-800',   border: 'border-brand-100' },
    green:  { bg: 'bg-green-100 text-green-700',   border: 'border-green-100' },
    yellow: { bg: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-100' },
    blue:   { bg: 'bg-blue-100 text-blue-700',     border: 'border-blue-100' },
  };
  const cfg = colors[color] || colors.brand;
  return (
    <div className={`bg-white rounded-2xl border p-5 ${cfg.border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-dark-500 font-medium">{label}</p>
          <p className="text-2xl font-black text-dark-900 mt-1">{value}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${cfg.bg}`}>
          <Icon size={22} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

const STATUS_COLORS = {
  DELIVERED:         '#16a34a',
  SHIPPED:           '#2563eb',
  PROCESSING:        '#7c3aed',
  PAYMENT_APPROVED:  '#0891b2',
  CHECKING_PAYMENT:  '#d97706',
  PENDING_PAYMENT:   '#ea580c',
  PAYMENT_REJECTED:  '#dc2626',
  CANCELLED:         '#6b7280',
  REFUND_REQUESTED:  '#c2410c',
  REFUNDED:          '#9ca3af',
};

const STATUS_LABELS = {
  DELIVERED:         'Delivered',
  SHIPPED:           'Shipped',
  PROCESSING:        'Processing',
  PAYMENT_APPROVED:  'Payment Approved',
  CHECKING_PAYMENT:  'Checking Payment',
  PENDING_PAYMENT:   'Pending Payment',
  PAYMENT_REJECTED:  'Payment Rejected',
  CANCELLED:         'Cancelled',
  REFUND_REQUESTED:  'Refund Requested',
  REFUNDED:          'Refunded',
};

const TYPE_COLORS = { JASTIP: '#7c3aed', PRELOVED: '#0891b2', OTHER: '#9ca3af' };

function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-dark-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-bold text-dark-700 mb-1">{label}</p>
      <p className="text-brand-800 font-black">{formatCurrency(payload[0]?.value ?? 0)}</p>
      <p className="text-dark-400">{payload[1]?.value ?? 0} orders</p>
    </div>
  );
}

function StatusTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-dark-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-bold text-dark-700">{STATUS_LABELS[d.name] ?? d.name}</p>
      <p className="font-black" style={{ color: d.payload.fill }}>{d.value} orders</p>
    </div>
  );
}

function TopProductsTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-dark-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-bold text-dark-700 mb-1">{label}</p>
      <p className="text-brand-800 font-black">{payload[0]?.value} sold</p>
    </div>
  );
}

function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-dark-200 p-5 ${className}`}>
      <div className="mb-4">
        <h2 className="font-bold text-dark-900">{title}</h2>
        {subtitle && <p className="text-xs text-dark-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function ChartSkeleton({ height = 220 }) {
  return (
    <div className="animate-pulse" style={{ height }}>
      <div className="h-full w-full bg-dark-100 rounded-xl" />
    </div>
  );
}

export function AdminDashboardPage() {
  const { user } = useAuth();

  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const [dateRange, setDateRange] = useState({ startDate: thirtyDaysAgo, endDate: today });

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard', dateRange],
    queryFn: () => getDashboardStats(dateRange),
    staleTime: 60_000,
  });

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['admin', 'orders', 'checking'],
    queryFn: getPendingVerification,
    staleTime: 30_000,
  });

  const { data: chartRaw, isLoading: chartLoading } = useQuery({
    queryKey: ['admin', 'chart-data'],
    queryFn: getDashboardChartData,
    staleTime: 120_000,
  });

  const stats = data?.data || data || {};
  const pendingFeed = pendingData?.data?.orders ?? pendingData?.orders ?? [];
  const chart = chartRaw?.data ?? {};

  const revenueByDay = (chart.revenueByDay ?? []).map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  const statusDist = (chart.statusDistribution ?? [])
    .filter((d) => d.count > 0)
    .map((d) => ({ name: d.status, value: d.count, fill: STATUS_COLORS[d.status] ?? '#94a3b8' }));

  const topProducts = (chart.topProducts ?? []).map((d) => ({
    name: d.name.length > 22 ? d.name.slice(0, 22) + '…' : d.name,
    qty: d.qty,
  }));

  const typeRevenue = (chart.typeRevenue ?? []).map((d) => ({
    type: d.type,
    revenue: d.revenue,
    fill: TYPE_COLORS[d.type] ?? '#94a3b8',
  }));

  const totalTypeRevenue = typeRevenue.reduce((s, d) => s + d.revenue, 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-6">
      {/* Greeting + filter */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-dark-500 font-medium">{greeting},</p>
          <h1 className="text-2xl font-black text-dark-900">{user?.name || 'Admin'}</h1>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>
      {/* Alert */}
      <div className="flex justify-end">
        {(stats.pendingPayments ?? stats.checkingPayments ?? 0) > 0 && (
          <Link
            to="/admin/orders?status=CHECKING_PAYMENT"
            className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-300 rounded-xl text-sm font-bold text-yellow-800 hover:bg-yellow-100 transition-colors"
          >
            <AlertTriangle size={15} aria-hidden="true" />
            {stats.pendingPayments ?? stats.checkingPayments} awaiting verification
          </Link>
        )}
      </div>

      {/* Stat cards */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatCard icon={ShoppingCart} label="Total Orders"    value={stats.totalOrders ?? '-'}                    color="brand"  />
          <StatCard icon={DollarSign}   label="Total Revenue"   value={formatCurrency(stats.totalRevenue ?? 0)}     color="green"  />
          <StatCard icon={Clock}        label="Pending Payments" value={stats.pendingPayments ?? '-'}               color="yellow" />
          <StatCard icon={Users}        label="Total Users"     value={stats.totalUsers ?? '-'}                     color="blue"   />
        </div>
      )}

      {/* ── Charts row 1: Revenue trend + Status donut ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Revenue area chart — 2/3 width */}
        <ChartCard
          title="Revenue Trend"
          subtitle="Last 30 days · approved orders only"
          className="xl:col-span-2"
        >
          {chartLoading ? (
            <ChartSkeleton height={220} />
          ) : revenueByDay.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-sm text-dark-400">No revenue data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueByDay} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.floor(revenueByDay.length / 6)}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                  width={48}
                />
                <Tooltip content={<RevenueTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  fill="url(#revGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#7c3aed' }}
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="#c4b5fd"
                  strokeWidth={1.5}
                  fill="none"
                  dot={false}
                  activeDot={{ r: 3, fill: '#c4b5fd' }}
                  strokeDasharray="4 2"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
          <div className="flex gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-xs text-dark-400">
              <span className="inline-block w-5 h-0.5 bg-brand-700 rounded" />Revenue
            </span>
            <span className="flex items-center gap-1.5 text-xs text-dark-400">
              <span className="inline-block w-5 h-0.5 bg-brand-300 rounded border-t border-dashed border-brand-300" />Orders
            </span>
          </div>
        </ChartCard>

        {/* Order status donut — 1/3 width */}
        <ChartCard title="Order Status" subtitle="All-time distribution">
          {chartLoading ? (
            <ChartSkeleton height={220} />
          ) : statusDist.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-sm text-dark-400">No orders yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={statusDist}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {statusDist.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<StatusTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-1">
                {statusDist.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-dark-500 truncate">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.fill }} />
                      {STATUS_LABELS[d.name] ?? d.name}
                    </span>
                    <span className="font-bold text-dark-700 ml-2">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>
      </div>

      {/* ── Charts row 2: Top products + Type revenue ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Top 5 products horizontal bar — 2/3 */}
        <ChartCard
          title="Top Products"
          subtitle="By quantity sold (all time)"
          className="xl:col-span-2"
        >
          {chartLoading ? (
            <ChartSkeleton height={200} />
          ) : topProducts.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-sm text-dark-400">No sales data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                layout="vertical"
                data={topProducts}
                margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<TopProductsTooltip />} />
                <Bar dataKey="qty" fill="#7c3aed" radius={[0, 6, 6, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Revenue by type — 1/3 */}
        <ChartCard title="Revenue by Type" subtitle="Jastip vs Preloved split">
          {chartLoading ? (
            <ChartSkeleton height={200} />
          ) : typeRevenue.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-sm text-dark-400">No data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={typeRevenue}
                    dataKey="revenue"
                    nameKey="type"
                    innerRadius={42}
                    outerRadius={62}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {typeRevenue.map((entry) => (
                      <Cell key={entry.type} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), '']}
                    contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #e2e8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {typeRevenue.map((d) => {
                  const pct = totalTypeRevenue > 0 ? ((d.revenue / totalTypeRevenue) * 100).toFixed(1) : '0';
                  return (
                    <div key={d.type}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="flex items-center gap-1.5 font-semibold text-dark-700">
                          <span className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                          {d.type}
                        </span>
                        <span className="text-dark-400">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-dark-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: d.fill }}
                        />
                      </div>
                      <p className="text-xs text-dark-400 mt-0.5">{formatCurrency(d.revenue)}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-dark-100 flex items-center gap-1.5 text-xs text-dark-500">
                <TrendingUp size={12} className="text-brand-700" />
                Total {formatCurrency(totalTypeRevenue)}
              </div>
            </>
          )}
        </ChartCard>
      </div>

      {/* Pending verification feed */}
      <div className="bg-white rounded-2xl border border-dark-200">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-dark-100">
          <h2 className="font-bold text-dark-900">Awaiting Verification</h2>
          <Link
            to="/admin/orders?status=CHECKING_PAYMENT"
            className="text-xs font-semibold text-brand-800 hover:underline"
          >
            View all
          </Link>
        </div>

        {pendingLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="sm" />
          </div>
        ) : pendingFeed.length === 0 ? (
          <p className="px-5 py-8 text-sm text-dark-400 text-center">
            No orders awaiting verification
          </p>
        ) : (
          <div className="divide-y divide-dark-100">
            {pendingFeed.map((order) => (
              <Link
                key={order.id}
                to={`/admin/orders/${order.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-dark-50 transition-colors"
              >
                <div>
                  <span className="text-sm font-mono font-bold text-dark-800">
                    #{order.orderNumber || order.id?.slice(0, 8).toUpperCase()}
                  </span>
                  <p className="text-xs text-dark-400 mt-0.5">
                    {order.user?.name || 'Customer'} &middot; {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-brand-800">
                    {formatCurrency(order.total || order.totalAmount)}
                  </span>
                  <ChevronRight size={14} className="text-dark-300" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboardPage;
