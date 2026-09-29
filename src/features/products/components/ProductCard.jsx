import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { imageUrl, formatCurrency } from '../../../shared/utils/format';
import { ProductBadge } from './ProductBadge';

export function ProductCard({ product, onAddToCart }) {
  const firstImage = product?.images?.[0]?.url || product?.images?.[0] || null;
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
      <div className="relative aspect-[3/4] bg-dark-100 overflow-hidden">
        {firstImage ? (
          <img
            src={imageUrl(firstImage)}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-dark-300">
            <span className="text-4xl">?</span>
          </div>
        )}

        {/* Type badge — top left */}
        <div className="absolute top-2 left-2">
          <ProductBadge type={product.type} />
        </div>

        {/* Discount badge — top right */}
        {hasDiscount && !soldOut && (
          <div className="absolute top-2 right-2 bg-brand-700 text-white text-xs font-black px-2 py-0.5 rounded-full">
            -{discountPct}%
          </div>
        )}

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
      </div>
    </Link>
  );
}

export default ProductCard;
