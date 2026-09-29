import api from '../../../shared/services/api';

export async function getOrders(params = {}, isAdmin = false) {
  const url = isAdmin ? '/orders/admin/all' : '/orders';
  const res = await api.get(url, { params });
  return res.data;
}

export async function getOrder(id) {
  const res = await api.get(`/orders/${id}`);
  return res.data;
}

export async function createOrder(data) {
  const res = await api.post('/orders', data);
  return res.data;
}

export async function uploadPaymentProof(orderId, formData) {
  const res = await api.post(`/orders/${orderId}/payment-proofs`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function updateOrderStatus(orderId, { status, notes }) {
  const res = await api.patch(`/orders/admin/${orderId}/status`, { status, notes });
  return res.data;
}

export async function approvePayment(orderId) {
  const res = await api.patch(`/orders/admin/${orderId}/approve-payment`);
  return res.data;
}

export async function rejectPayment(orderId, { notes } = {}) {
  const res = await api.patch(`/orders/admin/${orderId}/reject-payment`, { notes });
  return res.data;
}

export async function deliverOrder(orderId, formData) {
  const res = await api.patch(`/orders/admin/${orderId}/deliver`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function processRefund(orderId, formData) {
  const res = await api.patch(`/orders/admin/${orderId}/process-refund`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function requestRefund(orderId, { reason }) {
  const res = await api.post(`/orders/${orderId}/refund`, { reason });
  return res.data;
}

export async function adminRequestRefund(orderId, data) {
  const res = await api.post(`/orders/admin/${orderId}/request-refund`, data);
  return res.data;
}

export async function submitRefundDetail(orderId, data) {
  const res = await api.post(`/orders/${orderId}/refund-detail`, data);
  return res.data;
}

export async function confirmDelivery(orderId) {
  const res = await api.post(`/orders/${orderId}/confirm-delivery`);
  return res.data;
}

export async function cancelOrder(orderId) {
  const res = await api.patch(`/orders/${orderId}/cancel`);
  return res.data;
}

// Address endpoints
export async function getAddresses() {
  const res = await api.get('/addresses');
  return res.data;
}

export async function createAddress(data) {
  const res = await api.post('/addresses', data);
  return res.data;
}

export async function updateAddress(id, data) {
  const res = await api.patch(`/addresses/${id}`, data);
  return res.data;
}

export async function setDefaultAddress(id) {
  const res = await api.patch(`/addresses/${id}/default`);
  return res.data;
}

export async function deleteAddress(id) {
  const res = await api.delete(`/addresses/${id}`);
  return res.data;
}

export async function getDashboardChartData() {
  const res = await api.get('/orders/admin/chart-data');
  return res.data;
}

// Voucher
export async function validateVoucher(code) {
  const res = await api.get('/vouchers/validate', { params: { code } });
  return res.data;
}
