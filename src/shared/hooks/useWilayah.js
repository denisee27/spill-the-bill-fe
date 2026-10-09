import { useState, useEffect, useRef } from 'react';
import { getProvinces, getRegencies, getDistricts, getVillages } from '../services/region.service';

export const useWilayah = (initialValue = {}) => {
  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState({ provinces: false, regencies: false, districts: false, villages: false });

  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedRegency, setSelectedRegency] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');

  // Prevents cascade resets during initial value hydration
  const skipCascade = useRef(false);

  useEffect(() => {
    setLoading((l) => ({ ...l, provinces: true }));
    getProvinces()
      .then((data) => {
        setProvinces(data);
        if (initialValue.provinceId) {
          skipCascade.current = true;
          setSelectedProvince(initialValue.provinceId);
        }
      })
      .catch(() => {})
      .finally(() => setLoading((l) => ({ ...l, provinces: false })));
  }, []);

  useEffect(() => {
    if (!selectedProvince) { setRegencies([]); return; }
    setLoading((l) => ({ ...l, regencies: true }));
    if (!skipCascade.current) {
      setSelectedRegency('');
      setSelectedDistrict('');
      setSelectedVillage('');
      setDistricts([]);
      setVillages([]);
    }
    getRegencies(selectedProvince)
      .then((data) => {
        setRegencies(data);
        if (skipCascade.current && initialValue.regencyId) {
          setSelectedRegency(initialValue.regencyId);
        } else {
          skipCascade.current = false;
        }
      })
      .catch(() => setRegencies([]))
      .finally(() => setLoading((l) => ({ ...l, regencies: false })));
  }, [selectedProvince]);

  useEffect(() => {
    if (!selectedRegency) { setDistricts([]); return; }
    setLoading((l) => ({ ...l, districts: true }));
    if (!skipCascade.current) {
      setSelectedDistrict('');
      setSelectedVillage('');
      setVillages([]);
    }
    getDistricts(selectedRegency)
      .then((data) => {
        setDistricts(data);
        if (skipCascade.current && initialValue.districtId) {
          setSelectedDistrict(initialValue.districtId);
        } else {
          skipCascade.current = false;
        }
      })
      .catch(() => setDistricts([]))
      .finally(() => setLoading((l) => ({ ...l, districts: false })));
  }, [selectedRegency]);

  useEffect(() => {
    if (!selectedDistrict) { setVillages([]); return; }
    setLoading((l) => ({ ...l, villages: true }));
    if (!skipCascade.current) {
      setSelectedVillage('');
    }
    getVillages(selectedDistrict)
      .then((data) => {
        setVillages(data);
        if (skipCascade.current && initialValue.villageId) {
          setSelectedVillage(initialValue.villageId);
        }
        skipCascade.current = false;
      })
      .catch(() => setVillages([]))
      .finally(() => setLoading((l) => ({ ...l, villages: false })));
  }, [selectedDistrict]);

  const reset = () => {
    skipCascade.current = false;
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
