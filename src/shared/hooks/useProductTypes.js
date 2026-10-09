import { useQuery } from '@tanstack/react-query';
import { getProductTypes } from '../services/product-type.service';

export function useProductTypes({ includeInactive = false } = {}) {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['product-types', { includeInactive }],
    queryFn: () => getProductTypes({ includeInactive }),
    staleTime: 5 * 60 * 1000,
  });

  return { types: data, isLoading, error };
}
