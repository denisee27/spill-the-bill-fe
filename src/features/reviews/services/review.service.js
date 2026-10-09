import api from '../../../shared/services/api';

export async function getProductReviews(productId) {
  const res = await api.get(`/reviews/product/${productId}`);
  return res.data;
}

export async function submitReview(productId, data) {
  const res = await api.post(`/reviews/product/${productId}`, data);
  return res.data;
}

export async function deleteReview(productId) {
  const res = await api.delete(`/reviews/product/${productId}`);
  return res.data;
}
