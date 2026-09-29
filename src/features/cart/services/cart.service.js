import api from '../../../shared/services/api';

export async function getCart() {
  const res = await api.get('/cart');
  return res.data;
}

export async function addToCart({ productId, variantId, quantity = 1 }) {
  const res = await api.post('/cart/items', { productId, variantId, quantity });
  return res.data;
}

export async function updateCartItem(cartItemId, { quantity }) {
  const res = await api.patch(`/cart/items/${cartItemId}`, { quantity });
  return res.data;
}

export async function removeCartItem(cartItemId) {
  const res = await api.delete(`/cart/items/${cartItemId}`);
  return res.data;
}

export async function clearCart() {
  const res = await api.delete('/cart');
  return res.data;
}
