import { useEffect } from 'react';
import { useWilayah } from '../hooks/useWilayah';

const selectClass = (disabled) =>
  `w-full px-3 py-2 border border-dark-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white ${
    disabled ? 'opacity-50 cursor-not-allowed bg-dark-50' : ''
  }`;

export function WilayahSelect({ onChange, showVillage = true }) {
  const {
    provinces, regencies, districts, villages, loading,
    selectedProvince, setSelectedProvince,
    selectedRegency, setSelectedRegency,
    selectedDistrict, setSelectedDistrict,
    selectedVillage, setSelectedVillage,
  } = useWilayah();

  useEffect(() => {
    if (!selectedProvince) return;
    const province = provinces.find((p) => p.code === selectedProvince);
    const regency = regencies.find((r) => r.code === selectedRegency);
    const district = districts.find((d) => d.code === selectedDistrict);
    const village = villages.find((v) => v.code === selectedVillage);
    onChange?.({ province, regency, district, village });
  }, [selectedProvince, selectedRegency, selectedDistrict, selectedVillage]);

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-dark-700 mb-1">Provinsi *</label>
        <select
          value={selectedProvince}
          onChange={(e) => setSelectedProvince(e.target.value)}
          className={selectClass(false)}
        >
          <option value="">Pilih Provinsi</option>
          {provinces.map((p) => (
            <option key={p.code} value={p.code}>{p.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-dark-700 mb-1">
          Kabupaten / Kota {loading.regencies && <span className="text-dark-400">(loading...)</span>}
        </label>
        <select
          value={selectedRegency}
          onChange={(e) => setSelectedRegency(e.target.value)}
          disabled={!selectedProvince || loading.regencies}
          className={selectClass(!selectedProvince || loading.regencies)}
        >
          <option value="">Pilih Kabupaten/Kota</option>
          {regencies.map((r) => (
            <option key={r.code} value={r.code}>{r.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-dark-700 mb-1">
          Kecamatan {loading.districts && <span className="text-dark-400">(loading...)</span>}
        </label>
        <select
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
          disabled={!selectedRegency || loading.districts}
          className={selectClass(!selectedRegency || loading.districts)}
        >
          <option value="">Pilih Kecamatan</option>
          {districts.map((d) => (
            <option key={d.code} value={d.code}>{d.name}</option>
          ))}
        </select>
      </div>

      {showVillage && (
        <div>
          <label className="block text-xs font-medium text-dark-700 mb-1">
            Kelurahan / Desa {loading.villages && <span className="text-dark-400">(loading...)</span>}
          </label>
          <select
            value={selectedVillage}
            onChange={(e) => setSelectedVillage(e.target.value)}
            disabled={!selectedDistrict || loading.villages}
            className={selectClass(!selectedDistrict || loading.villages)}
          >
            <option value="">Pilih Kelurahan</option>
            {villages.map((v) => (
              <option key={v.code} value={v.code}>{v.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export default WilayahSelect;
