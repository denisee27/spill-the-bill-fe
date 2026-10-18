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
  const cartCount = items.length;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['cart'] });

  const addMutation = useMutation({
    mutationFn: cartService.addToCart,
    onSuccess: () => {
      toast.success('Added to cart!');
      invalidate();
    },
    onError: (err, vars) => {
      const msg = err?.response?.data?.message || err?.response?.data?.error || '';
      if (msg.toLowerCase().includes('stock')) {
        const existing = items.find(
          (i) => i.productId === vars.productId &&
            (vars.variantId ? i.variantId === vars.variantId : !i.variantId)
        );
        const qty = existing?.quantity ?? 1;
        toast(`Ada ${qty} produk ini di Keranjangmu. Kamu tidak bisa menambah lagi karena sudah melebihi jumlah stok Penjual.`, { icon: '🛒' });
      } else {
        toast.error(msg || 'Failed to add to cart');
      }
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
      const msg = err?.response?.data?.message || err?.response?.data?.error || '';
      toast.error(msg || 'Failed to update cart');
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
      const existing = items.find(
        (item) => item.productId === params.productId &&
          (params.variantId ? item.variantId === params.variantId : !item.variantId)
      );
      if (existing) {
        const stock = params.variantId
          ? (existing.variant?.stock ?? 0)
          : (existing.product?.totalStock ?? existing.product?.stock ?? 0);
        if (existing.quantity >= stock) {
          toast(`Ada ${existing.quantity} produk ini di Keranjangmu. Kamu tidak bisa menambah lagi karena sudah melebihi jumlah stok Penjual.`, { icon: '🛒' });
          return;
        }
      }
      addMutation.mutate(params);
    },
    [isAuthenticated, onRequireAuth, addMutation, items]
  );

  const updateQuantity = useCallback(
    (id, quantity) => {
      if (quantity < 1) return;
      const item = items.find((i) => i.id === id);
      if (item) {
        const stock = item.variantId
          ? (item.variant?.stock ?? item.product?.variants?.find((v) => v.id === item.variantId)?.stock ?? 0)
          : (item.product?.stock ?? 0);
        if (quantity > stock) {
          toast(`Stok tersedia hanya ${stock}. Kamu tidak bisa menambah lebih dari jumlah stok Penjual.`, { icon: '🛒' });
          return;
        }
      }
      updateMutation.mutate({ id, quantity });
    },
    [updateMutation, items]
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
