import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../services/product.service';

/**
 * Fetch products with optional filters using React Query.
 * @param {{ search?: string, type?: string, categoryId?: string }} filters
 */
export function useProducts(filters = {}, options = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => getProducts(filters),
    staleTime: 30_000,
    ...options,
  });
}

export default useProducts;
