import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ChevronLeft, UploadCloud, Clock, Eye, CheckCircle, Package, Truck, Check, XCircle, ImageOff } from 'lucide-react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useCart } from '../features/cart/hooks/useCart';
import { useOrder } from '../features/orders/hooks/useOrders';
import { OrderStatusBadge } from '../features/orders/components/OrderStatusBadge';
import {
  uploadPaymentProof,
  submitRefundDetail,
  confirmDelivery,
  cancelOrder,
} from '../features/orders/services/order.service';
import { Navbar } from '../shared/components/Navbar';
import Button from '../shared/components/Button';
import Modal from '../shared/components/Modal';
import { ConfirmModal } from '../shared/components/ConfirmModal';
import ImageUpload from '../shared/components/ImageUpload';
import LoadingSpinner from '../shared/components/LoadingSpinner';
import { Footer } from '../shared/components/Footer';
import { formatCurrency, formatDateTime, imageUrl } from '../shared/utils/format';
import { ORDER_STATUS, ORDER_STATUS_LABEL } from '../shared/constants';
import clsx from 'clsx';

const TIMELINE_STEPS = [
  { status: 'PENDING_PAYMENT', label: 'Awaiting Payment', icon: Clock },
  { status: 'CHECKING_PAYMENT', label: 'Verifying Payment', icon: Eye },
  { status: 'PAYMENT_APPROVED', label: 'Payment Confirmed', icon: CheckCircle },
  { status: 'PROCESSING', label: 'Processing', icon: Package },
  { status: 'SHIPPED', label: 'Shipped', icon: Truck },
  { status: 'DELIVERED', label: 'Delivered', icon: Check },
];

const TERMINAL_STATUSES = new Set([
  'PAYMENT_REJECTED', 'CANCELLED', 'REFUND_REQUESTED', 'REFUNDED',
]);

