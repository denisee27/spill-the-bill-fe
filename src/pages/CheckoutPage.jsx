import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  CheckCircle, MapPin, Plus, QrCode, Upload,
  ChevronRight, Package, Tag, Copy,
} from 'lucide-react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useCart } from '../features/cart/hooks/useCart';
import {
  getAddresses,
  createAddress,
  createOrder,
  uploadPaymentProof,
} from '../features/orders/services/order.service';
import { Navbar } from '../shared/components/Navbar';
import Button from '../shared/components/Button';
import Input from '../shared/components/Input';
import Modal from '../shared/components/Modal';
import ImageUpload from '../shared/components/ImageUpload';
import LoadingSpinner from '../shared/components/LoadingSpinner';
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
  const [searchParams] = useSearchParams();
  const itemIds = searchParams.get('items')?.split(',').filter(Boolean) || [];
  const voucherCode = searchParams.get('voucher') || '';

  const [step, setStep] = useState(CHECKOUT_STEPS.ADDRESS);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addAddressOpen, setAddAddressOpen] = useState(false);
  const [proofFiles, setProofFiles] = useState([]);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [submitted, setSubmitted] = useState(false);

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
      toast.success('Address saved!');
      setAddAddressOpen(false);
      reset();
      refetchAddresses();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to add address'),
  });

  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      const order = data?.data || data?.order || data;
      setCreatedOrder(order);
      setStep(CHECKOUT_STEPS.PAYMENT);
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
      setSubmitted(true);
      toast.success('Payment proof submitted!');
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to upload proof'),
  });

  const handleAddressNext = () => {
    if (!selectedAddressId) {
      toast.error('Please select a delivery address');
      return;
    }
    createOrderMutation.mutate({
      addressId: selectedAddressId,
      cartItemIds: itemIds,
      voucherCode: voucherCode || undefined,
    });
  };

  const handleUploadProof = () => {
    if (proofFiles.length === 0) {
      toast.error('Please upload at least one payment proof');
      return;
    }
    uploadProofMutation.mutate({ orderId: createdOrder?.id, files: proofFiles });
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
  const summaryTotal = createdOrder?.total ?? Math.max(0, summarySubtotal - summaryDiscount);

  // ── Success screen ──
  if (submitted) {
    return (
      <div className="min-h-screen bg-dark-50">
        <Navbar user={user} cartCount={cartCount} onLogout={logout} />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
          <div
            className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm animate-fade-up"
            style={{ animationDelay: '0ms' }}
          >
            <CheckCircle size={48} className="text-green-600" strokeWidth={1.5} />
          </div>
          <h1
            className="text-3xl font-black text-dark-900 mb-2 animate-fade-up"
            style={{ animationDelay: '100ms' }}
          >
            Order Placed!
          </h1>
          <p
            className="text-dark-500 mb-1 animate-fade-up"
            style={{ animationDelay: '180ms' }}
          >
            Payment proof submitted successfully.
          </p>
          <p
            className="text-dark-400 text-sm mb-8 animate-fade-up"
            style={{ animationDelay: '240ms' }}
          >
            We&apos;ll verify your payment and notify you once it&apos;s approved.
          </p>
          {createdOrder?.id && (
            <p
              className="text-xs text-dark-400 mb-8 font-mono bg-dark-100 px-3 py-1.5 rounded-full animate-fade-up"
              style={{ animationDelay: '300ms' }}
            >
              Order #{createdOrder.id.slice(0, 8).toUpperCase()}
            </p>
          )}
          <div
            className="flex gap-3 animate-fade-up"
            style={{ animationDelay: '360ms' }}
          >
            <Button variant="primary" onClick={() => navigate('/orders')}>
              View My Orders
            </Button>
            <Button variant="outline" onClick={() => navigate('/home')}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
                            onClick={() => setSelectedAddressId(addr.id)}
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
                                  {addr.isDefault && (
                                    <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full font-medium">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-dark-700 mt-0.5 font-medium">{addr.recipientName}</p>
                                <p className="text-xs text-dark-500 mt-0.5">{addr.phone}</p>
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

                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full mt-5"
                    onClick={handleAddressNext}
                    disabled={!selectedAddressId || createOrderMutation.isPending}
                  >
                    {createOrderMutation.isPending ? (
                      <span className="flex items-center gap-2"><LoadingSpinner size="sm" /> Creating order...</span>
                    ) : (
                      <span className="flex items-center gap-2">Continue to Payment <ChevronRight size={16} /></span>
                    )}
                  </Button>
                </div>
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

                {/* Bank transfer */}
                <div className="bg-dark-900 rounded-2xl p-5">
                  <p className="text-sm font-semibold text-dark-300 mb-3">Transfer to:</p>
                  <div className="space-y-3">
                    {[
                      { bank: 'BCA', number: '1234567890' },
                      { bank: 'BNI', number: '0987654321' },
                    ].map(({ bank, number }) => (
                      <div key={bank} className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-3">
                        <div>
                          <p className="text-xs font-bold text-dark-400">{bank}</p>
                          <p className="font-mono font-black text-white text-xl tracking-widest">{number}</p>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(number);
                            toast.success(`${bank} number copied!`);
                          }}
                          className="text-xs text-brand-400 hover:text-brand-300 font-bold px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    ))}
                    <p className="text-xs text-dark-500 text-center pt-1">a.n. Spill the Bill</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10 text-center">
                    <p className="text-xs text-dark-400 mb-1">Total to pay</p>
                    <p className="text-2xl font-black text-brand-400">
                      {formatCurrency(createdOrder?.total || 0)}
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={() => setStep(CHECKOUT_STEPS.UPLOAD_PROOF)}
                >
                  <Upload size={16} />
                  I&apos;ve paid — upload proof
                </Button>
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

      {/* ── Add Address Modal ── */}
      <Modal
        isOpen={addAddressOpen}
        onClose={() => setAddAddressOpen(false)}
        title="Add New Address"
        size="md"
      >
        <form onSubmit={handleSubmit((d) => createAddressMutation.mutate(d))} className="space-y-4">
          <Input
            label="Label"
            placeholder="e.g. Home, Office"
            error={errors.label?.message}
            {...register('label', { required: 'Label is required' })}
          />
          <Input
            label="Recipient Name"
            required
            placeholder="Full name"
            error={errors.recipientName?.message}
            {...register('recipientName', { required: 'Recipient name is required' })}
          />
          <Input
            label="Phone"
            required
            type="tel"
            placeholder="08xxxxxxxxxx"
            error={errors.phone?.message}
            {...register('phone', { required: 'Phone is required' })}
          />
          <Input
            label="Street Address"
            required
            placeholder="Street name, building, apartment"
            error={errors.street?.message}
            {...register('street', { required: 'Street is required' })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              required
              placeholder="City"
              error={errors.city?.message}
              {...register('city', { required: 'City is required' })}
            />
            <Input
              label="Province"
              required
              placeholder="Province"
              error={errors.province?.message}
              {...register('province', { required: 'Province is required' })}
            />
          </div>
          <Input
            label="Postal Code"
            placeholder="12345"
            error={errors.postalCode?.message}
            {...register('postalCode')}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setAddAddressOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={addingAddress || createAddressMutation.isPending}>
              {createAddressMutation.isPending ? 'Saving...' : 'Save Address'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default CheckoutPage;
