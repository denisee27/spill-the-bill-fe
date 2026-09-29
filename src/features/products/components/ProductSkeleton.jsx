/**
 * Loading skeleton for a product card.
 */
export function ProductSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-dark-200 overflow-hidden animate-pulse">
      <div className="aspect-square bg-dark-200" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-14 bg-dark-200 rounded-full" />
          <div className="h-5 w-16 bg-dark-200 rounded-full" />
        </div>
        <div className="h-4 bg-dark-200 rounded w-4/5" />
        <div className="h-4 bg-dark-200 rounded w-3/5" />
        <div className="flex items-center justify-between">
          <div className="h-5 bg-dark-200 rounded w-24" />
          <div className="h-8 w-8 bg-dark-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default ProductSkeleton;