export function OrderDetailPage() {
  const { id } = useParams();
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart({ isAuthenticated });
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useOrder(id);
  const order = data?.data || data?.order || data;

  const [proofOpen, setProofOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [proofFiles, setProofFiles] = useState([]);
  const [refundMethod, setRefundMethod] = useState('BANK');
  const [timeLeft, setTimeLeft] = useState(null);

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (!order || order.status !== 'PENDING_PAYMENT') return;
    const deadline = new Date(order.createdAt).getTime() + 24 * 60 * 60 * 1000;
    const tick = () => {
      const diff = deadline - Date.now();
      setTimeLeft(diff > 0 ? diff : 0);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [order?.createdAt, order?.status]);

  const uploadMutation = useMutation({
    mutationFn: (files) => {
      const fd = new FormData();
      files.forEach((f) => fd.append('proofs', f));
      return uploadPaymentProof(id, fd);
    },
    onSuccess: () => {
      toast.success('Payment proof uploaded!');
      setProofOpen(false);
      setProofFiles([]);
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Upload failed'),
  });

  const refundDetailMutation = useMutation({
    mutationFn: (data) => submitRefundDetail(id, { ...data, method: refundMethod }),
    onSuccess: () => {
      toast.success('Refund details submitted!');
      reset();
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to submit refund details'),
  });

  const confirmDeliveryMutation = useMutation({
    mutationFn: () => confirmDelivery(id),
    onSuccess: () => {
      toast.success('Order confirmed as received. Thank you!');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to confirm'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(id),
    onSuccess: () => {
      toast.success('Order cancelled. Stock restored.');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to cancel order'),
  });

  const formatCountdown = (ms) => {
    if (ms === null || ms <= 0) return '00:00:00';
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    const s = Math.floor((ms % 60_000) / 1_000);
    return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
  };

  const canUploadProof = order?.status === ORDER_STATUS.PENDING_PAYMENT;

  const items = order?.orderItems || order?.items || [];
  const proofs = order?.paymentProofs || order?.proofs || [];

  return (
    <div className="min-h-screen bg-dark-50 animate-fade-up">
      <Navbar user={user} cartCount={cartCount} onLogout={logout} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/orders"
          className="inline-flex items-center gap-1 text-sm text-dark-500 hover:text-brand-800 mb-6 transition-colors"
        >
          <ChevronLeft size={16} /> Back to Orders
        </Link>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : error || !order ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            Order not found.
          </div>
        ) : (
          <div className="space-y-5">
            {/* ── Header card ── */}
            {(() => {
              const isTerminal = TERMINAL_STATUSES.has(order.status);
              const currentStepIndex = TIMELINE_STEPS.findIndex(s => s.status === order.status);
              return (
                <div className="bg-white rounded-2xl border border-dark-200 p-5">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <p className="text-sm text-dark-500">Order</p>
                      <h1 className="text-xl font-black text-dark-900">
                        #{order.orderNumber || order.id?.slice(0, 8).toUpperCase()}
                      </h1>
                      <p className="text-xs text-dark-500 mt-0.5">
                        {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  {isTerminal ? (
                    <div>
                      <div className="p-3 bg-dark-50 rounded-xl text-center text-sm font-semibold text-dark-600">
                        {ORDER_STATUS_LABEL[order.status] || order.status}
                      </div>
                      {order.status === 'PAYMENT_REJECTED' && order.rejectionNotes && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                          <p className="text-xs font-bold text-red-700 mb-1">Reason for rejection:</p>
                          <p className="text-sm text-red-600">{order.rejectionNotes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {TIMELINE_STEPS.map((step, i) => {
                        const StepIcon = step.icon;
                        const isDone = currentStepIndex > -1 && i < currentStepIndex;
                        const isCurrent = i === currentStepIndex;
                        const isLast = i === TIMELINE_STEPS.length - 1;
                        return (
                          <div key={step.status} className="flex gap-3">
                            <div className="flex flex-col items-center flex-shrink-0">
                              <div className={clsx(
                                'w-8 h-8 rounded-full flex items-center justify-center',
                                isDone ? 'bg-brand-800'
                                  : isCurrent ? 'bg-brand-800 ring-4 ring-brand-100'
                                    : 'bg-dark-100'
                              )}>
                                <StepIcon
                                  size={14}
                                  aria-hidden="true"
                                  className={isDone || isCurrent ? 'text-white' : 'text-dark-400'}
                                />
                              </div>
                              {!isLast && (
                                <div className={clsx('w-0.5 flex-1 min-h-[24px]', isDone ? 'bg-brand-800' : 'bg-dark-200')} />
                              )}
                            </div>
                            <div className={clsx('pt-1.5', isLast ? 'pb-0' : 'pb-4')}>
                              <p className={clsx(
                                'text-sm font-semibold leading-none',
                                isDone || isCurrent ? 'text-dark-900' : 'text-dark-400'
                              )}>
                                {step.label}
                              </p>
                              {isCurrent && (
                                <span className="mt-1 block text-[10px] font-bold text-brand-800 animate-pulse">
                                  Now
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── QRIS payment panel (PENDING_PAYMENT only) ── */}
            {order.status === ORDER_STATUS.PENDING_PAYMENT && (
              <div className="bg-white rounded-2xl border-2 border-brand-200 p-5">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h2 className="font-bold text-dark-900">Complete Your Payment</h2>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${timeLeft === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    <Clock size={11} />
                    {timeLeft === 0 ? 'Expired' : formatCountdown(timeLeft)}
                  </div>
                </div>
                <p className="text-xs text-dark-400 mb-5">
                  Scan the QRIS code below using your banking or e-wallet app, then upload your payment proof.
                  {timeLeft > 0 && <span className="text-amber-600 font-medium"> Order will be automatically cancelled if payment is not completed within the deadline.</span>}
                </p>

                <div className="flex flex-col items-center gap-4">
                  {/* QRIS image */}
                  <div className="rounded-2xl overflow-hidden border-2 border-dark-200 shadow-sm">
                    <img
                      src="/qris.jpeg"
                      alt="QRIS Payment Code"
                      className="w-56 h-56 object-contain bg-white"
                    />
                  </div>

                  {/* Total */}
                  <div className="w-full bg-brand-50 border border-brand-200 rounded-xl px-5 py-3 text-center">
                    <p className="text-xs text-brand-600 font-medium mb-0.5">Total to pay</p>
                    <p className="text-2xl font-black text-brand-800">
                      {formatCurrency(order.total || order.totalAmount || 0)}
                    </p>
                  </div>

                  {/* Upload proof CTA */}
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => setProofOpen(true)}
                  >
                    <UploadCloud size={16} />
                    I've paid — upload proof
                  </Button>

                  {/* Cancel button */}
                  <button
                    onClick={() => setCancelConfirmOpen(true)}
                    disabled={cancelMutation.isPending}
                    className="w-full py-2.5 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl border border-red-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle size={15} />
                    {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Items ── */}
            <div className="bg-white rounded-2xl border border-dark-200 p-5">
              <h2 className="font-bold text-dark-900 mb-3">Items</h2>
              <div className="space-y-3">
                {items.map((item, i) => {
                  const product = item.product || {};
                  const rawImgs = Array.isArray(product?.images)
                    ? product.images
                    : (() => { try { return JSON.parse(product?.images || '[]'); } catch { return []; } })();
                  const img = rawImgs?.[0]?.url || rawImgs?.[0] || null;
                  return (
                    <div key={item.id || i} className="flex gap-3">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-dark-100 flex-shrink-0">
                        <div className="absolute inset-0 flex items-center justify-center text-dark-300">
                          <ImageOff size={18} />
                        </div>
                        {img && (
                          <img
                            src={imageUrl(img)}
                            alt={product.name || item.productName}
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-dark-900">{product.name || item.productName}</p>
                        {item.variantName && (
                          <p className="text-xs text-dark-500">{item.variantName}</p>
                        )}
                        <p className="text-xs text-dark-500">
                          {formatCurrency(item.price || product.price)} x {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-dark-900 flex-shrink-0">
                        {formatCurrency((item.price || product.price || 0) * (item.quantity || 1))}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Address ── */}
            {order.address && (
              <div className="bg-white rounded-2xl border border-dark-200 p-5">
                <h2 className="font-bold text-dark-900 mb-2">Delivery Address</h2>
                <p className="text-sm font-semibold text-dark-800">{order.address.recipientName}</p>
                <p className="text-sm text-dark-600">{order.address.phone}</p>
                <p className="text-sm text-dark-600">
                  {order.address.street}, {order.address.city}, {order.address.province}{' '}
                  {order.address.postalCode}
                </p>
              </div>
            )}

            {/* ── Total breakdown ── */}
            <div className="bg-white rounded-2xl border border-dark-200 p-5">
              <h2 className="font-bold text-dark-900 mb-3">Payment Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-dark-700">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Discount</span>
                    <span>-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                {order.shippingCost !== undefined && (
                  <div className="flex justify-between text-dark-700">
                    <span>Shipping</span>
                    <span>{formatCurrency(order.shippingCost)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-dark-900 border-t border-dark-100 pt-2">
                  <span>Total</span>
                  <span className="text-brand-800">{formatCurrency(order.total || order.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* ── Payment Proofs ── */}
            {proofs.length > 0 && (
              <div className="bg-white rounded-2xl border border-dark-200 p-5">
                <h2 className="font-bold text-dark-900 mb-3">Payment Proofs</h2>
                <div className="grid grid-cols-3 gap-3">
                  {proofs.map((proof, i) => {
                    const src = imageUrl(proof.imageUrl || proof.url);
                    return (
                      <a
                        key={i}
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square rounded-xl overflow-hidden border border-dark-200 bg-dark-50 block relative"
                      >
                        <div className="absolute inset-0 flex items-center justify-center text-dark-300">
                          <ImageOff size={20} />
                        </div>
                        <img
                          src={src}
                          alt={`Proof ${i + 1}`}
                          className="relative w-full h-full object-cover hover:scale-105 transition-transform"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Shipped: delivery info + confirm receipt ── */}
            {order.status === ORDER_STATUS.SHIPPED && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
                <h2 className="font-semibold text-blue-900 flex items-center gap-2">
                  <Truck size={16} /> Order In Transit
                </h2>
                {order.estimatedDeliveryDate && (
                  <p className="text-sm text-blue-700">
                    Estimated arrival:{' '}
                    <strong>
                      {new Date(order.estimatedDeliveryDate).toLocaleDateString('en-US', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </strong>
                  </p>
                )}
                {order.deliveryNotes && (
                  <div className="text-sm text-blue-800 bg-blue-100 rounded-xl p-3">
                    <p className="font-medium mb-0.5">Shipping Notes:</p>
                    <p>{order.deliveryNotes}</p>
                  </div>
                )}
                {(() => {
                  const imgs = (() => { try { return JSON.parse(order.deliveryProofImages || '[]'); } catch { return []; } })();
                  return imgs.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-blue-700 mb-2">Shipping Proof:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {imgs.map((img, i) => (
                          <a key={i} href={imageUrl(img)} target="_blank" rel="noopener noreferrer"
                            className="aspect-square rounded-xl overflow-hidden border border-blue-200 bg-blue-50 block relative">
                            <div className="absolute inset-0 flex items-center justify-center text-blue-200">
                              <ImageOff size={18} />
                            </div>
                            <img src={imageUrl(img)} alt={`Delivery ${i + 1}`} className="relative w-full h-full object-cover hover:scale-105 transition-transform" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                <Button
                  variant="primary"
                  className="w-full bg-blue-700 hover:bg-blue-800"
                  disabled={confirmDeliveryMutation.isPending}
                  onClick={() => confirmDeliveryMutation.mutate()}
                >
                  <Check size={16} />
                  {confirmDeliveryMutation.isPending ? 'Processing...' : 'Confirm Received'}
                </Button>
              </div>
            )}

            {/* ── REFUND_REQUESTED: form isi rekening ── */}
            {order.status === 'REFUND_REQUESTED' && !order.refundDetail && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <h2 className="font-semibold text-amber-900 mb-1">Refund Account Details</h2>
                <p className="text-sm text-amber-700 mb-4">
                  Your payment will be refunded. Choose how you'd like to receive it:
                </p>
                <div className="flex gap-2 mb-4">
                  {['BANK', 'EWALLET'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setRefundMethod(m)}
                      className={clsx(
                        'flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors',
                        refundMethod === m
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50'
                      )}
                    >
                      {m === 'BANK' ? 'Bank Transfer' : 'E-Wallet'}
                    </button>
                  ))}
                </div>
                <form onSubmit={handleSubmit((d) => refundDetailMutation.mutate(d))} className="space-y-3">
                  {refundMethod === 'BANK' ? (
                    <>
                      <select {...register('bankName', { required: true })} className="w-full px-3 py-2 border border-amber-300 rounded-xl text-sm">
                        <option value="">Select Bank</option>
                        {['BCA', 'BNI', 'BRI', 'Mandiri', 'CIMB Niaga', 'BSI', 'Jenius/SMBC', 'Danamon', 'Permata'].map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                      <input {...register('accountNumber', { required: true })} placeholder="Account Number" className="w-full px-3 py-2 border border-amber-300 rounded-xl text-sm" />
                      <input {...register('accountName', { required: true })} placeholder="Account Holder Name" className="w-full px-3 py-2 border border-amber-300 rounded-xl text-sm" />
                    </>
                  ) : (
                    <>
                      <select {...register('ewalletPlatform', { required: true })} className="w-full px-3 py-2 border border-amber-300 rounded-xl text-sm">
                        <option value="">Select E-Wallet</option>
                        {['OVO', 'GoPay', 'DANA', 'ShopeePay', 'LinkAja'].map((e) => (
                          <option key={e} value={e}>{e}</option>
                        ))}
                      </select>
                      <input {...register('ewalletNumber', { required: true })} placeholder="E-Wallet Number" className="w-full px-3 py-2 border border-amber-300 rounded-xl text-sm" />
                    </>
                  )}
                  <Button type="submit" variant="primary" className="w-full bg-amber-600 hover:bg-amber-700" disabled={refundDetailMutation.isPending}>
                    {refundDetailMutation.isPending ? 'Submitting...' : 'Submit Refund Details'}
                  </Button>
                </form>
              </div>
            )}

            {order.status === 'REFUND_REQUESTED' && order.refundDetail && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <p className="text-sm font-semibold text-green-700">Refund details submitted. Admin is processing the transfer.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={cancelConfirmOpen}
        onCancel={() => setCancelConfirmOpen(false)}
        onConfirm={() => { cancelMutation.mutate(); setCancelConfirmOpen(false); }}
        variant="danger"
        title="Cancel Order"
        message="Are you sure you want to cancel this order? Stock will be restored and this cannot be undone."
        confirmLabel={cancelMutation.isPending ? 'Cancelling...' : 'Yes, Cancel'}
        cancelLabel="No, Go Back"
      />

      {/* Upload Proof Modal */}
      <Modal isOpen={proofOpen} onClose={() => setProofOpen(false)} title="Upload Payment Proof">
        <ImageUpload files={proofFiles} onChange={setProofFiles} multiple />
        <div className="flex gap-3 mt-4">
          <Button variant="outline" className="flex-1" onClick={() => setProofOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            disabled={proofFiles.length === 0 || uploadMutation.isPending}
            onClick={() => uploadMutation.mutate(proofFiles)}
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </Modal>

      <Footer />
    </div>
  );
}

export default OrderDetailPage;
