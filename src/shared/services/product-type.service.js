import api from './api';

export async function getProductTypes({ includeInactive = false } = {}) {
  const res = await api.get('/product-types', {
    params: includeInactive ? { includeInactive: 'true' } : {},
  });
  return res.data?.data ?? [];
}

export async function createProductType(data) {
  const res = await api.post('/product-types', data);
  return res.data?.data;
}

export async function updateProductType(id, data) {
  const res = await api.patch(`/product-types/${id}`, data);
  return res.data?.data;
}

export async function deleteProductType(id) {
  await api.delete(`/product-types/${id}`);
}
