import { ProductCard } from './ProductCard';
import { ProductSkeleton } from './ProductSkeleton';
import EmptyState from '../../../shared/components/EmptyState';
import { PackageSearch } from 'lucide-react';

/**
 * Responsive product grid with loading skeletons and empty state.
 */
export function ProductGrid({ products = [], isLoading = false, onAddToCart }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <EmptyState
        icon={PackageSearch}
        title="No products found"
        description="Try adjusting your search or filter to find what you're looking for."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}

export default ProductGrid;
