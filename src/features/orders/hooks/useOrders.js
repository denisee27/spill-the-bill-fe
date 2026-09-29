import { useQuery } from '@tanstack/react-query';
import { getOrders, getOrder } from '../services/order.service';

export function useOrders(params = {}) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => getOrders(params),
    staleTime: 15_000,
  });
}

export function useOrder(id) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}
