import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft, User, ShoppingBag, DollarSign, MapPin,
  Calendar, Star, Package, TrendingUp,
} from 'lucide-react';
import api from '../../../shared/services/api';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import Badge from '../../../shared/components/Badge';
import { OrderStatusBadge } from '../../orders/components/OrderStatusBadge';
import { formatCurrency, formatDate } from '../../../shared/utils/format';
import { USER_ROLES } from '../../../shared/constants';

async function getUserDetail(id) {
  const res = await api.get(`/users/${id}`);
  return res.data;
}

const STAT_STATUSES = ['PAYMENT_APPROVED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export function AdminUserDetailPage() {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: () => getUserDetail(id),
    enabled: Boolean(id),
    staleTime: 30_000,
  });

  const user = data?.data;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <p className="text-dark-500">User not found.</p>;
  }

  const orders = user.orders || [];
  const completedOrders = orders.filter((o) => STAT_STATUSES.includes(o.status));
  const totalSpend = user.totalSpend || 0;
  const avgOrderValue = completedOrders.length > 0 ? totalSpend / completedOrders.length : 0;
  const pendingOrders = orders.filter((o) =>
    ['PENDING_PAYMENT', 'CHECKING_PAYMENT'].includes(o.status)
  ).length;
  const cancelledOrders = orders.filter((o) =>
    ['PAYMENT_REJECTED', 'CANCELLED'].includes(o.status)
  ).length;

  const initials = user.name
    ? user.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : '?';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/admin/users"
          aria-label="Back to users"
          className="p-2 rounded-xl text-dark-500 hover:bg-dark-100 transition-colors inline-flex"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </Link>
        <h1 className="text-2xl font-black text-dark-900">User Detail</h1>
      </div>

      <div className="max-w-4xl space-y-5">
        {/* User Info */}
        <div className="bg-white rounded-2xl border border-dark-200 p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-brand-800 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg font-bold">{initials}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-dark-900">{user.name}</h2>
                <Badge color={user.role === USER_ROLES.ADMIN ? 'brand' : 'gray'}>{user.role}</Badge>
                {user.isMember && (
                  <span className="inline-flex items-center px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                    <Star size={10} className="mr-1" fill="currentColor" /> MEMBER
                  </span>
                )}
              </div>
              <p className="text-sm text-dark-500 mt-0.5">{user.email}</p>
              {user.phone && <p className="text-sm text-dark-500">{user.phone}</p>}
              <p className="text-xs text-dark-400 mt-1 flex items-center gap-1">
                <Calendar size={11} /> Joined {formatDate(user.createdAt)}
              </p>
            </div>
            {user.isMember && (
              <div className="text-right text-xs text-dark-500">
                <p className="font-medium text-dark-700">Member Since</p>
                <p>{formatDate(user.memberSince)}</p>
                <p className="mt-1 font-medium text-dark-700">Expires</p>
                <p>{formatDate(user.memberExpiry)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              icon: ShoppingBag,
              label: 'Total Orders',
              value: user.orderCount ?? orders.length,
              color: 'text-blue-600',
              bg: 'bg-blue-50',
            },
            {
              icon: DollarSign,
              label: 'Total Spend',
              value: formatCurrency(totalSpend),
              color: 'text-green-600',
              bg: 'bg-green-50',
            },
            {
              icon: TrendingUp,
              label: 'Avg Order Value',
              value: formatCurrency(avgOrderValue),
              color: 'text-purple-600',
              bg: 'bg-purple-50',
            },
            {
              icon: Package,
              label: 'Completed',
              value: completedOrders.length,
              color: 'text-brand-700',
              bg: 'bg-brand-50',
            },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-dark-200 p-4">
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-2`}>
                <Icon size={18} className={color} />
              </div>
              <p className="text-xs text-dark-500">{label}</p>
              <p className="font-bold text-dark-900 mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Insight pills */}
        {(pendingOrders > 0 || cancelledOrders > 0) && (
          <div className="flex flex-wrap gap-2">
            {pendingOrders > 0 && (
              <span className="text-xs px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium">
                {pendingOrders} order{pendingOrders > 1 ? 's' : ''} awaiting payment
              </span>
            )}
            {cancelledOrders > 0 && (
              <span className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-full font-medium">
                {cancelledOrders} order{cancelledOrders > 1 ? 's' : ''} rejected/cancelled
              </span>
            )}
            {completedOrders.length >= 5 && (
              <span className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                Active customer — {completedOrders.length} completed orders
              </span>
            )}
            {totalSpend >= 1_000_000 && (
              <span className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                High-value customer — {formatCurrency(totalSpend)} total spend
              </span>
            )}
          </div>
        )}

        {/* Saved Addresses */}
        {user.addresses?.length > 0 && (
          <div className="bg-white rounded-2xl border border-dark-200 p-5">
            <h2 className="font-bold text-dark-900 mb-3 flex items-center gap-2">
              <MapPin size={16} /> Saved Addresses ({user.addresses.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {user.addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`text-xs px-3 py-1.5 rounded-xl border ${
                    addr.isDefault
                      ? 'border-brand-300 bg-brand-50 text-brand-800 font-medium'
                      : 'border-dark-200 bg-dark-50 text-dark-600'
                  }`}
                >
                  {addr.label} — {addr.city}, {addr.province}
                  {addr.isDefault && ' (Default)'}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order History */}
        <div className="bg-white rounded-2xl border border-dark-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-dark-100">
            <h2 className="font-bold text-dark-900">Order History ({orders.length})</h2>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-dark-500 text-center py-10">No orders yet.</p>
          ) : (
            <div className="divide-y divide-dark-100">
              {orders.map((order) => (
                <div key={order.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-dark-600">
                        #{order.id?.slice(0, 8).toUpperCase()}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-dark-400 mt-0.5">{formatDate(order.createdAt)}</p>
                    {order.items?.length > 0 && (
                      <p className="text-xs text-dark-500 mt-0.5 truncate">
                        {order.items.map((i) => i.product?.name).filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-dark-900">{formatCurrency(order.total)}</p>
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="text-xs text-brand-700 hover:underline"
                    >
                      Detail
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminUserDetailPage;
