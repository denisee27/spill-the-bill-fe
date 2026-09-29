import { useState, useEffect } from 'react';

const BASE_LOCAL = '/data/wilayah';
const BASE_API = 'https://wilayah.id/api';

const fetchJson = (url) => fetch(url).then((r) => r.json()).then((d) => d.data || d);

export const useWilayah = () => {
  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState({ regencies: false, districts: false, villages: false });

  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedRegency, setSelectedRegency] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');

  useEffect(() => {
    fetchJson(`${BASE_LOCAL}/provinces.json`).then(setProvinces).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedProvince) { setRegencies([]); return; }
    setLoading((l) => ({ ...l, regencies: true }));
    setSelectedRegency('');
    setSelectedDistrict('');
    setSelectedVillage('');
    fetchJson(`${BASE_API}/regencies/${selectedProvince}.json`)
      .then(setRegencies)
      .catch(() => setRegencies([]))
      .finally(() => setLoading((l) => ({ ...l, regencies: false })));
  }, [selectedProvince]);

  useEffect(() => {
    if (!selectedRegency) { setDistricts([]); return; }
    setLoading((l) => ({ ...l, districts: true }));
    setSelectedDistrict('');
    setSelectedVillage('');
    fetchJson(`${BASE_API}/districts/${selectedRegency}.json`)
      .then(setDistricts)
      .catch(() => setDistricts([]))
      .finally(() => setLoading((l) => ({ ...l, districts: false })));
  }, [selectedRegency]);

  useEffect(() => {
    if (!selectedDistrict) { setVillages([]); return; }
    setLoading((l) => ({ ...l, villages: true }));
    setSelectedVillage('');
    fetchJson(`${BASE_API}/villages/${selectedDistrict}.json`)
      .then(setVillages)
      .catch(() => setVillages([]))
      .finally(() => setLoading((l) => ({ ...l, villages: false })));
  }, [selectedDistrict]);

  const reset = () => {
    setSelectedProvince('');
    setSelectedRegency('');
    setSelectedDistrict('');
    setSelectedVillage('');
    setRegencies([]);
    setDistricts([]);
    setVillages([]);
  };

  return {
    provinces, regencies, districts, villages, loading,
    selectedProvince, setSelectedProvince,
    selectedRegency, setSelectedRegency,
    selectedDistrict, setSelectedDistrict,
    selectedVillage, setSelectedVillage,
    reset,
  };
};
