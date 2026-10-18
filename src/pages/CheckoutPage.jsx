import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  CheckCircle, MapPin, Plus, QrCode, Upload,
  ChevronRight, Package, Tag, Copy, Clock, Truck,
} from 'lucide-react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useCart } from '../features/cart/hooks/useCart';
import {
  getAddresses,
  createAddress,
  createOrder,
  getOrder,
  uploadPaymentProof,
  cancelOrder,
  getShippingCost,
} from '../features/orders/services/order.service';
import { Navbar } from '../shared/components/Navbar';
import Button from '../shared/components/Button';
import Input from '../shared/components/Input';
import Modal from '../shared/components/Modal';
import ImageUpload from '../shared/components/ImageUpload';
import LoadingSpinner from '../shared/components/LoadingSpinner';
import { WilayahSelect } from '../shared/components/WilayahSelect';
import { formatCurrency } from '../shared/utils/format';
import { imageUrl } from '../shared/utils/format';
import { CHECKOUT_STEPS } from '../shared/constants';
import clsx from 'clsx';

const STEPS = [
  { id: CHECKOUT_STEPS.ADDRESS, label: 'Address', icon: MapPin },
  { id: CHECKOUT_STEPS.PAYMENT, label: 'Payment', icon: QrCode },
  { id: CHECKOUT_STEPS.UPLOAD_PROOF, label: 'Proof', icon: Upload },
];

export function CheckoutPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const itemIds = searchParams.get('items')?.split(',').filter(Boolean) || [];
  const voucherCode = searchParams.get('voucher') || '';

  const [step, setStep] = useState(CHECKOUT_STEPS.ADDRESS);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addAddressOpen, setAddAddressOpen] = useState(false);
  const [proofFiles, setProofFiles] = useState([]);
  const [createdOrder, setCreatedOrder] = useState(null);
