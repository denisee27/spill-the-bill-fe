import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, Tag, CheckCircle, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useCart } from '../features/cart/hooks/useCart';
import { validateVoucher } from '../features/orders/services/order.service';
import { Navbar } from '../shared/components/Navbar';
import Button from '../shared/components/Button';
import EmptyState from '../shared/components/EmptyState';
import LoadingSpinner from '../shared/components/LoadingSpinner';
import { Footer } from '../shared/components/Footer';
import { formatCurrency } from '../shared/utils/format';
import { imageUrl } from '../shared/utils/format';

export function CartPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [voucherCode, setVoucherCode] = useState('');
  const [voucher, setVoucher] = useState(null);
  const [voucherLoading, setVoucherLoading] = useState(false);

  const { items, cartCount, isLoading, updateQuantity, removeItem } = useCart({
    isAuthenticated,
  });

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  };

  const selectedItems = items.filter((i) => selectedIds.has(i.id));
  const subtotal = selectedItems.reduce(
    (sum, i) => sum + (i.product?.price || 0) * (i.quantity || 1),
    0
  );

  // Voucher validation
  const minOrder = voucher?.minOrderAmount ?? 0;
  const voucherMet = !voucher || subtotal >= minOrder;
  const shortfall = voucher && !voucherMet ? minOrder - subtotal : 0;

  let discount = 0;
  if (voucher && voucherMet) {
    if (voucher.type === 'PERCENTAGE') {
      discount = Math.round((subtotal * voucher.value) / 100);
    } else {
      discount = Math.min(voucher.value, subtotal);
    }
  }
  const total = Math.max(0, subtotal - discount);

  const handleVoucherApply = async () => {
    if (!voucherCode.trim()) return;
    setVoucherLoading(true);
    try {
      const res = await validateVoucher(voucherCode.trim());
      const v = res?.data?.voucher ?? res?.voucher ?? res?.data ?? res;
      setVoucher(v);
      // Success toast only if requirements already met
      if (subtotal >= (v.minOrderAmount ?? 0)) {
        toast.success(`Voucher applied! -${v.type === 'PERCENTAGE' ? v.value + '%' : formatCurrency(v.value)}`);
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.response?.data?.message || 'Invalid voucher code');
      setVoucher(null);
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleRemoveVoucher = () => {
    setVoucher(null);
    setVoucherCode('');
  };

  const handleCheckout = () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one item to checkout');
      return;
    }
    if (!voucherMet) {
      toast.error(`Add ${formatCurrency(shortfall)} more to use this voucher`);
      return;
    }
    const ids = Array.from(selectedIds).join(',');
    navigate(`/checkout?items=${ids}${voucher ? `&voucher=${voucher.code}` : ''}`);
  };

  return (
    <div className="min-h-screen bg-dark-50 animate-fade-up">
      <Navbar user={user} cartCount={cartCount} onLogout={logout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-black text-dark-900 mb-6">
          Shopping Cart
          {items.length > 0 && (
            <span className="ml-2 text-base font-normal text-dark-500">
              ({items.length} item{items.length !== 1 ? 's' : ''})
            </span>
          )}
        </h1>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            description="Browse our products and add something you love."
            action={
              <Link to="/home">
                <Button variant="primary">Browse Products</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ── Item list ── */}
            <div className="lg:col-span-2 space-y-3">
              {/* Select all */}
              <div className="bg-white rounded-xl border border-dark-200 px-4 py-3 flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.size === items.length && items.length > 0}
                  onChange={toggleAll}
                  className="w-4 h-4 accent-brand-800 cursor-pointer"
                />
                <span className="text-sm font-medium text-dark-700">
                  Select All ({items.length})
                </span>
              </div>

              {items.map((item) => {
                const product = item.product || item;
                const rawImgs = typeof product?.images === 'string' ? (() => { try { return JSON.parse(product.images); } catch { return []; } })() : (product?.images || []);
                const img = rawImgs?.[0]?.url || rawImgs?.[0];
                const variantLabel = item.variant?.name || item.productVariant?.name;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-dark-200 p-4 flex gap-4"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="w-4 h-4 accent-brand-800 cursor-pointer mt-1 flex-shrink-0"
                    />
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-dark-100 flex-shrink-0">
                      {img ? (
                        <img src={imageUrl(img)} alt={product?.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-dark-200" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-dark-900 text-sm line-clamp-2">
                        {product?.name}
                      </p>
                      {variantLabel && (
                        <p className="text-xs text-dark-500 mt-0.5">{variantLabel}</p>
                      )}
                      <p className="text-dark-400 text-xs mt-0.5">
                        {formatCurrency(product?.price)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                          disabled={(item.quantity || 1) <= 1}
                          className="w-7 h-7 rounded-lg border border-dark-300 flex items-center justify-center hover:bg-dark-50 disabled:opacity-40"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-sm font-semibold w-6 text-center">
                          {item.quantity || 1}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                          className="w-7 h-7 rounded-lg border border-dark-300 flex items-center justify-center hover:bg-dark-50"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-end gap-2">
                      <p className="text-sm font-black text-dark-900">
                        {formatCurrency((product?.price || 0) * (item.quantity || 1))}
                      </p>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-dark-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Summary ── */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-dark-200 p-5 space-y-4">
                <h2 className="font-bold text-dark-900">Order Summary</h2>

                {/* Voucher input */}
                {!voucher ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-dark-700 flex items-center gap-1">
                      <Tag size={14} /> Voucher Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleVoucherApply()}
                        placeholder="Enter code"
                        className="flex-1 px-3 py-2 border border-dark-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleVoucherApply}
                        disabled={voucherLoading || !voucherCode.trim()}
                      >
                        {voucherLoading ? '...' : 'Apply'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Voucher status card */
                  <div
                    className={`rounded-xl border p-3 ${
                      voucherMet
                        ? 'bg-green-50 border-green-200'
                        : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        {voucherMet ? (
                          <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <p className={`text-xs font-bold ${voucherMet ? 'text-green-800' : 'text-amber-800'}`}>
                            {voucher.code}
                            {' — '}
                            {voucher.type === 'PERCENTAGE'
                              ? `${voucher.value}% off`
                              : `${formatCurrency(voucher.value)} off`}
                          </p>

                          {minOrder > 0 && (
                            <p className={`text-xs mt-0.5 ${voucherMet ? 'text-green-700' : 'text-amber-700'}`}>
                              Min. order: {formatCurrency(minOrder)}
                            </p>
                          )}

                          {voucherMet ? (
                            <p className="text-xs text-green-700 font-medium mt-1">
                              ✓ Requirements met — saving{' '}
                              <span className="font-bold">{formatCurrency(discount)}</span>
                            </p>
                          ) : (
                            <div className="mt-1.5 space-y-0.5">
                              <p className="text-xs text-amber-700 font-medium">
                                Requirements not met yet
                              </p>
                              <p className="text-xs text-amber-600">
                                Your selection:{' '}
                                <span className="font-semibold">{formatCurrency(subtotal)}</span>
                              </p>
                              {selectedIds.size === 0 ? (
                                <p className="text-xs text-amber-600">
                                  Select items to continue.
                                </p>
                              ) : (
                                <p className="text-xs text-amber-600">
                                  Add{' '}
                                  <span className="font-bold">{formatCurrency(shortfall)}</span>{' '}
                                  more to unlock this voucher.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveVoucher}
                        className="flex-shrink-0 p-0.5 text-dark-400 hover:text-dark-700 rounded transition-colors"
                        title="Remove voucher"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Totals */}
                <div className="border-t border-dark-100 pt-3 space-y-2">
                  <div className="flex justify-between text-sm text-dark-700">
                    <span>Selected Items ({selectedItems.length})</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {voucher && (
                    <div className={`flex justify-between text-sm ${voucherMet ? 'text-green-700' : 'text-dark-400 line-through'}`}>
                      <span>Voucher Discount</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-dark-100 pt-2">
                    <span className="font-bold text-dark-900">Total</span>
                    <span className="font-black text-lg text-brand-800">{formatCurrency(total)}</span>
                  </div>
                </div>

                {/* Checkout button + hint */}
                <div className="space-y-2">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleCheckout}
                    disabled={selectedIds.size === 0 || !voucherMet}
                  >
                    Checkout ({selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''})
                  </Button>

                  {voucher && !voucherMet && selectedIds.size > 0 && (
                    <p className="text-xs text-amber-600 text-center">
                      Select{' '}
                      <span className="font-semibold">{formatCurrency(shortfall)}</span>{' '}
                      more in items to enable checkout with this voucher, or{' '}
                      <button
                        onClick={handleRemoveVoucher}
                        className="underline font-medium hover:text-amber-800"
                      >
                        remove the voucher
                      </button>
                      .
                    </p>
                  )}
                </div>
              </div>

              <Link
                to="/home"
                className="block text-center text-sm text-dark-500 hover:text-brand-800 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default CartPage;
