import { useEffect } from 'react';
import { useWilayah } from '../hooks/useWilayah';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

const selectClass = (disabled) => clsx(
  'w-full appearance-none pl-3 pr-8 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white transition-colors',
  disabled
    ? 'opacity-50 cursor-not-allowed bg-dark-50 border-dark-200'
    : 'border-dark-300 hover:border-dark-400 cursor-pointer'
);

/**
 * Cascading wilayah selector backed by our own DB.
 *
 * onChange({ province, regency, district, village }) — each item: { id, name } | null
 * showDistrict: boolean (default true)
 * showVillage: boolean (default true)
 * initialValue: { provinceId, regencyId, districtId, villageId } — for edit mode
 */
export function WilayahSelect({ onChange, showDistrict = true, showVillage = true, initialValue }) {
  const {
    provinces, regencies, districts, villages, loading,
    selectedProvince, setSelectedProvince,
    selectedRegency, setSelectedRegency,
    selectedDistrict, setSelectedDistrict,
    selectedVillage, setSelectedVillage,
  } = useWilayah(initialValue);

  useEffect(() => {
    const province = provinces.find((p) => p.id === selectedProvince) ?? null;
    const regency  = regencies.find((r) => r.id === selectedRegency)  ?? null;
    const district = districts.find((d) => d.id === selectedDistrict) ?? null;
    const village  = villages.find((v) => v.id === selectedVillage)   ?? null;
    onChange?.({ province, regency, district, village });
  }, [selectedProvince, selectedRegency, selectedDistrict, selectedVillage]);

  return (
    <div className="space-y-3">
      {/* Province */}
      <div>
        <label className="block text-xs font-medium text-dark-700 mb-1">
          Provinsi {loading.provinces && <span className="text-dark-400">(memuat...)</span>}
        </label>
        <div className="relative">
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className={selectClass(loading.provinces)}
            disabled={loading.provinces}
          >
            <option value="">{loading.provinces ? 'Memuat...' : 'Pilih Provinsi'}</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
        </div>
      </div>

      {/* Regency */}
      <div>
        <label className="block text-xs font-medium text-dark-700 mb-1">
          Kabupaten / Kota {loading.regencies && <span className="text-dark-400">(memuat...)</span>}
        </label>
        <div className="relative">
          <select
            value={selectedRegency}
            onChange={(e) => setSelectedRegency(e.target.value)}
            disabled={!selectedProvince || loading.regencies}
            className={selectClass(!selectedProvince || loading.regencies)}
          >
            <option value="">
              {!selectedProvince ? 'Pilih provinsi dulu' : loading.regencies ? 'Memuat...' : 'Pilih Kabupaten/Kota'}
            </option>
            {regencies.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
        </div>
      </div>

      {/* District */}
      {showDistrict && (
        <div>
          <label className="block text-xs font-medium text-dark-700 mb-1">
            Kecamatan {loading.districts && <span className="text-dark-400">(memuat...)</span>}
          </label>
          <div className="relative">
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={!selectedRegency || loading.districts}
              className={selectClass(!selectedRegency || loading.districts)}
            >
              <option value="">
                {!selectedRegency ? 'Pilih kabupaten dulu' : loading.districts ? 'Memuat...' : 'Pilih Kecamatan'}
              </option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Village */}
      {showVillage && (
        <div>
          <label className="block text-xs font-medium text-dark-700 mb-1">
            Kelurahan / Desa {loading.villages && <span className="text-dark-400">(memuat...)</span>}
          </label>
          <div className="relative">
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              disabled={!selectedDistrict || loading.villages}
              className={selectClass(!selectedDistrict || loading.villages)}
            >
              <option value="">
                {!selectedDistrict ? 'Pilih kecamatan dulu' : loading.villages ? 'Memuat...' : 'Pilih Kelurahan/Desa'}
              </option>
              {villages.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  );
}

export default WilayahSelect;
