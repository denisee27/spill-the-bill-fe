import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import {
  createProductType,
  updateProductType,
  deleteProductType,
} from '../../../shared/services/product-type.service';
import { useProductTypes } from '../../../shared/hooks/useProductTypes';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import Modal from '../../../shared/components/Modal';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import EmptyState from '../../../shared/components/EmptyState';

const COLOR_PRESETS = [
  '#7c3aed', '#0891b2', '#059669', '#dc2626',
  '#d97706', '#db2777', '#2563eb', '#65a30d',
];

export function AdminProductTypesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queryClient = useQueryClient();

  const { types, isLoading } = useProductTypes({ includeInactive: true });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { color: '#7c3aed', isActive: true, order: 0 } });

  const watchedColor = watch('color');

  const openAdd = () => {
    setEditing(null);
    reset({ name: '', slug: '', color: '#7c3aed', isActive: true, order: types.length });
    setModalOpen(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    reset({ name: t.name, slug: t.slug, color: t.color, isActive: t.isActive, order: t.order });
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editing ? updateProductType(editing.id, data) : createProductType(data),
    onSuccess: () => {
      toast.success(editing ? 'Type updated!' : 'Type created!');
      queryClient.invalidateQueries({ queryKey: ['product-types'] });
      setModalOpen(false);
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProductType,
    onSuccess: () => {
      toast.success('Type deleted');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['product-types'] });
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to delete'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-dark-900">Product Types</h1>
          <p className="text-dark-500 text-sm mt-1">{types.length} types</p>
        </div>
        <Button variant="primary" onClick={openAdd}>
          <Plus size={16} /> Add Type
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : types.length === 0 ? (
        <EmptyState title="No product types" description="Add your first product type." />
      ) : (
        <div className="bg-white rounded-2xl border border-dark-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-dark-50 border-b border-dark-200">
              <tr>
                <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700 w-8" />
                <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Name</th>
                <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Slug</th>
                <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Color</th>
                <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Status</th>
                <th scope="col" className="text-right px-4 py-3 font-semibold text-dark-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {types.map((t, i) => (
                <tr key={t.id} className={i % 2 === 0 ? 'bg-white' : 'bg-dark-50/50'}>
                  <td className="px-4 py-3 text-dark-300">
                    <GripVertical size={14} />
                  </td>
                  <td className="px-4 py-3 font-medium text-dark-900">{t.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-dark-500">{t.slug}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full border border-dark-200 flex-shrink-0"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="font-mono text-xs text-dark-500">{t.color}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-dark-100 text-dark-500'}`}>
                      {t.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(t)}
                        aria-label={`Edit ${t.name}`}
                        className="p-1.5 text-dark-500 hover:text-brand-800 hover:bg-brand-50 rounded-lg transition-colors"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(t)}
                        aria-label={`Delete ${t.name}`}
                        className="p-1.5 text-dark-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={15} />
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
        title={editing ? 'Edit Product Type' : 'Add Product Type'}
        size="sm"
      >
        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
          <Input
            label="Name"
            required
            placeholder="e.g. Jastip"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">
              Slug <span className="text-dark-400 text-xs font-normal">(auto-generated if blank)</span>
            </label>
            <input
              placeholder="e.g. JASTIP"
              className="w-full px-3 py-2 border border-dark-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-700"
              {...register('slug')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">Color</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue('color', c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${watchedColor === c ? 'border-dark-800 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="w-8 h-8 rounded cursor-pointer border border-dark-300"
                {...register('color')}
              />
              <input
                placeholder="#6b7280"
                className="flex-1 px-3 py-2 border border-dark-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-700"
                {...register('color')}
              />
            </div>
          </div>
          <Input
            label="Order"
            type="number"
            placeholder="0"
            {...register('order', { valueAsNumber: true })}
          />
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              className="w-4 h-4 rounded border-dark-300 text-brand-700 focus:ring-brand-700"
              {...register('isActive')}
            />
            <label htmlFor="isActive" className="text-sm font-medium text-dark-700">Active</label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isSubmitting || saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        variant="danger"
        title="Delete Product Type"
        message={`Delete type "${deleteTarget?.name}"? Products with this type will lose their type label.`}
        confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
      />
    </div>
  );
}

export default AdminProductTypesPage;