const [timeLeft, setTimeLeft] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const expiredRef = useRef(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [addrRegion, setAddrRegion] = useState({ province: null, regency: null, district: null, village: null });

  // Shipping state
  const [shippingOptions, setShippingOptions] = useState([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState(null);
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [orderNote, setOrderNote] = useState('');

  const { items: cartItems, cartCount } = useCart({ isAuthenticated });

  const selectedCartItems = itemIds.length > 0
    ? cartItems.filter((i) => itemIds.includes(i.id))
    : cartItems;

  const {
    data: addressData,
    isLoading: addressLoading,
    refetch: refetchAddresses,
  } = useQuery({
    queryKey: ['addresses'],
    queryFn: getAddresses,
    enabled: isAuthenticated,
  });
  const addresses = addressData?.data || addressData?.addresses || addressData || [];

  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting: addingAddress },
  } = useForm();

  const createAddressMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      toast.success('Alamat berhasil disimpan!');
      setAddAddressOpen(false);
      reset();
      setAddrRegion({ province: null, regency: null, district: null, village: null });
      refetchAddresses();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to add address'),
  });

  // Restore in-progress order on page refresh
  useEffect(() => {
    const orderIdParam = searchParams.get('orderId');
    const stepParam = parseInt(searchParams.get('step'));
    if (!orderIdParam || !stepParam || stepParam <= CHECKOUT_STEPS.ADDRESS) return;

    getOrder(orderIdParam)
      .then((data) => {
        const order = data?.data || data?.order || data;
        if (!order) return;
        if (order.status !== 'PENDING_PAYMENT') {
          // Already past payment — go to order detail
          navigate(`/orders/${order.id}`, { replace: true });
          return;
        }
        setCreatedOrder(order);
        setStep(stepParam);
      })
      .catch(() => {
        // Order not found or error — stay on step 1
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      const order = data?.data || data?.order || data;
      setCreatedOrder(order);
      setStep(CHECKOUT_STEPS.PAYMENT);
      setConfirmModalOpen(false);
      // Persist orderId + step in URL so refresh works
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('orderId', order.id);
        next.set('step', CHECKOUT_STEPS.PAYMENT);
        return next;
      });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to create order'),
  });

  const uploadProofMutation = useMutation({
    mutationFn: ({ orderId, files }) => {
      const fd = new FormData();
      files.forEach((f) => fd.append('proofs', f));
      return uploadPaymentProof(orderId, fd);
    },
    onSuccess: () => {
      navigate(`/orders/${createdOrder?.id}`);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to upload proof'),
  });

  // True if every selected item has freeShipping enabled
  const allFreeShipping = selectedCartItems.length > 0 &&
    selectedCartItems.every((item) => item?.product?.freeShipping === true);

  // Fetch shipping cost whenever address changes
  const fetchShipping = useCallback(async (addressId) => {
    if (!addressId) return;

    const addr = addresses.find((a) => a.id === addressId);
    if (!addr?.city) return;

    // All products have free shipping — skip API call
    if (allFreeShipping) {
      setShippingOptions([]);
      setShippingError(null);
      setShippingLoading(false);
      setSelectedCourier(null);
      return;
    }

    // Try to get origin city from any cart item's product origin
    const originCity = selectedCartItems.reduce((found, item) => {
      return found || item?.product?.origin?.city || null;
    }, null);

    setShippingLoading(true);
    setShippingError(null);
    setShippingOptions([]);
    setSelectedCourier(null);

    if (!originCity) {
      setShippingLoading(false);
      setShippingError('Origin city not configured on product(s). Set origin in the admin panel to enable shipping cost calculation.');
      return;
    }

    try {
      const res = await getShippingCost({ originCity, destinationCity: addr.city, weight: 1000 });
      const raw = res?.data ?? [];
      const options = raw
        .map((s) => ({
          key: `${s.code}-${s.service}`,
          courier: s.name,
          service: s.service,
          description: s.description,
          cost: s.cost ?? 0,
          etd: s.etd ?? '',
        }))
        .filter((o) => o.cost > 0);
      setShippingOptions(options);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || '';
      setShippingError(msg.includes('City not found')
        ? `City not found in RajaOngkir database. Check the origin/destination city name.`
        : 'Failed to load shipping options. Please try again.');
    } finally {
      setShippingLoading(false);
    }
  }, [addresses, selectedCartItems, allFreeShipping]);

  const handleAddressSelect = (id) => {
    setSelectedAddressId(id);
    setSelectedCourier(null);
    setShippingOptions([]);
    fetchShipping(id);
  };

  const handleAddressNext = () => {
    if (!selectedAddressId) {
      toast.error('Please select a delivery address');
      return;
    }
    if (shippingOptions.length > 0 && !selectedCourier) {
      toast.error('Please select a shipping courier');
      return;
    }
    setConfirmModalOpen(true);
  };

  const handleConfirmOrder = () => {
    createOrderMutation.mutate({
      addressId: selectedAddressId,
      cartItemIds: itemIds,
      voucherCode: voucherCode || undefined,
      shippingFee: selectedCourier?.cost ?? 0,
      courierService: selectedCourier ? `${selectedCourier.courier} ${selectedCourier.service}` : undefined,
      notes: orderNote.trim() || undefined,
    });
  };

  const handleUploadProof = () => {
    if (proofFiles.length === 0) {
      toast.error('Please upload at least one payment proof');
      return;
    }
    uploadProofMutation.mutate({ orderId: createdOrder?.id, files: proofFiles });
  };

  useEffect(() => {
    if (!createdOrder || step !== CHECKOUT_STEPS.PAYMENT) return;
    expiredRef.current = false;
    const expiryMs = createdOrder.expiresAt
      ? new Date(createdOrder.expiresAt).getTime()
      : new Date(createdOrder.createdAt).getTime() + 30 * 60 * 1000;

    const interval = setInterval(() => {
      const left = Math.max(0, expiryMs - Date.now());
      setTimeLeft(left);
      if (left === 0 && !expiredRef.current) {
        expiredRef.current = true;
        cancelOrder(createdOrder.id).catch(() => {}).finally(() => navigate('/orders'));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [createdOrder, step, navigate]);

  const handleCancelOrder = async () => {
    try {
      await cancelOrder(createdOrder.id);
      toast.success('Order cancelled');
      navigate('/orders');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelModalOpen(false);
    }
  };

  const copyOrderId = () => {
    const id = createdOrder?.id?.slice(0, 8).toUpperCase() || '';
    navigator.clipboard.writeText(id).then(() => toast.success('Order ID copied!'));
  };

  // ── Order summary values ──
  const summaryItems = createdOrder
    ? (createdOrder.items ?? [])
    : selectedCartItems;

  const summarySubtotal = createdOrder
    ? createdOrder.subtotal
    : summaryItems.reduce((s, i) => s + (i.product?.price || i.price || 0) * (i.quantity || 1), 0);

  const summaryDiscount = createdOrder?.discountAmount ?? 0;
  const summaryShipping = createdOrder?.shippingFee ?? (selectedCourier?.cost ?? 0);
  const summaryTotal = createdOrder?.total ?? Math.max(0, summarySubtotal - summaryDiscount + summaryShipping);

  return (
    <div className="min-h-screen bg-dark-50 animate-fade-up">
      <Navbar user={user} cartCount={cartCount} onLogout={logout} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-black text-dark-900 mb-7">Checkout</h1>

        {/* ── Stepper ── */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => {
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex items-center gap-2.5">
                  <div
                    className={clsx(
                      'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                      done
                        ? 'bg-green-500 text-white shadow-sm'
                        : active
                        ? 'bg-brand-800 text-white shadow-md ring-4 ring-brand-100'
                        : 'bg-white border-2 border-dark-300 text-dark-400'
                    )}
                  >
                    {done ? (
                      <CheckCircle size={16} strokeWidth={2.5} />
                    ) : (
                      <span className="text-xs font-bold">{s.id}</span>
                    )}
                  </div>
                  <span
                    className={clsx(
                      'text-sm font-semibold hidden sm:block',
                      active ? 'text-dark-900' : done ? 'text-green-600' : 'text-dark-400'
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 mx-3">
                    <div className={clsx('h-0.5 rounded-full transition-all duration-500', done ? 'bg-green-400' : 'bg-dark-200')} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Main layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: step content */}
          <div className="lg:col-span-3 space-y-4">

            {/* ── Step 1: Address ── */}
            {step === CHECKOUT_STEPS.ADDRESS && (
              <div className="space-y-4">
                {/* Address selector */}
                <div className="bg-white rounded-2xl border border-dark-200 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-dark-100">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-brand-700" />
                      <h2 className="font-bold text-dark-900">Delivery Address</h2>
                    </div>
                    <button
                      onClick={() => setAddAddressOpen(true)}
                      className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900 transition-colors"
                    >
                      <Plus size={13} /> Add New
                    </button>
                  </div>

                  <div className="p-5">
                    {addressLoading ? (
                      <div className="flex justify-center py-10">
                        <LoadingSpinner />
                      </div>
                    ) : addresses.length === 0 ? (
                      <div className="py-10 text-center">
                        <MapPin size={32} className="text-dark-300 mx-auto mb-3" />
                        <p className="text-dark-600 font-medium mb-1">No saved addresses</p>
                        <p className="text-dark-400 text-sm mb-4">Add a delivery address to continue</p>
                        <Button variant="secondary" size="sm" onClick={() => setAddAddressOpen(true)}>
                          <Plus size={14} /> Add Address
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {addresses.map((addr) => {
                          const selected = selectedAddressId === addr.id;
                          return (
                            <button
                              key={addr.id}
                              onClick={() => handleAddressSelect(addr.id)}
                              className={clsx(
                                'w-full text-left p-4 rounded-xl border-2 transition-all',
                                selected
                                  ? 'border-brand-700 bg-brand-50 shadow-sm'
                                  : 'border-dark-200 hover:border-dark-300 hover:bg-dark-50'
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <div className={clsx(
                                  'w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center',
                                  selected ? 'border-brand-700' : 'border-dark-400'
                                )}>
                                  {selected && <div className="w-2 h-2 rounded-full bg-brand-700" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-sm text-dark-900">
                                      {addr.label || 'Address'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-dark-700 mt-0.5 font-medium">{addr.recipientName}</p>
                                  <p className="text-xs text-dark-400 mt-0.5">
                                    {addr.street}, {addr.city}, {addr.province} {addr.postalCode}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Shipping options ── */}
                {selectedAddressId && (
                  <div className="bg-white rounded-2xl border border-dark-200 overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-dark-100">
                      <Truck size={16} className="text-brand-700" />
                      <h2 className="font-bold text-dark-900">Shipping</h2>
                    </div>

                    <div className="p-5">
                      {allFreeShipping ? (
                        <div className="flex items-center gap-3 py-3 px-4 bg-green-50 border border-green-200 rounded-xl">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <Truck size={16} className="text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-green-800">Gratis Ongkir</p>
                            <p className="text-xs text-green-600 mt-0.5">Semua produk dalam pesanan ini ditanggung penjual.</p>
                          </div>
                          <span className="ml-auto text-sm font-bold text-green-700">Rp 0</span>
                        </div>
                      ) : shippingLoading ? (
                        <div className="flex items-center gap-3 py-6 justify-center">
                          <LoadingSpinner size="sm" />
                          <span className="text-sm text-dark-500">Fetching shipping options...</span>
                        </div>
                      ) : shippingError ? (
                        <div className="flex flex-col items-start gap-2 py-2">
                          <p className="text-sm text-red-600">{shippingError}</p>
                          <button
                            type="button"
                            onClick={() => fetchShipping(selectedAddressId)}
                            className="text-xs font-semibold text-brand-800 underline hover:text-brand-600"
                          >
                            Coba lagi
                          </button>
                        </div>
                      ) : shippingOptions.length === 0 ? (
                        <p className="text-sm text-dark-400 py-2">No shipping options available for this route.</p>
                      ) : (
                        <div className="space-y-5">
                          {Object.entries(
                            shippingOptions.reduce((acc, opt) => {
                              if (!acc[opt.courier]) acc[opt.courier] = [];
                              acc[opt.courier].push(opt);
                              return acc;
                            }, {})
                          ).map(([carrier, services]) => (
                            <div key={carrier}>
                              <p className="text-xs font-bold text-dark-400 uppercase tracking-widest mb-2">
                                {carrier}
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {services.map((opt) => {
                                  const picked = selectedCourier?.key === opt.key;
                                  return (
                                    <button
                                      key={opt.key}
                                      onClick={() => setSelectedCourier(opt)}
                                      className={clsx(
                                        'relative text-left p-3 rounded-xl border-2 transition-all',
                                        picked
                                          ? 'border-brand-700 bg-brand-50 shadow-sm'
                                          : 'border-dark-200 hover:border-dark-300 hover:bg-dark-50'
                                      )}
                                    >
                                      {picked && (
                                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-brand-700 flex items-center justify-center flex-shrink-0">
                                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        </div>
                                      )}
                                      <p className={clsx('text-xs font-black pr-5', picked ? 'text-brand-800' : 'text-dark-900')}>
                                        {opt.service}
                                      </p>
                                      {opt.description && (
                                        <p className="text-[11px] text-dark-400 mt-0.5 leading-tight line-clamp-2">
                                          {opt.description}
                                        </p>
                                      )}
                                      <p className="text-sm font-bold text-brand-800 mt-2">
                                        {formatCurrency(opt.cost)}
                                      </p>
                                      {opt.etd && (
                                        <p className="text-[11px] text-dark-400 mt-0.5">{opt.etd} hari</p>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Note for seller */}
                <div className="bg-white rounded-2xl border border-dark-200 overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-dark-100">
                    <Tag size={15} className="text-brand-700" />
                    <h2 className="font-bold text-dark-900">Catatan untuk Penjual</h2>
                    <span className="text-xs text-dark-400 ml-1">(opsional)</span>
                  </div>
                  <div className="p-5">
                    <textarea
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      placeholder="Tulis catatan atau permintaan khusus untuk penjual..."
                      rows={3}
                      maxLength={500}
                      className="w-full px-3 py-2.5 text-sm border border-dark-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-700 placeholder:text-dark-300"
                    />
                    <p className="text-xs text-dark-400 text-right mt-1">{orderNote.length}/500</p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleAddressNext}
                  disabled={!selectedAddressId || shippingLoading || (shippingOptions.length > 0 && !selectedCourier)}
                >
                  <span className="flex items-center gap-2">
                    {shippingLoading
                      ? <><LoadingSpinner size="sm" /> Checking shipping...</>
                      : shippingOptions.length > 0 && !selectedCourier
                      ? 'Select a shipping courier'
                      : <>Continue to Payment <ChevronRight size={16} /></>
                    }
                  </span>
                </Button>
              </div>
            )}

            {/* ── Step 2: Payment ── */}
            {step === CHECKOUT_STEPS.PAYMENT && (
              <div className="space-y-4">
                {/* Order ID banner */}
                <div className="bg-white rounded-2xl border border-dark-200 px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-dark-400 font-medium">Order ID</p>
                    <p className="font-mono font-bold text-dark-900 text-sm mt-0.5">
                      #{createdOrder?.id?.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <button
                    onClick={copyOrderId}
                    className="flex items-center gap-1.5 text-xs text-brand-700 hover:text-brand-900 font-medium px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors"
                  >
                    <Copy size={13} /> Copy
                  </button>
                </div>

                {/* Countdown timer */}
                {timeLeft !== null && (
                  <div className={`rounded-2xl border px-5 py-3 flex items-center gap-3 ${timeLeft <= 60000 ? 'bg-red-50 border-red-300' : 'bg-amber-50 border-amber-200'}`}>
                    <Clock size={16} className={timeLeft <= 60000 ? 'text-red-500' : 'text-amber-500'} />
                    <div>
                      <p className={`text-xs font-medium ${timeLeft <= 60000 ? 'text-red-600' : 'text-amber-700'}`}>
                        Complete payment within
                      </p>
                      <p className={`font-mono font-black text-lg ${timeLeft <= 60000 ? 'text-red-700' : 'text-amber-800'}`}>
                        {String(Math.floor(timeLeft / 60000)).padStart(2, '0')}:{String(Math.floor((timeLeft % 60000) / 1000)).padStart(2, '0')}
                      </p>
                    </div>
                    <p className={`text-xs ml-auto ${timeLeft <= 60000 ? 'text-red-500' : 'text-amber-500'}`}>
                      Order auto-cancels if expired
                    </p>
                  </div>
                )}

                {/* QRIS */}
                <div className="bg-white rounded-2xl border border-dark-200 p-6">
                  <h2 className="font-bold text-dark-900 mb-1">Scan QRIS to Pay</h2>
                  <p className="text-xs text-dark-400 mb-5">
                    Open your banking or e-wallet app and scan the code below
                  </p>

                  <div className="flex flex-col items-center">
                    <div className="rounded-2xl overflow-hidden border-2 border-dark-200 mb-4 shadow-sm">
                      <img
                        src="/qris.jpeg"
                        alt="QRIS Payment Code"
                        className="w-64 h-64 object-contain bg-white"
                      />
                    </div>

                    <div className="w-full bg-brand-50 border border-brand-200 rounded-xl px-5 py-3 text-center">
                      <p className="text-xs text-brand-600 font-medium mb-0.5">Total to pay</p>
                      <p className="text-2xl font-black text-brand-800">
                        {formatCurrency(createdOrder?.total || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => setCancelModalOpen(true)}
                  >
                    Cancel Order
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    className="flex-1"
                    onClick={() => {
                      setStep(CHECKOUT_STEPS.UPLOAD_PROOF);
                      setSearchParams((prev) => {
                        const next = new URLSearchParams(prev);
                        next.set('step', CHECKOUT_STEPS.UPLOAD_PROOF);
                        return next;
                      });
                    }}
                  >
                    <Upload size={16} />
                    I&apos;ve paid — upload proof
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 3: Upload Proof ── */}
            {step === CHECKOUT_STEPS.UPLOAD_PROOF && (
              <div className="bg-white rounded-2xl border border-dark-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-dark-100 flex items-center gap-2">
                  <Upload size={16} className="text-brand-700" />
                  <h2 className="font-bold text-dark-900">Upload Payment Proof</h2>
                </div>

                <div className="p-5 space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-amber-600 font-medium">Amount to confirm</p>
                      <p className="font-bold text-amber-800 text-lg">
                        {formatCurrency(createdOrder?.total || 0)}
                      </p>
                    </div>
                    <p className="text-xs font-mono text-amber-500">
                      #{createdOrder?.id?.slice(0, 8).toUpperCase()}
                    </p>
                  </div>

                  <p className="text-xs text-dark-400">
                    Upload a screenshot or photo showing the transfer confirmation with the amount and recipient clearly visible.
                  </p>

                  <ImageUpload
                    files={proofFiles}
                    onChange={setProofFiles}
                    multiple
                  />

                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleUploadProof}
                    disabled={proofFiles.length === 0 || uploadProofMutation.isPending}
                  >
                    {uploadProofMutation.isPending ? (
                      <span className="flex items-center gap-2"><LoadingSpinner size="sm" /> Submitting...</span>
                    ) : (
                      `Submit ${proofFiles.length > 0 ? `(${proofFiles.length} file${proofFiles.length > 1 ? 's' : ''})` : 'Payment'}`
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Order summary ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-dark-200 overflow-hidden sticky top-6">
              <div className="px-5 py-4 border-b border-dark-100 flex items-center gap-2">
                <Package size={15} className="text-dark-500" />
                <h3 className="font-bold text-dark-900 text-sm">Order Summary</h3>
              </div>

              <div className="p-5 space-y-4">
                {/* Items */}
                <div className="space-y-3 max-h-56 overflow-y-auto pr-0.5">
                  {summaryItems.length === 0 ? (
                    <p className="text-xs text-dark-400 text-center py-4">No items</p>
                  ) : summaryItems.map((item, idx) => {
                    const product = item.product ?? item;
                    const rawImgs = typeof product?.images === 'string' ? (() => { try { return JSON.parse(product.images); } catch { return []; } })() : (product?.images || []);
                    const img = rawImgs?.[0]?.url || rawImgs?.[0];
                    const name = item.productName ?? product?.name;
                    const price = item.price ?? product?.price ?? 0;
                    const qty = item.quantity || 1;
                    return (
                      <div key={item.id ?? idx} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-dark-100 flex-shrink-0">
                          {img ? (
                            <img src={imageUrl(img)} alt={name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-dark-200" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-dark-900 truncate">{name}</p>
                          {(item.variantName) && (
                            <p className="text-xs text-dark-400">{item.variantName}</p>
                          )}
                          <p className="text-xs text-dark-500">×{qty}</p>
                        </div>
                        <p className="text-xs font-bold text-dark-900 flex-shrink-0">
                          {formatCurrency(price * qty)}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Divider */}
                <div className="border-t border-dark-100 pt-3 space-y-2">
                  <div className="flex justify-between text-xs text-dark-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(summarySubtotal)}</span>
                  </div>
                  {summaryDiscount > 0 && (
                    <div className="flex justify-between text-xs text-green-700">
                      <span className="flex items-center gap-1"><Tag size={11} /> Voucher</span>
                      <span>-{formatCurrency(summaryDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-dark-600">
                    <span className="flex items-center gap-1">
                      <Truck size={11} />
                      {selectedCourier ? `${selectedCourier.courier} ${selectedCourier.service}` : 'Shipping'}
                    </span>
                    <span>
                      {allFreeShipping
                        ? <span className="text-green-600 font-semibold">Gratis</span>
                        : shippingLoading
                        ? '...'
                        : summaryShipping > 0
                        ? formatCurrency(summaryShipping)
                        : selectedCourier
                        ? 'Free'
                        : '-'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-dark-900 border-t border-dark-100 pt-2 mt-2">
                    <span className="text-sm">Total</span>
                    <span className="text-brand-800">{formatCurrency(summaryTotal)}</span>
                  </div>
                </div>

                {/* Voucher badge */}
                {voucherCode && (
                  <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <Tag size={12} className="text-green-600 flex-shrink-0" />
                    <span className="text-xs text-green-700 font-semibold">{voucherCode}</span>
                    <span className="text-xs text-green-600 ml-auto">applied</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Confirm Order Modal ── */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Confirm Order"
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-dark-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-dark-600">
              <span>Subtotal</span>
              <span>{formatCurrency(summarySubtotal)}</span>
            </div>
            {summaryDiscount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Voucher ({voucherCode})</span>
                <span>-{formatCurrency(summaryDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-dark-600">
              <span>
                {selectedCourier ? `${selectedCourier.courier} ${selectedCourier.service}` : 'Shipping'}
              </span>
              <span>{summaryShipping > 0 ? formatCurrency(summaryShipping) : 'Free'}</span>
            </div>
            <div className="flex justify-between font-black text-dark-900 border-t border-dark-200 pt-2">
              <span>Total</span>
              <span className="text-brand-800">{formatCurrency(summaryTotal)}</span>
            </div>
          </div>
          {orderNote.trim() && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-amber-700 mb-1">Catatan untuk Penjual</p>
              <p className="text-sm text-amber-800">{orderNote.trim()}</p>
            </div>
          )}
          <p className="text-dark-500 text-sm">
            Please confirm your order. You will be shown the QRIS code to complete payment.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmModalOpen(false)}
              disabled={createOrderMutation.isPending}
            >
              Back
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleConfirmOrder}
              disabled={createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? (
                <span className="flex items-center gap-2"><LoadingSpinner size="sm" /> Placing...</span>
              ) : 'Place Order'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Cancel Order Modal ── */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Order"
        size="sm"
      >
        <p className="text-dark-600 text-sm mb-6">
          Are you sure you want to cancel this order? Stock will be restored and this action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setCancelModalOpen(false)}>
            No, keep it
          </Button>
          <Button variant="danger" className="flex-1" onClick={handleCancelOrder}>
            Yes, cancel
          </Button>
        </div>
      </Modal>

      {/* ── Add Address Modal ── */}
      <Modal
        isOpen={addAddressOpen}
        onClose={() => setAddAddressOpen(false)}
        title="Add New Address"
        size="md"
      >
        <form
          onSubmit={handleSubmit((d) => {
            if (!addrRegion.regency) {
              toast.error('Pilih kabupaten/kota terlebih dahulu');
              return;
            }
            createAddressMutation.mutate({
              label: d.label,
              recipientName: d.recipientName,
              street: d.street,
              postalCode: d.postalCode || '',
              province: addrRegion.province?.name || '',
              city: addrRegion.regency?.name || '',
              provinceCode: addrRegion.province?.id || null,
              regencyCode: addrRegion.regency?.id || null,
              districtCode: addrRegion.district?.id || null,
              villageCode: addrRegion.village?.id || null,
            });
          })}
          className="space-y-4"
        >
          <Input
            label="Label"
            placeholder="e.g. Rumah, Kantor"
            error={errors.label?.message}
            {...register('label', { required: 'Label wajib diisi' })}
          />
          <Input
            label="Nama Penerima"
            required
            placeholder="Nama lengkap"
            error={errors.recipientName?.message}
            {...register('recipientName', { required: 'Nama penerima wajib diisi' })}
          />
          <Input
            label="Alamat Lengkap"
            required
            placeholder="Nama jalan, gedung, nomor rumah"
            error={errors.street?.message}
            {...register('street', { required: 'Alamat wajib diisi' })}
          />

          <WilayahSelect
            onChange={({ province, regency, district, village }) =>
              setAddrRegion({ province, regency, district, village })
            }
          />

          <Input
            label="Kode Pos"
            placeholder="12345"
            error={errors.postalCode?.message}
            {...register('postalCode')}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setAddAddressOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={addingAddress || createAddressMutation.isPending}>
              {createAddressMutation.isPending ? 'Menyimpan...' : 'Simpan Alamat'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default CheckoutPage;
