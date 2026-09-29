import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as cartService from '../services/cart.service';

/**
 * Hook providing cart state and actions.
 * @param {{ isAuthenticated: boolean, onRequireAuth: () => void }} options
 */
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
    onSuccess: invalidate,
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to update cart'),
  });

  const removeMutation = useMutation({
    mutationFn: cartService.removeCartItem,
    onSuccess: () => {
      toast.success('Removed from cart');
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to remove item'),
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
