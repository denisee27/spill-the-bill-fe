import api from '../../../shared/services/api';

/**
 * Auth API service functions
 */

export async function login({ email, password }) {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
}

export async function register({ name, email, password, phone, otp }) {
  const res = await api.post('/auth/register', { name, email, password, phone, otp });
  return res.data;
}

export async function sendOtp(email) {
  const res = await api.post('/auth/send-otp', { email });
  return res.data;
}

export async function verifyOtp(email, otp) {
  const res = await api.post('/auth/verify-otp', { email, otp });
  return res.data;
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } catch {
    // ignore
  }
}

export async function getMe() {
  const res = await api.get('/auth/me');
  return res.data;
}

export async function resetPassword({ email, otp, newPassword }) {
  const res = await api.post('/auth/reset-password', { email, otp, newPassword });
  return res.data;
}
