import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import api from '../../../shared/services/api';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import EmptyState from '../../../shared/components/EmptyState';
import { formatCurrency, formatDate } from '../../../shared/utils/format';

async function getMemberSettings() {
  const res = await api.get('/members/settings');
  return res.data;
}

async function updateMemberSettings(data) {
  const res = await api.patch('/members/settings', data);
  return res.data;
}

async function getMembers() {
  const res = await api.get('/members/list');
  return res.data;
}

export function AdminMembersPage() {
  const queryClient = useQueryClient();

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['admin', 'member-settings'],
    queryFn: getMemberSettings,
  });

  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['admin', 'members'],
    queryFn: getMembers,
  });

  const settings = settingsData?.data ?? {};
  const members = membersData?.data?.users ?? membersData?.users ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      reset({
        minMonthlyAmount: settings.minMonthlyAmount ?? 500000,
        hasFreeShipping: settings.hasFreeShipping ?? true,
        renewalPeriodDays: settings.renewalPeriodDays ?? 30,
      });
    }
  }, [settings, reset]);

  const saveMutation = useMutation({
    mutationFn: updateMemberSettings,
    onSuccess: () => {
      toast.success('Member settings updated!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'member-settings'] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to save'),
  });

  return (
    <div>
      <h1 className="text-2xl font-black text-dark-900 mb-6">Members</h1>

      {/* Settings section */}
      <div className="bg-white rounded-2xl border border-dark-200 p-5 mb-6">
        <h2 className="font-bold text-dark-900 mb-4">Member Settings</h2>
        {settingsLoading ? (
          <LoadingSpinner />
        ) : (
          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-5 max-w-lg">
            <Input
              label="Minimum Total Belanja (IDR)"
              type="number"
              placeholder="500000"
              error={errors.minMonthlyAmount?.message}
              hint="Total belanja kumulatif user selama periode membership (sesuai Durasi Membership di bawah) yang harus dipenuhi agar status member aktif atau diperpanjang otomatis. Contoh: jika durasi 180 hari dan diisi 500000, user harus belanja minimal Rp500.000 dalam 180 hari terakhir."
              {...register('minMonthlyAmount', { required: true, min: 0, valueAsNumber: true })}
            />
            <Input
              label="Durasi Membership (Hari)"
              type="number"
              placeholder="180"
              error={errors.renewalPeriodDays?.message}
              hint="Berapa hari membership berlaku sejak pertama kali aktif atau diperpanjang. Contoh: isi 180 berarti member berlaku selama 6 bulan. Jika belanja kumulatif mencukupi sebelum expired, sistem akan memperpanjang otomatis."
              {...register('renewalPeriodDays', { required: true, min: 1, max: 365, valueAsNumber: true })}
            />
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="hasFreeShipping"
                  className="w-4 h-4 accent-brand-800 flex-shrink-0"
                  {...register('hasFreeShipping')}
                />
                <label htmlFor="hasFreeShipping" className="text-sm font-medium text-dark-700">
                  Member mendapat gratis ongkir
                </label>
              </div>
              <p className="text-xs text-dark-500 pl-7">
                Jika diaktifkan, semua user dengan status member aktif akan otomatis mendapat ongkir gratis saat checkout, tanpa perlu kode voucher. Jika dinonaktifkan, member tetap mendapat hak akses produk eksklusif tapi tidak gratis ongkir.
              </p>
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </form>
        )}
      </div>

      {/* Members list */}
      <div className="bg-white rounded-2xl border border-dark-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-dark-200">
          <h2 className="font-bold text-dark-900">
            Members List
            <span className="ml-2 text-sm font-normal text-dark-500">({members.length})</span>
          </h2>
        </div>

        {membersLoading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        ) : members.length === 0 ? (
          <EmptyState title="No members yet" description="Members are users who have met the minimum spend." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dark-50 border-b border-dark-200">
                <tr>
                  <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Name</th>
                  <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Email</th>
                  <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Member Since</th>
                  <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {members.map((m, i) => (
                  <tr key={m.id} className={i % 2 === 0 ? 'bg-white' : 'bg-dark-50/50'}>
                    <td className="px-4 py-3 font-medium text-dark-900">{m.name}</td>
                    <td className="px-4 py-3 text-dark-600">{m.email}</td>
                    <td className="px-4 py-3 text-dark-500">{formatDate(m.memberSince || m.createdAt)}</td>
                    <td className="px-4 py-3 text-dark-500">{m.memberExpiry ? formatDate(m.memberExpiry) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminMembersPage;
