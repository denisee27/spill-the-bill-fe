import { useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ChevronLeft, CheckCircle, XCircle, RefreshCw, X, Plus, MapPin, Tag, FileText, User, Phone, Mail, Truck } from 'lucide-react';
import { ImageLightbox } from '../../../shared/components/ImageLightbox';
import { useOrder } from '../../orders/hooks/useOrders';
import { OrderStatusBadge } from '../../orders/components/OrderStatusBadge';
import { approvePayment, rejectPayment, processRefund, deliverOrder, adminRequestRefund } from '../../orders/services/order.service';
import Button from '../../../shared/components/Button';
import Modal from '../../../shared/components/Modal';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import { formatCurrency, formatDateTime, imageUrl } from '../../../shared/utils/format';
import { ORDER_STATUS } from '../../../shared/constants';

function RefundProofUpload({ files, onChange }) {
  const inputRef = useRef(null);

  const handleAdd = (e) => {
    const newFiles = Array.from(e.target.files);
    onChange([...files, ...newFiles]);
    e.target.value = '';
  };

  const handleRemove = (i) => onChange(files.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {files.map((file, i) => (
          <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-dark-200 bg-dark-50 flex-shrink-0">
            <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(i)}
              aria-label={`Remove image ${i + 1}`}
              className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700"
            >
              <X size={9} aria-hidden="true" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Add refund proof image"
          className="w-20 h-20 border-2 border-dashed border-dark-300 rounded-xl flex flex-col items-center justify-center gap-1 text-dark-400 hover:border-brand-600 hover:text-brand-700 transition-colors flex-shrink-0"
        >
          <Plus size={16} aria-hidden="true" />
          <span className="text-xs" aria-hidden="true">Add</span>
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAdd} />
    </div>
  );
}

export function AdminOrderDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { data, isLoading } = useOrder(id);
  const order = data?.data || data?.order || data;

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [deliverOpen, setDeliverOpen] = useState(false);
  const [adminRefundOpen, setAdminRefundOpen] = useState(false);
  const [refundProofs, setRefundProofs] = useState([]);
  const [deliverProofs, setDeliverProofs] = useState([]);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { register: registerRefund, handleSubmit: handleRefundSubmit, reset: resetRefund } = useForm();
  const { register: registerDeliver, handleSubmit: handleDeliverSubmit, reset: resetDeliver } = useForm();
  const { register: registerAdminRefund, handleSubmit: handleAdminRefundSubmit, reset: resetAdminRefund } = useForm();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['order', id] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
  };

  const approveMutation = useMutation({
    mutationFn: () => approvePayment(id),
    onSuccess: () => {
      toast.success('Payment approved!');
      invalidate();
      setApproveOpen(false);
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to approve payment'),
  });

  const rejectMutation = useMutation({
    mutationFn: (payload) => rejectPayment(id, payload),
    onSuccess: () => {
      toast.success('Payment rejected.');
      invalidate();
      setRejectOpen(false);
      reset();
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to reject payment'),
  });

  const refundMutation = useMutation({
    mutationFn: ({ notes }) => {
      const fd = new FormData();
      if (notes) fd.append('notes', notes);
      refundProofs.forEach((file) => fd.append('proofs', file));
      return processRefund(id, fd);
    },
    onSuccess: () => {
      toast.success('Refund processed successfully!');
      invalidate();
      setRefundOpen(false);
      setRefundProofs([]);
      resetRefund();
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to process refund'),
  });

  const adminRefundMutation = useMutation({
    mutationFn: ({ reason }) => adminRequestRefund(id, { reason }),
    onSuccess: () => {
      toast.success('Refund requested. Customer will be notified.');
      invalidate();
      setAdminRefundOpen(false);
      resetAdminRefund();
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to request refund'),
  });

  const deliverMutation = useMutation({
    mutationFn: ({ notes, estimatedDeliveryDate }) => {
      const fd = new FormData();
      if (notes) fd.append('notes', notes);
      if (estimatedDeliveryDate) fd.append('estimatedDeliveryDate', estimatedDeliveryDate);
      deliverProofs.forEach((file) => fd.append('proofs', file));
      return deliverOrder(id, fd);
    },
    onSuccess: () => {
      toast.success('Order marked as delivered. Email sent to customer.');
      invalidate();
      setDeliverOpen(false);
      setDeliverProofs([]);
      resetDeliver();
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to mark as delivered'),
  });

  const items = order?.orderItems || order?.items || [];
  const proofs = order?.paymentProofs || order?.proofs || [];
  const refundRequest = order?.refundRequest;
  const refundDetail = order?.refundDetail;

  const parseAdminProofImages = (raw) => {
    try { return JSON.parse(raw || '[]'); } catch { return []; }
  };

  const hasPaymentProof = proofs.length > 0;
  const showApproveReject = order?.status === ORDER_STATUS.CHECKING_PAYMENT;
  const showProcessRefund = order?.status === 'REFUND_REQUESTED';
  const showDeliver = ['PAYMENT_APPROVED', 'PROCESSING'].includes(order?.status);

  const deliveryProofImages = (() => {
    try { return JSON.parse(order?.deliveryProofImages || '[]'); } catch { return []; }
  })();

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/admin/orders"
          aria-label="Back to orders"
          className="p-2 rounded-xl text-dark-500 hover:bg-dark-100 transition-colors inline-flex"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </Link>
        <h1 className="text-2xl font-black text-dark-900">Order Detail</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : !order ? (
        <p className="text-dark-500">Order not found.</p>
      ) : (
        <div className="max-w-3xl space-y-5">
          {/* Header */}
          <div className="bg-white rounded-2xl border border-dark-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs text-dark-400 font-mono">
                  #{order.orderNumber || order.id?.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-xs text-dark-400">{formatDateTime(order.createdAt)}</p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            <div className="mt-4 pt-4 border-t border-dark-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-start gap-2">
                <User size={14} className="text-dark-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-dark-400">Customer</p>
                  <Link
                    to={`/admin/users/${order.user?.id}`}
                    className="text-sm font-semibold text-brand-700 hover:text-brand-900 hover:underline"
                  >
                    {order.user?.name || '-'}
                  </Link>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail size={14} className="text-dark-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-dark-400">Email</p>
                  <p className="text-sm text-dark-700">{order.user?.email || '-'}</p>
                </div>
              </div>
              {order.user?.phone && (
                <div className="flex items-start gap-2">
                  <Phone size={14} className="text-dark-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-dark-400">Phone</p>
                    <p className="text-sm text-dark-700">{order.user.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-2xl border border-dark-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={15} className="text-brand-700" />
              <h2 className="font-bold text-dark-900">Delivery Address</h2>
            </div>
            {order.address ? (
              <div className="bg-dark-50 rounded-xl px-4 py-3 text-sm space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-dark-900">{order.address.label || 'Address'}</span>
                  {order.address.isDefault && (
                    <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full font-medium">Default</span>
                  )}
                </div>
                <p className="text-dark-700 font-medium">{order.address.recipientName}</p>
                <p className="text-dark-500">{order.address.phone}</p>
                <p className="text-dark-500">
                  {order.address.street}, {order.address.city}, {order.address.province}{' '}
                  {order.address.postalCode}
                </p>
              </div>
            ) : (
              <p className="text-sm text-dark-400 italic">No delivery address specified (pickup / direct)</p>
            )}
          </div>

          {/* Items + Financial breakdown */}
          <div className="bg-white rounded-2xl border border-dark-200 p-5">
            <h2 className="font-bold text-dark-900 mb-3">Items Ordered</h2>
            <div className="space-y-3">
              {items.map((item, i) => {
                const product = item.product || {};
                const rawImgs = typeof product?.images === 'string' ? (() => { try { return JSON.parse(product.images); } catch { return []; } })() : (product?.images || []);
                const img = rawImgs?.[0]?.url || rawImgs?.[0];
                return (
                  <div key={item.id || i} className="flex gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-dark-100 flex-shrink-0">
                      {img && <img src={imageUrl(img)} alt={product.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-dark-900 truncate">
                        {product.name || item.productName}
                      </p>
                      {item.variantName && (
                        <p className="text-xs text-dark-500">{item.variantName}</p>
                      )}
                      <p className="text-xs text-dark-400">
                        {formatCurrency(item.price || product.price)} × {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-dark-900 flex-shrink-0">
                      {formatCurrency((item.price || 0) * (item.quantity || 1))}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Financial breakdown */}
            <div className="border-t border-dark-100 mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-dark-600">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal ?? 0)}</span>
              </div>
              {(order.shippingFee ?? 0) > 0 && (
                <div className="flex justify-between text-sm text-dark-600">
                  <span>Shipping fee</span>
                  <span>{formatCurrency(order.shippingFee)}</span>
                </div>
              )}
              {(order.discountAmount ?? 0) > 0 && (
                <div className="flex justify-between text-sm text-green-700">
                  <span className="flex items-center gap-1.5">
                    <Tag size={13} />
                    Voucher discount
                    {order.voucherCode && (
                      <span className="font-mono font-bold text-green-800 bg-green-100 px-1.5 py-0.5 rounded text-xs">
                        {order.voucherCode}
                      </span>
                    )}
                  </span>
                  <span>-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              {order.voucherCode && (order.discountAmount ?? 0) === 0 && (
                <div className="flex justify-between text-sm text-dark-500">
                  <span className="flex items-center gap-1.5">
                    <Tag size={13} />
                    Voucher used
                  </span>
                  <span className="font-mono font-semibold">{order.voucherCode}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-dark-900 border-t border-dark-100 pt-2 mt-1">
                <span>Total</span>
                <span className="text-brand-800">{formatCurrency(order.total ?? order.totalAmount ?? 0)}</span>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="mt-4 pt-4 border-t border-dark-100 flex gap-2">
                <FileText size={14} className="text-dark-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-dark-400 font-medium mb-0.5">Order notes</p>
                  <p className="text-sm text-dark-600">{order.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Payment Proofs */}
          {proofs.length > 0 && (
            <div className="bg-white rounded-2xl border border-dark-200 p-5">
              <h2 className="font-bold text-dark-900 mb-3">Payment Proof</h2>
              <div className="grid grid-cols-3 gap-3">
                {proofs.map((proof, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightboxSrc(imageUrl(proof.imageUrl || proof.url || proof))}
                    className="aspect-square rounded-xl overflow-hidden border border-dark-200 block"
                  >
                    <img
                      src={imageUrl(proof.imageUrl || proof.url || proof)}
                      alt={`Proof ${i + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Refund Request Section */}
          {refundRequest && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-orange-800">Refund Request</h2>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  refundRequest.status === 'APPROVED'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {refundRequest.status}
                </span>
              </div>

              <p className="text-sm text-orange-700 mb-3">
                <span className="font-medium">Reason:</span> {refundRequest.reason}
              </p>

              {/* User's refund proof images */}
              {refundRequest.images?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-orange-700 mb-2">Customer proof:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {refundRequest.images.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setLightboxSrc(imageUrl(img.imageUrl))}
                        className="aspect-square rounded-lg overflow-hidden border border-orange-200 block"
                      >
                        <img src={imageUrl(img.imageUrl)} alt={`Refund proof ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin's processed proof (if already done) */}
              {refundRequest.status === 'APPROVED' && (
                <div className="mt-3 pt-3 border-t border-orange-200">
                  {refundRequest.adminNotes && (
                    <p className="text-sm text-orange-700 mb-2">
                      <span className="font-medium">Admin notes:</span> {refundRequest.adminNotes}
                    </p>
                  )}
                  {parseAdminProofImages(refundRequest.adminProofImages).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-orange-700 mb-2">Admin refund proof:</p>
                      <div className="grid grid-cols-4 gap-2">
                        {parseAdminProofImages(refundRequest.adminProofImages).map((img, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setLightboxSrc(imageUrl(img))}
                            className="aspect-square rounded-lg overflow-hidden border border-orange-200 block"
                          >
                            <img src={imageUrl(img)} alt={`Admin proof ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Shipping Info — shown when SHIPPED or DELIVERED */}
          {['SHIPPED', 'DELIVERED'].includes(order?.status) && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
              <h2 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                <Truck size={16} />
                {order.status === 'SHIPPED' ? 'Shipping Info' : 'Delivery Proof'}
              </h2>
              {order.deliveryNotes && (
                <p className="text-sm text-blue-700 mb-3">
                  <span className="font-medium">Notes:</span> {order.deliveryNotes}
                </p>
              )}
              {order.estimatedDeliveryDate && (
                <p className="text-sm text-blue-700 mb-3">
                  <span className="font-medium">Est. delivery:</span>{' '}
                  {new Date(order.estimatedDeliveryDate).toLocaleDateString('en-US', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              )}
              {deliveryProofImages.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {deliveryProofImages.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLightboxSrc(imageUrl(img))}
                      className="aspect-square rounded-xl overflow-hidden border border-blue-200 block"
                    >
                      <img
                        src={imageUrl(img)}
                        alt={`Delivery proof ${i + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </button>
                  ))}
                </div>
              )}
              {!order.deliveryNotes && !order.estimatedDeliveryDate && deliveryProofImages.length === 0 && (
                <p className="text-sm text-blue-500 italic">No shipping notes added.</p>
              )}
            </div>
          )}

          {/* Refund Detail from user (bank/ewallet) */}
          {refundDetail && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
              <h2 className="font-bold text-blue-900 mb-3">Customer Refund Account Details</h2>
              {refundDetail.method === 'BANK' ? (
                <div className="space-y-1.5 text-sm text-blue-800">
                  <p><span className="font-medium">Bank:</span> {refundDetail.bankName}</p>
                  <p><span className="font-medium">Account No.:</span> {refundDetail.accountNumber}</p>
                  <p><span className="font-medium">Account Name:</span> {refundDetail.accountName}</p>
                </div>
              ) : (
                <div className="space-y-1.5 text-sm text-blue-800">
                  <p><span className="font-medium">E-Wallet:</span> {refundDetail.ewalletPlatform}</p>
                  <p><span className="font-medium">Number:</span> {refundDetail.ewalletNumber}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions — only shown when relevant */}
          {(showApproveReject || showProcessRefund || showDeliver) && (
            <div className="flex gap-3 flex-wrap">
              {showApproveReject && (
                <>
                  <Button
                    variant="primary"
                    className="flex-1 bg-green-700 hover:bg-green-800"
                    onClick={() => setApproveOpen(true)}
                  >
                    <CheckCircle size={16} />
                    Approve Payment
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={() => setRejectOpen(true)}
                  >
                    <XCircle size={16} />
                    Reject Payment
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
                    onClick={() => setAdminRefundOpen(true)}
                  >
                    <RefreshCw size={16} />
                    Refund
                  </Button>
                </>
              )}
              {showDeliver && (
                <Button
                  variant="primary"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => setDeliverOpen(true)}
                >
                  <Truck size={16} />
                  Mark as Shipped
                </Button>
              )}
              {showProcessRefund && (
                <Button
                  variant="primary"
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  onClick={() => setRefundOpen(true)}
                >
                  <RefreshCw size={16} />
                  Process Refund
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Approve modal */}
      <Modal isOpen={approveOpen} onClose={() => setApproveOpen(false)} title="Approve Payment" size="sm">
        <p className="text-sm text-dark-600 mb-4">
          Confirm that you have received payment for this order.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setApproveOpen(false)}>Cancel</Button>
          <Button
            variant="primary"
            className="flex-1 bg-green-700 hover:bg-green-800"
            disabled={approveMutation.isPending}
            onClick={() => approveMutation.mutate()}
          >
            {approveMutation.isPending ? 'Processing...' : 'Confirm Approve'}
          </Button>
        </div>
      </Modal>

      {/* Reject modal */}
      <Modal isOpen={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject Payment" size="sm">
        <form
          onSubmit={handleSubmit((d) => rejectMutation.mutate({ notes: d.notes }))}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Reason (optional)</label>
            <textarea
              rows={3}
              placeholder="Reason for rejection..."
              className="w-full px-3 py-2 border border-dark-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 resize-none"
              {...register('notes')}
            />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="danger"
              className="flex-1"
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject Payment'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Mark as Shipped modal */}
      <Modal
        isOpen={deliverOpen}
        onClose={() => { setDeliverOpen(false); setDeliverProofs([]); resetDeliver(); }}
        title="Mark as Shipped"
        size="md"
      >
        <form
          onSubmit={handleDeliverSubmit((d) => deliverMutation.mutate(d))}
          className="space-y-4"
        >
          <p className="text-sm text-dark-600">
            Order status will change to <strong>SHIPPED</strong>. Customer will be notified and can confirm receipt.
          </p>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">
              Shipping notes <span className="text-dark-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Shipped via JNE, tracking no. 123456789..."
              className="w-full px-3 py-2 border border-dark-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              {...registerDeliver('notes')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">
              Estimated delivery date <span className="text-dark-400 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-dark-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...registerDeliver('estimatedDeliveryDate')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">
              Shipping proof photos <span className="text-dark-400 font-normal">(receipt / package photo)</span>
            </label>
            <RefundProofUpload files={deliverProofs} onChange={setDeliverProofs} />
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => { setDeliverOpen(false); setDeliverProofs([]); resetDeliver(); }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={deliverMutation.isPending}
            >
              {deliverMutation.isPending ? 'Processing...' : 'Confirm Shipment'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Admin Request Refund modal */}
      <Modal isOpen={adminRefundOpen} onClose={() => { setAdminRefundOpen(false); resetAdminRefund(); }} title="Request Refund for Customer" size="sm">
        <form onSubmit={handleAdminRefundSubmit((d) => adminRefundMutation.mutate(d))} className="space-y-4">
          <p className="text-sm text-dark-600">
            Admin will request a refund. Customer will be notified via email to fill in their account details.
          </p>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Reason (optional)</label>
            <textarea
              rows={3}
              placeholder="e.g. Out of stock, payment issue, etc."
              className="w-full px-3 py-2 border border-dark-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              {...registerAdminRefund('reason')}
            />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setAdminRefundOpen(false); resetAdminRefund(); }}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1 bg-orange-600 hover:bg-orange-700" disabled={adminRefundMutation.isPending}>
              {adminRefundMutation.isPending ? 'Processing...' : 'Confirm Refund'}
            </Button>
          </div>
        </form>
      </Modal>

      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}

      {/* Process Refund modal */}
      <Modal isOpen={refundOpen} onClose={() => { setRefundOpen(false); setRefundProofs([]); resetRefund(); }} title="Process Refund" size="md">
        <form
          onSubmit={handleRefundSubmit((d) => refundMutation.mutate(d))}
          className="space-y-4"
        >
          <p className="text-sm text-dark-600">
            After confirmation, order status will change to <strong>REFUNDED</strong>.
          </p>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Notes (optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Funds transferred to customer's BCA account..."
              className="w-full px-3 py-2 border border-dark-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              {...registerRefund('notes')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">
              Upload refund proof <span className="text-dark-400 font-normal">(transfer screenshot, etc.)</span>
            </label>
            <RefundProofUpload files={refundProofs} onChange={setRefundProofs} />
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => { setRefundOpen(false); setRefundProofs([]); resetRefund(); }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1 bg-orange-600 hover:bg-orange-700"
              disabled={refundMutation.isPending}
            >
              {refundMutation.isPending ? 'Processing...' : 'Confirm Process Refund'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AdminOrderDetailPage;
