import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronRight } from 'lucide-react';
import { getOrders } from '../../orders/services/order.service';
import { OrderStatusBadge } from '../../orders/components/OrderStatusBadge';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import EmptyState from '../../../shared/components/EmptyState';
import { DateRangeFilter } from '../../../shared/components/DateRangeFilter';
import { formatCurrency, formatDate } from '../../../shared/utils/format';
import { ORDER_STATUS } from '../../../shared/constants';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import clsx from 'clsx';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: ORDER_STATUS.PENDING_PAYMENT, label: 'Pending' },
  { value: ORDER_STATUS.CHECKING_PAYMENT, label: 'Checking' },
  { value: ORDER_STATUS.PAYMENT_APPROVED, label: 'Approved' },
  { value: ORDER_STATUS.SHIPPED, label: 'Shipped' },
  { value: ORDER_STATUS.DELIVERED, label: 'Delivered' },
  { value: ORDER_STATUS.PAYMENT_REJECTED, label: 'Rejected' },
];

export function AdminOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const statusFilter = searchParams.get('status') || '';
  const dateRange = {
    startDate: searchParams.get('from') || '',
    endDate: searchParams.get('to') || '',
  };
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (debouncedSearch) next.set('search', debouncedSearch); else next.delete('search');
      return next;
    }, { replace: true });
  }, [debouncedSearch]);

  const setStatusFilter = (value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set('status', value); else next.delete('status');
      return next;
    }, { replace: true });
  };

  const setDateRange = ({ startDate, endDate }) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (startDate) next.set('from', startDate); else next.delete('from');
      if (endDate) next.set('to', endDate); else next.delete('to');
      return next;
    }, { replace: true });
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'orders', debouncedSearch, statusFilter, dateRange],
    queryFn: () => getOrders({
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
      dateFrom: dateRange.startDate || undefined,
      dateTo: dateRange.endDate || undefined,
    }, true),
    staleTime: 15_000,
  });

  const orders = data?.data?.orders ?? data?.orders ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-dark-900">Orders</h1>
        <p className="text-dark-500 text-sm mt-1">{orders.length} orders</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search size={15} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="search"
            aria-label="Search orders by name or email"
            placeholder="Search by name / email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-dark-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white w-56"
          />
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />

        <div className="flex gap-1 bg-white rounded-xl p-1 border border-dark-200">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              aria-pressed={statusFilter === value}
              className={clsx(
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                statusFilter === value
                  ? 'bg-brand-800 text-white'
                  : 'text-dark-500 hover:text-dark-900'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState title="No orders found" description="Try adjusting your filters." />
      ) : (
        <div className="bg-white rounded-2xl border border-dark-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dark-50 border-b border-dark-200">
                <tr>
                  <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Order</th>
                  <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Customer</th>
                  <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Date</th>
                  <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Total</th>
                  <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Status</th>
                  <th scope="col" className="text-right px-4 py-3 font-semibold text-dark-700"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {orders.map((order, i) => (
                  <tr
                    key={order.id}
                    className={clsx(
                      i % 2 === 0 ? 'bg-white' : 'bg-dark-50/50',
                      'hover:bg-brand-50 transition-colors'
                    )}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-dark-800 font-medium">
                      #{order.orderNumber || order.id?.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-dark-700">
                      {order.user?.name || order.userId || '-'}
                    </td>
                    <td className="px-4 py-3 text-dark-500">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3 font-medium text-dark-900">
                      {formatCurrency(order.total || order.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-brand-700 hover:text-brand-900 text-xs font-medium"
                      >
                        View <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrdersPage;
