import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ShoppingCart, MessageCircle, Minus, Plus, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProduct } from '../features/products/hooks/useProduct';
import { ProductBadge } from '../features/products/components/ProductBadge';
import { useAuth } from '../features/auth/hooks/useAuth';
import { LoginModal } from '../features/auth/components/LoginModal';
import { useCart } from '../features/cart/hooks/useCart';
import { addToCart } from '../features/cart/services/cart.service';
import { Navbar } from '../shared/components/Navbar';
import Button from '../shared/components/Button';
import LoadingSpinner from '../shared/components/LoadingSpinner';
import { formatCurrency, imageUrl } from '../shared/utils/format';
import { WHATSAPP_DEFAULT_NUMBER } from '../shared/constants';
import { useWhatsappSetting } from '../features/settings/hooks/useWhatsappSetting';
import clsx from 'clsx';

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useProduct(id);
  const { user, isAuthenticated, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const buyButtonRef = useRef(null);

  const product = data?.data || data?.product || data;
  const { data: waSetting } = useWhatsappSetting();

  const { cartCount, addItem } = useCart({
    isAuthenticated,
    onRequireAuth: () => setLoginOpen(true),
  });

  useEffect(() => {
    const el = buyButtonRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [product]);

  // Reset quantity when variant changes
  useEffect(() => { setQuantity(1); }, [selectedVariant]);

  const buyNowMutation = useMutation({
    mutationFn: addToCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      navigate('/checkout');
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to proceed'),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-50">
        <Navbar user={user} cartCount={cartCount} onLoginClick={() => setLoginOpen(true)} onLogout={logout} />
        <div className="flex items-center justify-center py-32">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-dark-50">
        <Navbar user={user} cartCount={cartCount} onLoginClick={() => setLoginOpen(true)} onLogout={logout} />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <p className="text-dark-500 text-lg">Product not found.</p>
          <Link to="/home" className="mt-4 inline-block text-brand-700 hover:underline">Back to Shop</Link>
        </div>
      </div>
    );
  }

  const images = product.images || [];
  const variants = product.variants || product.ProductVariant || [];
  const hasVariants = variants.length > 0;

  // ── Price logic ─────────────────────────────────────────────────────────────
  const variantPrices = variants.map((v) => v.displayPrice ?? v.price);
  const minVariantPrice = hasVariants ? Math.min(...variantPrices) : null;
  const maxVariantPrice = hasVariants ? Math.max(...variantPrices) : null;
  const isRange = hasVariants && !selectedVariant && minVariantPrice !== maxVariantPrice;

  const displayPrice = selectedVariant
    ? (selectedVariant.displayPrice ?? selectedVariant.price)
    : (hasVariants ? minVariantPrice : (product.displayPrice ?? product.price));
  const displayOriginalPrice = selectedVariant
    ? selectedVariant.originalPrice
    : (hasVariants ? null : product.originalPrice);

  // ── Stock logic ─────────────────────────────────────────────────────────────
  const displayStock = selectedVariant ? selectedVariant.stock : (hasVariants ? null : product.stock);
  const isSoldOut = hasVariants
    ? (selectedVariant ? selectedVariant.stock === 0 : variants.every((v) => v.stock === 0))
    : (product.stock === 0);

  // ── Image logic ─────────────────────────────────────────────────────────────
  // If selected variant has its own image, show that as the hero; otherwise use gallery
  const variantImage = selectedVariant?.imageUrl ? { url: selectedVariant.imageUrl } : null;
  const currentImage = variantImage || images[selectedImageIndex] || images[0];

  const waNumber = waSetting?.phoneNumber || WHATSAPP_DEFAULT_NUMBER;
  const waMessage = `Hi! I'm interested in "${product.name}" on Spill the Bill. Can you tell me more?`;
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;

  const needsVariantSelection = hasVariants && !selectedVariant;

  const handleAddToCart = () => {
    if (!isAuthenticated) { setLoginOpen(true); return; }
    if (needsVariantSelection) { toast.error('Please select a variant first'); return; }
    addItem({ productId: product.id, variantId: selectedVariant?.id || undefined, quantity });
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) { setLoginOpen(true); return; }
    if (needsVariantSelection) { toast.error('Please select a variant first'); return; }
    buyNowMutation.mutate({
      productId: product.id,
      variantId: selectedVariant?.id || undefined,
      quantity,
    });
  };

  return (
    <div className="min-h-screen bg-dark-50 animate-fade-up">
      <Navbar user={user} cartCount={cartCount} onLoginClick={() => setLoginOpen(true)} onLogout={logout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/home"
          className="inline-flex items-center gap-1 text-sm text-dark-500 hover:text-brand-800 mb-6 transition-colors"
        >
          <ChevronLeft size={16} /> Back to Shop
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* ── Left: Images ── */}
          <div className="space-y-3">
            <div className="aspect-square rounded-2xl overflow-hidden bg-dark-100 border border-dark-200">
              {currentImage ? (
                <img
                  src={imageUrl(currentImage.url || currentImage)}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-dark-300 text-6xl">?</div>
              )}
            </div>
            {images.length > 1 && !variantImage && (
              <>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImageIndex(i)}
                      className={clsx(
                        'flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors',
                        i === selectedImageIndex ? 'border-brand-700' : 'border-dark-200 hover:border-dark-400'
                      )}
                    >
                      <img src={imageUrl(img.url || img)} alt={`thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <div className="flex justify-center gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImageIndex(i)}
                      className={clsx(
                        'rounded-full transition-all duration-200',
                        i === selectedImageIndex ? 'w-5 h-2 bg-brand-800' : 'w-2 h-2 bg-dark-300 hover:bg-dark-400'
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Right: Info ── */}
          <div className="space-y-5">
            {/* Badges */}
            <div className="flex items-center gap-2">
              <ProductBadge type={product.type} />
              {product.category && (
                <span className="px-2 py-0.5 bg-dark-100 text-dark-600 text-xs rounded-full font-medium">
                  {product.category.name}
                </span>
              )}
              {isSoldOut && (
                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-semibold">
                  Sold Out
                </span>
              )}
            </div>

            {/* Event banner */}
            {product.event && (
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-amber-600 text-sm">
                  Jastip: <strong>{product.event.name}</strong>
                  {product.event.endDate && (
                    <> · until {new Date(product.event.endDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}</>
                  )}
                </span>
              </div>
            )}

            {/* Name */}
            <h1 className="text-3xl font-black text-dark-900 leading-tight">{product.name}</h1>

            {/* Price */}
            <div>
              {isRange ? (
                <p className="text-3xl font-bold text-brand-800">
                  {formatCurrency(minVariantPrice)} – {formatCurrency(maxVariantPrice)}
                </p>
              ) : (
                <>
                  <p className="text-3xl font-bold text-brand-800">{formatCurrency(displayPrice)}</p>
                  {displayOriginalPrice && displayOriginalPrice > displayPrice && (
                    <p className="text-dark-400 text-base line-through mt-0.5">
                      {formatCurrency(displayOriginalPrice)}
                    </p>
                  )}
                </>
              )}
              {isRange && (
                <p className="text-xs text-dark-400 mt-1">Select a variant to see its price</p>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-dark-600 leading-relaxed text-sm">{product.description}</p>
            )}

            {/* Variants */}
            {hasVariants && (
              <div>
                <p className="text-sm font-semibold text-dark-700 mb-2">
                  Select Variant <span className="text-red-500">*</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    const outOfStock = v.stock === 0;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(isSelected ? null : v)}
                        disabled={outOfStock}
                        className={clsx(
                          'flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all',
                          isSelected
                            ? 'border-brand-800 bg-brand-50 text-brand-800'
                            : outOfStock
                            ? 'border-dark-200 text-dark-300 cursor-not-allowed opacity-50'
                            : 'border-dark-200 text-dark-700 hover:border-dark-400'
                        )}
                      >
                        {v.imageUrl && (
                          <img
                            src={imageUrl(v.imageUrl)}
                            alt={v.name}
                            className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="text-left">
                          <p className="leading-none">{v.name}</p>
                          <p className="text-xs mt-0.5 opacity-70">{formatCurrency(v.price)}</p>
                          {outOfStock && <p className="text-[10px] text-red-400 mt-0.5">Sold out</p>}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {needsVariantSelection && (
                  <p className="text-xs text-orange-500 mt-2">Choose a variant before adding to cart</p>
                )}
              </div>
            )}

            {/* Stock info */}
            {displayStock !== null && !isSoldOut && (
              <p className="text-xs text-dark-400">{displayStock} in stock</p>
            )}

            {/* Quantity */}
            {!isSoldOut && (
              <div>
                <p className="text-sm font-semibold text-dark-700 mb-2">Quantity</p>
                <div className="flex items-center gap-3 w-fit">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-lg border border-dark-300 flex items-center justify-center hover:bg-dark-50 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-lg font-bold text-dark-900 w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    disabled={displayStock !== null && quantity >= displayStock}
                    className="w-9 h-9 rounded-lg border border-dark-300 flex items-center justify-center hover:bg-dark-50 transition-colors disabled:opacity-40"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div ref={buyButtonRef} className="flex flex-col gap-3 pt-2">
              {isSoldOut ? (
                <div className="py-3 bg-dark-100 text-dark-400 text-center rounded-xl text-sm font-semibold">
                  This item is sold out
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    size="lg"
                    className="flex-1"
                    onClick={handleBuyNow}
                    disabled={buyNowMutation.isPending}
                  >
                    <Zap size={18} />
                    {buyNowMutation.isPending ? 'Processing...' : 'Buy Now'}
                  </Button>
                  <Button variant="outline" size="lg" className="flex-1" onClick={handleAddToCart}>
                    <ShoppingCart size={18} />
                    Add to Cart
                  </Button>
                </div>
              )}
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-green-500 text-green-700 font-medium rounded-lg text-sm hover:bg-green-50 transition-colors"
              >
                <MessageCircle size={16} />
                Ask a Question
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky bar — mobile */}
      {showStickyBar && !isSoldOut && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-dark-200 animate-slide-up md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="min-w-0 flex-1 mr-3">
              <p className="text-xs text-dark-400 truncate">{product.name}</p>
              <p className="text-brand-800 font-black text-base leading-none">
                {isRange
                  ? `${formatCurrency(minVariantPrice)} – ${formatCurrency(maxVariantPrice)}`
                  : formatCurrency(displayPrice)}
              </p>
            </div>
            <button
              onClick={handleAddToCart}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-800 text-white text-sm font-bold rounded-xl hover:bg-brand-900 transition-colors flex-shrink-0"
            >
              <ShoppingCart size={15} />
              Add to Cart
            </button>
          </div>
        </div>
      )}

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}

export default ProductDetailPage;
