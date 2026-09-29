import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, History, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../../shared/services/api';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import Modal from '../../../shared/components/Modal';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import EmptyState from '../../../shared/components/EmptyState';
import { formatCurrency, formatDate } from '../../../shared/utils/format';
import { VOUCHER_TYPE } from '../../../shared/constants';

async function getVouchers() {
  const res = await api.get('/vouchers/admin/all');
  return res.data;
}

async function getVoucherUsage(id) {
  const res = await api.get(`/vouchers/admin/${id}/usage`);
  return res.data;
}

async function createVoucher(data) {
  const res = await api.post('/vouchers/admin', data);
  return res.data;
}

async function updateVoucher(id, data) {
  const res = await api.patch(`/vouchers/admin/${id}`, data);
  return res.data;
}

async function deleteVoucher(id) {
  const res = await api.delete(`/vouchers/admin/${id}`);
  return res.data;
}

export function AdminVouchersPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [usageVoucher, setUsageVoucher] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'vouchers'],
    queryFn: getVouchers,
  });
  const vouchers = data?.data?.vouchers ?? data?.vouchers ?? [];

  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: ['admin', 'voucher-usage', usageVoucher?.id],
    queryFn: () => getVoucherUsage(usageVoucher.id),
    enabled: !!usageVoucher,
  });
  const usages = usageData?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const voucherType = watch('type');

  const openAdd = () => {
    setEditing(null);
    reset({ code: '', type: VOUCHER_TYPE.PERCENTAGE, value: '', minOrder: '', maxUses: '', expiresAt: '' });
    setModalOpen(true);
  };

  const openEdit = (v) => {
    setEditing(v);
    reset({
      code: v.code,
      type: v.type,
      value: v.value,
      minOrder: v.minOrder || '',
      maxUses: v.maxUses || '',
      expiresAt: v.expiresAt ? v.expiresAt.slice(0, 10) : '',
    });
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data) => (editing ? updateVoucher(editing.id, data) : createVoucher(data)),
    onSuccess: () => {
      toast.success(editing ? 'Voucher updated!' : 'Voucher created!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'vouchers'] });
      setModalOpen(false);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVoucher,
    onSuccess: () => {
      toast.success('Voucher deleted');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'vouchers'] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to delete'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-dark-900">Vouchers</h1>
          <p className="text-dark-500 text-sm mt-1">{vouchers.length} vouchers</p>
        </div>
        <Button variant="primary" onClick={openAdd}>
          <Plus size={16} /> Add Voucher
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : vouchers.length === 0 ? (
        <EmptyState title="No vouchers" description="Create your first voucher." />
      ) : (
        <div className="bg-white rounded-2xl border border-dark-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-dark-50 border-b border-dark-200">
              <tr>
                <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Code</th>
                <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Type</th>
                <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Value</th>
                <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Min Order</th>
                <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Uses</th>
                <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Expires</th>
                <th scope="col" className="text-right px-4 py-3 font-semibold text-dark-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {vouchers.map((v, i) => (
                <tr key={v.id} className={i % 2 === 0 ? 'bg-white' : 'bg-dark-50/50'}>
                  <td className="px-4 py-3 font-mono font-bold text-dark-900">{v.code}</td>
                  <td className="px-4 py-3 text-dark-600">{v.type}</td>
                  <td className="px-4 py-3 font-medium text-dark-900">
                    {v.type === VOUCHER_TYPE.PERCENTAGE
                      ? `${v.value}%`
                      : formatCurrency(v.value)}
                  </td>
                  <td className="px-4 py-3 text-dark-600">{v.minOrder ? formatCurrency(v.minOrder) : '-'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setUsageVoucher(v)}
                      className="text-brand-700 hover:text-brand-900 font-medium underline-offset-2 hover:underline"
                    >
                      {v.usedCount ?? 0} / {v.maxUses ?? '∞'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-dark-600">{v.expiresAt ? formatDate(v.expiresAt) : '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setUsageVoucher(v)}
                        aria-label={`View usage history for ${v.code}`}
                        className="p-1.5 text-dark-500 hover:text-brand-800 hover:bg-brand-50 rounded-lg transition-colors"
                      >
                        <History size={15} aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => openEdit(v)}
                        aria-label={`Edit voucher ${v.code}`}
                        className="p-1.5 text-dark-500 hover:text-brand-800 hover:bg-brand-50 rounded-lg transition-colors"
                      >
                        <Edit size={15} aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(v)}
                        aria-label={`Delete voucher ${v.code}`}
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

      {/* Edit / Create Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Voucher' : 'Add Voucher'}
        size="sm"
      >
        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
          <Input
            label="Code"
            required
            placeholder="SAVE20"
            error={errors.code?.message}
            {...register('code', { required: 'Code is required' })}
          />
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Type <span className="text-red-500">*</span></label>
            <select
              className="w-full px-3 py-2 border border-dark-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
              {...register('type', { required: true })}
            >
              <option value={VOUCHER_TYPE.PERCENTAGE}>Percentage (%)</option>
              <option value={VOUCHER_TYPE.FIXED}>Fixed Amount (IDR)</option>
            </select>
          </div>
          <Input
            label={voucherType === VOUCHER_TYPE.PERCENTAGE ? 'Discount %' : 'Discount Amount (IDR)'}
            type="number"
            required
            placeholder={voucherType === VOUCHER_TYPE.PERCENTAGE ? '20' : '50000'}
            error={errors.value?.message}
            {...register('value', { required: 'Value is required', min: 0 })}
          />
          <Input
            label="Minimum Order (IDR)"
            type="number"
            placeholder="100000"
            {...register('minOrder', { min: 0 })}
          />
          <Input
            label="Max Uses"
            type="number"
            placeholder="Leave empty for unlimited"
            {...register('maxUses', { min: 1 })}
          />
          <Input
            label="Expires At"
            type="date"
            {...register('expiresAt')}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting || saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Usage History Modal */}
      <Modal
        isOpen={!!usageVoucher}
        onClose={() => setUsageVoucher(null)}
        title={`Usage History — ${usageVoucher?.code ?? ''}`}
        size="lg"
      >
        {usageLoading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner size="lg" />
          </div>
        ) : usages.length === 0 ? (
          <div className="py-10 text-center">
            <History size={32} className="mx-auto text-dark-300 mb-2" />
            <p className="text-sm text-dark-500">No one has used this voucher yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-dark-500">{usages.length} usage{usages.length !== 1 ? 's' : ''}</p>
            <div className="divide-y divide-dark-100 border border-dark-200 rounded-xl overflow-hidden">
              {usages.map((u) => (
                <div key={u.id} className="px-4 py-3 bg-white hover:bg-dark-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-dark-900 text-sm">{u.user.name}</span>
                        <span className="text-xs text-dark-400">{u.user.email}</span>
                      </div>
                      <div className="text-xs text-dark-500 mb-1.5">
                        {formatDate(u.usedAt)} &middot; Discount{' '}
                        <span className="font-medium text-green-700">{formatCurrency(u.order.discountAmount)}</span>
                        {' '}&middot; Order total{' '}
                        <span className="font-medium text-dark-800">{formatCurrency(u.order.total)}</span>
                      </div>
                      {u.order.items.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {u.order.items.map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 text-xs bg-dark-100 text-dark-700 px-2 py-0.5 rounded-full"
                            >
                              {item.productName}
                              {item.variantName ? ` (${item.variantName})` : ''}
                              {item.quantity > 1 ? ` ×${item.quantity}` : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Link
                      to={`/admin/orders/${u.order.id}`}
                      className="flex-shrink-0 flex items-center gap-1 text-xs text-brand-700 hover:text-brand-900 font-medium"
                    >
                      Order <ExternalLink size={11} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        variant="danger"
        title="Delete Voucher"
        message={`Delete voucher "${deleteTarget?.code}"? This cannot be undone.`}
        confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
      />
    </div>
  );
}

export default AdminVouchersPage;
