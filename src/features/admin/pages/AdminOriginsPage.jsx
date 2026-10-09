import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';
import {
  getOrigins,
  createOrigin,
  updateOrigin,
  deleteOrigin,
} from '../../products/services/product.service';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import Modal from '../../../shared/components/Modal';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { WilayahSelect } from '../../../shared/components/WilayahSelect';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import EmptyState from '../../../shared/components/EmptyState';

export function AdminOriginsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [regionVal, setRegionVal] = useState({ province: null, regency: null, district: null, village: null });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['origins'],
    queryFn: getOrigins,
  });
  const origins = data?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const openAdd = () => {
    setEditing(null);
    setRegionVal({ province: null, regency: null, district: null, village: null });
    reset({ label: '', address: '' });
    setModalOpen(true);
  };

  const openEdit = (origin) => {
    setEditing(origin);
    setRegionVal({ province: null, regency: null, district: null, village: null });
    reset({ label: origin.label, address: origin.address });
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editing ? updateOrigin(editing.id, data) : createOrigin(data),
    onSuccess: () => {
      toast.success(editing ? 'Origin diperbarui!' : 'Origin dibuat!');
      queryClient.invalidateQueries({ queryKey: ['origins'] });
      setModalOpen(false);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Gagal menyimpan'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOrigin,
    onSuccess: () => {
      toast.success('Origin dihapus');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['origins'] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Gagal menghapus'),
  });

  const onSubmit = (d) => {
    const { province, regency, district, village } = regionVal;

    if (!regency && !editing?.city) {
      toast.error('Pilih kabupaten/kota terlebih dahulu');
      return;
    }

    saveMutation.mutate({
      label: d.label,
      address: d.address,
      city: regency?.name ?? editing?.city ?? '',
      province: province?.name ?? editing?.province ?? '',
      provinceCode: province?.id ?? editing?.provinceCode ?? null,
      regencyCode: regency?.id ?? editing?.regencyCode ?? null,
      districtCode: district?.id ?? editing?.districtCode ?? null,
      villageCode: village?.id ?? editing?.villageCode ?? null,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-dark-900">Shipping Origins</h1>
          <p className="text-dark-500 text-sm mt-1">{origins.length} origins</p>
        </div>
        <Button variant="primary" onClick={openAdd}>
          <Plus size={16} /> Add Origin
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : origins.length === 0 ? (
        <EmptyState title="No shipping origins" description="Add your first shipping origin to enable shipping cost calculation." />
      ) : (
        <div className="bg-white rounded-2xl border border-dark-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-dark-50 border-b border-dark-200">
              <tr>
                <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Label</th>
                <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Alamat</th>
                <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Kabupaten/Kota</th>
                <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Provinsi</th>
                <th scope="col" className="text-right px-4 py-3 font-semibold text-dark-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {origins.map((origin, i) => (
                <tr key={origin.id} className={i % 2 === 0 ? 'bg-white' : 'bg-dark-50/50'}>
                  <td className="px-4 py-3 font-medium text-dark-900">{origin.label}</td>
                  <td className="px-4 py-3 text-dark-600 max-w-xs truncate">{origin.address}</td>
                  <td className="px-4 py-3 text-dark-600">{origin.city}</td>
                  <td className="px-4 py-3 text-dark-600">{origin.province}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(origin)}
                        aria-label={`Edit ${origin.label}`}
                        className="p-1.5 text-dark-500 hover:text-brand-800 hover:bg-brand-50 rounded-lg transition-colors"
                      >
                        <Edit size={15} aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(origin)}
                        aria-label={`Delete ${origin.label}`}
                        className="p-1.5 text-dark-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Origin' : 'Tambah Origin'}
        size="sm"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Label"
            required
            placeholder="cth. Gudang Utama, Rumah"
            error={errors.label?.message}
            {...register('label', { required: 'Label wajib diisi' })}
          />
          <Input
            label="Alamat Lengkap"
            required
            placeholder="Nama jalan, nomor, RT/RW"
            error={errors.address?.message}
            {...register('address', { required: 'Alamat wajib diisi' })}
          />

          <WilayahSelect
            key={editing?.id ?? 'new'}
            initialValue={editing ? {
              provinceId: editing.provinceCode,
              regencyId: editing.regencyCode,
              districtId: editing.districtCode,
              villageId: editing.villageCode,
            } : undefined}
            onChange={({ province, regency, district, village }) =>
              setRegionVal({ province, regency, district, village })
            }
          />

          {editing?.city && !regionVal.regency && (
            <p className="text-xs text-dark-500 bg-dark-50 px-3 py-2 rounded-lg">
              Lokasi saat ini: <strong>{editing.city}</strong>, {editing.province}
              {editing.districtCode && ' (kecamatan tersimpan)'}
              <br />Pilih ulang di atas untuk mengubah lokasi.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isSubmitting || saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Menyimpan...' : editing ? 'Perbarui' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        variant="danger"
        title="Hapus Origin"
        message={`Hapus origin "${deleteTarget?.label}"? Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel={deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
      />
    </div>
  );
}

export default AdminOriginsPage;
