import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as cartService from '../services/cart.service';

function patchItems(old, patcher) {
  if (!old) return old;
  if (old?.data?.items) {
    return { ...old, data: { ...old.data, items: patcher(old.data.items) } };
  }
  if (old?.items) {
    return { ...old, items: patcher(old.items) };
  }
  return old;
}

export function useCart({ isAuthenticated, onRequireAuth } = {}) {
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: cartService.getCart,
    enabled: isAuthenticated,
    staleTime: 10_000,
  });

  const cartData = cart?.data ?? cart;
  const items = cartData?.items ?? [];
  const cartCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['cart'] });

  const addMutation = useMutation({
    mutationFn: cartService.addToCart,
    onSuccess: () => {
      toast.success('Added to cart!');
      invalidate();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to add to cart');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, quantity }) => cartService.updateCartItem(id, { quantity }),
    onMutate: async ({ id, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previous = queryClient.getQueryData(['cart']);
      queryClient.setQueryData(['cart'], (old) =>
        patchItems(old, (items) =>
          items.map((item) => item.id === id ? { ...item, quantity } : item)
        )
      );
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['cart'], ctx.previous);
      toast.error(err?.response?.data?.message || 'Failed to update cart');
    },
    onSettled: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: cartService.removeCartItem,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previous = queryClient.getQueryData(['cart']);
      queryClient.setQueryData(['cart'], (old) =>
        patchItems(old, (items) => items.filter((item) => item.id !== id))
      );
      return { previous };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['cart'], ctx.previous);
      toast.error(err?.response?.data?.message || 'Failed to remove item');
    },
    onSuccess: () => toast.success('Removed from cart'),
    onSettled: invalidate,
  });

  const clearMutation = useMutation({
    mutationFn: cartService.clearCart,
    onSuccess: invalidate,
  });

  const addItem = useCallback(
    (params) => {
      if (!isAuthenticated) {
        onRequireAuth?.();
        return;
      }
      addMutation.mutate(params);
    },
    [isAuthenticated, onRequireAuth, addMutation]
  );

  const updateQuantity = useCallback(
    (id, quantity) => {
      if (quantity < 1) return;
      updateMutation.mutate({ id, quantity });
    },
    [updateMutation]
  );

  const removeItem = useCallback(
    (id) => removeMutation.mutate(id),
    [removeMutation]
  );

  const clearAll = useCallback(
    () => clearMutation.mutate(),
    [clearMutation]
  );

  return {
    cart,
    items,
    cartCount,
    isLoading,
    addItem,
    updateQuantity,
    removeItem,
    clearAll,
  };
}

export default useCart;
