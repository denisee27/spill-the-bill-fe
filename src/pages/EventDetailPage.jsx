import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, MapPin, Calendar, Package } from 'lucide-react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { LoginModal } from '../features/auth/components/LoginModal';
import { useCart } from '../features/cart/hooks/useCart';
import { getEvent } from '../features/events/services/event.service';
import { Navbar } from '../shared/components/Navbar';
import { ProductGrid } from '../features/products/components/ProductGrid';
import LoadingSpinner from '../shared/components/LoadingSpinner';
import { imageUrl, formatDate } from '../shared/utils/format';

function isLiveNow(startDate, endDate) {
  if (!startDate || !endDate) return false;
  const now = Date.now();
  return now >= new Date(startDate).getTime() && now <= new Date(endDate).getTime();
}

function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return null;
  if (startDate && endDate) {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }
  if (startDate) {
    return `From ${formatDate(startDate)}`;
  }
  return null;
}

const STATUS_CONFIG = {
  ACTIVE: { style: 'bg-green-100 text-green-700', label: 'Active' },
  CLOSED: { style: 'bg-gray-100 text-gray-600', label: 'Closed' },
  DRAFT:  { style: 'bg-yellow-100 text-yellow-700', label: 'Draft' },
};

export function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEvent(id),
  });

  const event = data?.data ?? data?.event ?? data;

  const { cartCount, addItem } = useCart({
    isAuthenticated,
    onRequireAuth: () => setLoginOpen(true),
  });

  const handleAddToCart = (product) => {
    if (!isAuthenticated) {
      setPendingProduct(product);
      setLoginOpen(true);
      return;
    }
    addItem({ productId: product.id, quantity: 1 });
  };

  const handleLoginSuccess = () => {
    setLoginOpen(false);
    if (pendingProduct) {
      addItem({ productId: pendingProduct.id, quantity: 1 });
      setPendingProduct(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-50">
        <Navbar user={user} cartCount={cartCount} onLoginClick={() => setLoginOpen(true)} onLogout={logout} />
        <div className="flex items-center justify-center py-32">
          <LoadingSpinner size="lg" />
        </div>
        <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={handleLoginSuccess} />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-dark-50">
        <Navbar user={user} cartCount={cartCount} onLoginClick={() => setLoginOpen(true)} onLogout={logout} />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <p className="text-dark-500 text-lg">Event not found.</p>
          <button
            onClick={() => navigate('/home?tab=jastip')}
            className="mt-4 inline-block text-brand-700 hover:underline text-sm"
          >
            Back to Events
          </button>
        </div>
        <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={handleLoginSuccess} />
      </div>
    );
  }

  const live = isLiveNow(event.startDate, event.endDate);
  const dateRange = formatDateRange(event.startDate, event.endDate);
  const statusCfg = STATUS_CONFIG[event.status] || STATUS_CONFIG.DRAFT;

  const products = (event.products ?? []).map((ep) => ep.product);

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar user={user} cartCount={cartCount} onLoginClick={() => setLoginOpen(true)} onLogout={logout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/home?tab=jastip')}
          className="inline-flex items-center gap-1 text-sm text-dark-500 hover:text-brand-800 mb-6 transition-colors"
        >
          <ChevronLeft size={16} />
          Back to Events
        </button>

        {/* Event header */}
        <div className="rounded-2xl overflow-hidden border border-dark-200 shadow-sm mb-8">
          <div className="relative h-64">
            {event.bannerImage ? (
              <img
                src={imageUrl(event.bannerImage)}
                alt={event.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-brand-800 to-brand-950" />
            )}

            {/* Live now overlay badge */}
            {live && (
              <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-brand-800 text-white text-sm font-bold rounded-full shadow">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                LIVE NOW
              </div>
            )}

            {/* Bottom overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-6 py-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="space-y-1">
                  <h1 className="text-2xl font-black text-white leading-tight">
                    {event.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3">
                    {event.destination && (
                      <div className="flex items-center gap-1 text-white/80 text-sm">
                        <MapPin size={13} />
                        <span>{event.destination}</span>
                      </div>
                    )}
                    {dateRange && (
                      <div className="flex items-center gap-1 text-white/80 text-sm">
                        <Calendar size={13} />
                        <span>{dateRange}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-white/80 text-sm">
                      <Package size={13} />
                      <span>{products.length} product{products.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusCfg.style}`}>
                  {statusCfg.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live now banner */}
        {live && (
          <div className="mb-6 px-4 py-3 bg-brand-50 border border-brand-200 rounded-xl text-sm text-brand-800 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-800 animate-pulse" />
            This event is happening right now — order while you can!
          </div>
        )}

        {/* Event description */}
        {event.description && (
          <div className="mb-8 p-5 bg-white rounded-xl border border-dark-200">
            <p className="text-dark-600 text-sm leading-relaxed">{event.description}</p>
          </div>
        )}

        {/* Products section */}
        <div>
          <h2 className="text-xl font-black text-dark-900 mb-5">Products in this event</h2>
          <ProductGrid
            products={products}
            isLoading={false}
            onAddToCart={handleAddToCart}
          />
        </div>
      </div>

      <LoginModal
        isOpen={loginOpen}
        onClose={() => {
          setLoginOpen(false);
          setPendingProduct(null);
        }}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default EventDetailPage;
