import api from '../../../shared/services/api';

/**
 * Fetch products with optional filters
 * @param {{ search?: string, type?: string, categoryId?: string, page?: number, limit?: number }} params
 */
export async function getProducts(params = {}) {
  const res = await api.get('/products', { params });
  return res.data;
}

/**
 * Fetch a single product by ID
 * @param {string} id
 */
export async function getProduct(id) {
  const res = await api.get(`/products/${id}`);
  return res.data;
}

export async function getProductAdmin(id) {
  const res = await api.get(`/products/admin/${id}`);
  return res.data;
}

/**
 * Create a new product (admin)
 * @param {FormData} formData
 */
export async function createProduct(formData) {
  const res = await api.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

/**
 * Update a product (admin)
 * @param {string} id
 * @param {FormData} formData
 */
export async function updateProduct(id, formData) {
  const res = await api.patch(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

/**
 * Delete a product (admin)
 * @param {string} id
 */
export async function deleteProduct(id) {
  const res = await api.delete(`/products/${id}`);
  return res.data;
}

/**
 * Fetch all categories
 */
export async function getCategories() {
  const res = await api.get('/categories');
  return res.data;
}

/**
 * Create a category (admin)
 */
export async function createCategory(data) {
  const res = await api.post('/categories', data);
  return res.data;
}

/**
 * Update a category (admin)
 */
export async function updateCategory(id, data) {
  const res = await api.patch(`/categories/${id}`, data);
  return res.data;
}

/**
 * Delete a category (admin)
 */
export async function deleteCategory(id) {
  const res = await api.delete(`/categories/${id}`);
  return res.data;
}

export async function updateProductStock(id, stock) {
  const res = await api.patch(`/products/${id}/stock`, { stock });
  return res.data;
}

export async function bulkSoldOut(ids, soldOut = true) {
  const res = await api.patch('/products/bulk-soldout', { ids, soldOut });
  return res.data;
}

export async function getOrigins() {
  const res = await api.get('/origins');
  return res.data;
}

export async function createOrigin(data) {
  const res = await api.post('/origins', data);
  return res.data;
}

export async function updateOrigin(id, data) {
  const res = await api.patch(`/origins/${id}`, data);
  return res.data;
}

export async function deleteOrigin(id) {
  const res = await api.delete(`/origins/${id}`);
  return res.data;
}
