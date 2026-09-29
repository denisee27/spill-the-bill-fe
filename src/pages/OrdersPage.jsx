import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, CreditCard, Settings, Truck, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useCart } from '../features/cart/hooks/useCart';
import { useOrders } from '../features/orders/hooks/useOrders';
import { OrderCard } from '../features/orders/components/OrderCard';
import { Navbar } from '../shared/components/Navbar';
import Button from '../shared/components/Button';
import EmptyState from '../shared/components/EmptyState';
import LoadingSpinner from '../shared/components/LoadingSpinner';
import { Footer } from '../shared/components/Footer';
import clsx from 'clsx';

const TABS = [
  {
    id: 'all',
    label: 'All',
    icon: Package,
    statuses: null,
    emptyTitle: 'No orders yet',
    emptyDesc: 'Your order history will appear here.',
  },
  {
    id: 'to_pay',
    label: 'To Pay',
    icon: CreditCard,
    statuses: ['PENDING_PAYMENT'],
    emptyTitle: 'No pending payments',
    emptyDesc: 'Orders waiting for your payment will appear here.',
  },
  {
    id: 'to_process',
    label: 'To Process',
    icon: Settings,
    statuses: ['CHECKING_PAYMENT', 'PAYMENT_APPROVED', 'PROCESSING'],
    emptyTitle: 'Nothing in process',
    emptyDesc: 'Orders being verified or prepared will appear here.',
  },
  {
    id: 'to_ship',
    label: 'To Ship',
    icon: Truck,
    statuses: ['SHIPPED'],
    emptyTitle: 'No shipments yet',
    emptyDesc: 'Orders on their way to you will appear here.',
  },
  {
    id: 'to_receive',
    label: 'To Receive',
    icon: CheckCircle,
    statuses: ['DELIVERED'],
    emptyTitle: 'No completed orders',
    emptyDesc: 'Delivered orders will appear here.',
  },
  {
    id: 'cancelled',
    label: 'Cancelled',
    icon: XCircle,
    statuses: ['PAYMENT_REJECTED', 'CANCELLED', 'REFUND_REQUESTED', 'REFUNDED'],
    emptyTitle: 'No cancelled orders',
    emptyDesc: 'Cancelled, rejected, or refunded orders will appear here.',
  },
];

export function OrdersPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart({ isAuthenticated });
  const { data, isLoading, error } = useOrders();
  const [activeTab, setActiveTab] = useState('all');

  const allOrders = data?.data?.orders ?? data?.orders ?? [];

  const currentTab = TABS.find((t) => t.id === activeTab) || TABS[0];

  const filteredOrders = currentTab.statuses
    ? allOrders.filter((o) => currentTab.statuses.includes(o.status))
    : allOrders;

  const countForTab = (tab) =>
    tab.statuses
      ? allOrders.filter((o) => tab.statuses.includes(o.status)).length
      : allOrders.length;

  return (
    <div className="min-h-screen bg-dark-50 animate-fade-up">
      <Navbar user={user} cartCount={cartCount} onLogout={logout} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-black text-dark-900 mb-5">My Orders</h1>

        {/* Tab bar */}
        <div className="bg-white border border-dark-200 rounded-2xl p-1.5 mb-5 overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max sm:min-w-0">
            {TABS.map((tab) => {
              const count = isLoading ? null : countForTab(tab);
              const isActive = activeTab === tab.id;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'w-[80px] sm:flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-semibold transition-all flex-shrink-0 sm:flex-shrink',
                    isActive
                      ? 'bg-brand-800 text-white shadow-sm'
                      : 'text-dark-400 hover:text-dark-700 hover:bg-dark-50'
                  )}
                >
                  <TabIcon size={18} aria-hidden="true" />
                  <span className="leading-none text-center">{tab.label}</span>
                  <span className={clsx(
                    'text-[10px] font-black leading-none h-4 flex items-center',
                    isActive ? 'text-white/70' : 'text-dark-300'
                  )}>
                    {isLoading ? '—' : count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            Failed to load orders. Please try again.
          </div>
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            icon={currentTab.icon}
            title={currentTab.emptyTitle}
            description={currentTab.emptyDesc}
            action={
              activeTab === 'all' && (
                <Link to="/home">
                  <Button variant="primary">Start Shopping</Button>
                </Link>
              )
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default OrdersPage;
