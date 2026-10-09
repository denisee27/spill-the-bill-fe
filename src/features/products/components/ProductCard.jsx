import { Link } from 'react-router-dom';
import { ShoppingCart, Play } from 'lucide-react';
import { imageUrl, formatCurrency } from '../../../shared/utils/format';
import { ProductBadge } from './ProductBadge';
import { ConditionBadge } from '../../../shared/components/ConditionBadge';
import { FavoriteButton } from '../../favorites/components/FavoriteButton';

const isVideoUrl = (url) => /\.(mp4|mov|webm|avi)(\?.*)?$/i.test(url);

export function ProductCard({ product, onAddToCart, onRequireAuth }) {
  const allImages = product?.images || [];
  const rawFirstImage = allImages[0]?.url || allImages[0] || null;
  const firstImageSrc = rawFirstImage ? imageUrl(rawFirstImage) : null;
  const firstIsVideo = firstImageSrc ? isVideoUrl(firstImageSrc) : false;
  const firstImage = rawFirstImage;
  const soldOut = product.isSoldOut === true || product.stock === 0;
  const displayPrice = product.displayPrice ?? product.price;
  const hasDiscount = product.originalPrice && product.originalPrice > displayPrice;
  const discountPct = hasDiscount
    ? Math.round((1 - displayPrice / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.(product);
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className={`group bg-white rounded-2xl shadow-sm border border-dark-200 overflow-hidden hover:shadow-md hover:border-brand-300 transition-all duration-200 active:scale-[0.98] ${soldOut ? 'opacity-70' : ''}`}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] bg-white overflow-hidden">
        {firstImage ? (
          <>
            <img
              src={firstImageSrc}
              alt={product.name}
              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {firstIsVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Play size={32} className="text-white drop-shadow" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-dark-300">
            <span className="text-4xl">?</span>
          </div>
        )}

        {/* Type badge — top left */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <ProductBadge type={product.type} />
          {hasDiscount && !soldOut && (
            <span className="self-start bg-brand-700 text-white text-xs font-black px-2 py-0.5 rounded-full">
              -{discountPct}%
            </span>
          )}
        </div>

        {/* Favorite button — top right */}
        <div className="absolute top-2 right-2">
          <FavoriteButton
            productId={product.id}
            onRequireAuth={onRequireAuth}
            size="sm"
          />
        </div>

        {/* Hover CTA bar — slides up from bottom */}
        {!soldOut && (
          <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
            <button
              onClick={handleAddToCart}
              aria-label={`Add ${product.name} to cart`}
              className="w-full py-2.5 bg-brand-800 hover:bg-brand-900 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
            >
              <ShoppingCart size={15} aria-hidden="true" />
              Add to Cart
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {product.category && (
          <p className="text-[11px] text-dark-400 font-medium uppercase tracking-wide mb-0.5">
            {product.category.name}
          </p>
        )}
        <h3 className="text-sm font-semibold text-dark-900 line-clamp-2 leading-snug mb-2">
          {product.name}
        </h3>
        {soldOut ? (
          <p className="text-xs font-bold text-dark-400 uppercase tracking-wide">Sold Out</p>
        ) : (
          <>
            <div className="flex items-end gap-2">
              <p className="text-brand-800 font-black text-base leading-none">
                {formatCurrency(displayPrice)}
              </p>
              {hasDiscount && (
                <p className="text-dark-300 text-xs line-through leading-none">
                  {formatCurrency(product.originalPrice)}
                </p>
              )}
            </div>
            {product.event?.endDate && (
              <p className="text-xs text-amber-600 font-medium mt-1">
                until {new Date(product.event.endDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
              </p>
            )}
          </>
        )}
        <div className="flex items-center justify-between mt-2">
          <ConditionBadge condition={product.condition} />
          {!soldOut && product.stock > 0 && product.stock <= 5 && (
            <span className="text-xs text-orange-600 font-semibold">Only {product.stock} left!</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;
