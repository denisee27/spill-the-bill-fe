import api from '../../../shared/services/api';

export async function getEvents(params = {}) {
  const res = await api.get('/events', { params });
  return res.data;
}

export async function getAdminEvents(params = {}) {
  const res = await api.get('/events/admin/all', { params });
  return res.data;
}

export async function getEvent(id) {
  const res = await api.get(`/events/${id}`);
  return res.data;
}

export async function createEvent(data) {
  const isFormData = data instanceof FormData;
  const res = await api.post('/events', data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
  return res.data;
}

export async function updateEvent(id, data) {
  const isFormData = data instanceof FormData;
  const res = await api.patch(`/events/${id}`, data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
  return res.data;
}

export async function deleteEvent(id) {
  const res = await api.delete(`/events/${id}`);
  return res.data;
}

export async function addEventProducts(eventId, productIds) {
  const res = await api.post(`/events/${eventId}/products`, { productIds });
  return res.data;
}

export async function removeEventProduct(eventId, productId) {
  const res = await api.delete(`/events/${eventId}/products/${productId}`);
  return res.data;
}
