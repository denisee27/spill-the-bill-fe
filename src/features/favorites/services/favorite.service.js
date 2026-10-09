import api from '../../../shared/services/api';

export async function toggleFavorite(productId) {
  const res = await api.post(`/favorites/${productId}/toggle`);
  return res.data;
}

export async function getFavoriteStatus(productId) {
  const res = await api.get(`/favorites/${productId}/status`);
  return res.data;
}

export async function getMyFavorites() {
  const res = await api.get('/favorites/my');
  return res.data;
}
