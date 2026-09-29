import { useQuery } from '@tanstack/react-query';
import { getProduct } from '../services/product.service';

/**
 * Fetch a single product by ID using React Query.
 * @param {string} id
 */
export function useProduct(id) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export default useProduct;
