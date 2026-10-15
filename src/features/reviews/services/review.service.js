import api from '../../../shared/services/api';

export async function getProductReviews(productId) {
  const res = await api.get(`/reviews/product/${productId}`);
  return res.data;
}

export async function submitReview(productId, { rating, comment, mediaFiles = [] }) {
  const fd = new FormData();
  fd.append('rating', rating);
  if (comment) fd.append('comment', comment);
  mediaFiles.forEach((f) => fd.append('media', f));
  const res = await api.post(`/reviews/product/${productId}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function getMyReviewForProduct(productId) {
  const res = await api.get(`/reviews/product/${productId}/mine`);
  return res.data?.data ?? null;
}

export async function deleteReview(productId) {
  const res = await api.delete(`/reviews/product/${productId}`);
  return res.data;
}
