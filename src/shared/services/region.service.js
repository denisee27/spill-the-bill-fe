import api from './api';

export async function getProvinces() {
  const res = await api.get('/regions/provinces');
  return res.data?.data ?? [];
}

export async function getRegencies(provinceId) {
  const res = await api.get('/regions/regencies', { params: { provinceId } });
  return res.data?.data ?? [];
}

export async function getDistricts(regencyId) {
  const res = await api.get('/regions/districts', { params: { regencyId } });
  return res.data?.data ?? [];
}

export async function getVillages(districtId) {
  const res = await api.get('/regions/villages', { params: { districtId } });
  return res.data?.data ?? [];
}
