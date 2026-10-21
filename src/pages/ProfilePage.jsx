import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  User,
  Star,
  Truck,
  Calendar,
  TrendingUp,
  Package,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Heart,
} from 'lucide-react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useCart } from '../features/cart/hooks/useCart';
import { Navbar } from '../shared/components/Navbar';
import LoadingSpinner from '../shared/components/LoadingSpinner';
import Modal from '../shared/components/Modal';
import Button from '../shared/components/Button';
import { WilayahSelect } from '../shared/components/WilayahSelect';
import { formatCurrency, formatDate, imageUrl } from '../shared/utils/format';
import api from '../shared/services/api';
import { updateProfile } from '../features/auth/services/auth.service';
import { Footer } from '../shared/components/Footer';
import {
  getAddresses,
  createAddress,
  updateAddress,

  deleteAddress,
} from '../features/orders/services/order.service';
import { getMyFavorites } from '../features/favorites/services/favorite.service';
import { getMemberProgress } from '../features/members/hooks/useMemberProgress';

const ADDRESS_TOP_FIELDS = [
  { name: 'label', label: 'Label', placeholder: 'Home, Office, etc.' },
  { name: 'recipientName', label: 'Recipient Name', placeholder: 'Full recipient name' },
  { name: 'street', label: 'Street Address', placeholder: 'Street name, number, etc.', full: true },
];

export function ProfilePage() {
  const { user, isAuthenticated, logout, setUser } = useAuth();
  const [addressModal, setAddressModal] = useState(null); // null | 'add' | address object
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [wilayahKey, setWilayahKey] = useState(0);
  const [addrRegionCodes, setAddrRegionCodes] = useState({});
  const queryClient = useQueryClient();

  const { cartCount } = useCart({ isAuthenticated });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['member-progress'],
    queryFn: getMemberProgress,
    enabled: isAuthenticated,
  });

  const { data: addressData } = useQuery({
    queryKey: ['addresses'],
    queryFn: getAddresses,
    enabled: isAuthenticated,
  });
  const addresses = addressData?.data ?? addressData ?? [];

  const { data: favoritesData, isLoading: favLoading } = useQuery({
    queryKey: ['my-favorites'],
    queryFn: getMyFavorites,
    enabled: isAuthenticated,
  });
  const favorites = favoritesData?.data ?? [];

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm();

  const invalidateAddresses = () => queryClient.invalidateQueries({ queryKey: ['addresses'] });

  const saveMutation = useMutation({
    mutationFn: (values) =>
      addressModal?.id
        ? updateAddress(addressModal.id, values)
        : createAddress(values),
    onSuccess: () => {
      toast.success(addressModal?.id ? 'Address updated' : 'Address added');
      invalidateAddresses();
      setAddressModal(null);
      reset();
    },
    onError: () => toast.error('Failed to save address'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => { toast.success('Address deleted'); invalidateAddresses(); setDeleteConfirm(null); },
    onError: () => toast.error('Failed to delete address'),
  });

  const phoneMutation = useMutation({
    mutationFn: (phone) => updateProfile({ phone }),
    onSuccess: (data) => {
      const updated = data?.data ?? data;
      const newUser = { ...user, phone: updated.phone };
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      toast.success('Nomor HP berhasil diperbarui');
      setEditingPhone(false);
    },
    onError: () => toast.error('Gagal memperbarui nomor HP'),
  });

  const openAdd = () => {
    reset({});
    setAddrRegionCodes({});
    setWilayahKey((k) => k + 1);
    setAddressModal('add');
  };

  const openEdit = (addr) => {
    reset(addr);
    setAddrRegionCodes({
      provinceCode: addr.provinceCode ?? null,
      regencyCode: addr.regencyCode ?? null,
      districtCode: addr.districtCode ?? null,
      villageCode: addr.villageCode ?? null,
    });
    setWilayahKey((k) => k + 1);
    setAddressModal(addr);
  };

  const progress = data?.data ?? {};

  const initials = user?.name
    ? user.name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : '?';

  return (
    <div className="min-h-screen bg-dark-50 animate-fade-up">
      <Navbar
        user={user}
        cartCount={cartCount}
        onLogout={logout}
      />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Page Title */}
        <h1 className="text-2xl font-black text-dark-900">My Profile</h1>

        {/* User Info Card */}
        <div className="bg-white rounded-2xl border border-dark-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-brand-800 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-dark-900">{user?.name || '-'}</h2>
                {user?.isMember && (
                  <span className="inline-flex items-center px-2 py-0.5 bg-brand-100 text-brand-800 text-xs font-bold rounded-full">
                    MEMBER
                  </span>
                )}
              </div>
              <div className="mt-1 space-y-1">
                {user?.email && (
                  <div className="flex items-center gap-2 text-sm text-dark-600">
                    <Mail size={13} className="text-dark-400 flex-shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-dark-600">
                  <Phone size={13} className="text-dark-400 flex-shrink-0" />
                  {editingPhone ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        autoFocus
                        className="flex-1 px-2 py-0.5 text-sm border border-dark-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700 min-w-0"
                      />
                      <button
                        onClick={() => phoneMutation.mutate(phoneInput)}
                        disabled={phoneMutation.isPending}
                        className="p-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Check size={14} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => setEditingPhone(false)}
                        className="p-1 text-dark-400 hover:bg-dark-100 rounded-lg transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span>{user?.phone || <span className="text-dark-400 italic">Belum diisi</span>}</span>
                      <button
                        onClick={() => { setPhoneInput(user?.phone || ''); setEditingPhone(true); }}
                        className="p-0.5 text-dark-300 hover:text-brand-700 rounded transition-colors"
                      >
                        <Pencil size={12} />
                      </button>
                    </div>
                  )}
                </div>
                {user?.createdAt && (
                  <div className="flex items-center gap-2 text-sm text-dark-500">
                    <Calendar size={13} className="text-dark-400 flex-shrink-0" />
                    <span>Joined {formatDate(user.createdAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Membership Card */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-dark-200 p-10 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : isError ? (
          <div className="bg-white rounded-2xl border border-dark-200 p-6 text-center text-sm text-dark-500">
            Unable to load membership info. Please try again later.
          </div>
        ) : progress.isMember ? (
          /* Active Member Card */
          <div
            className="rounded-2xl overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg, #9b1c1c 0%, #450a0a 60%, #1f2937 100%)' }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                backgroundSize: '16px 16px',
                opacity: 0.03,
              }}
            />
            <div className="relative z-10 p-6">
              <div className="flex items-center gap-2 mb-5">
                <Star size={15} className="text-brand-300" fill="currentColor" aria-hidden="true" />
                <span className="text-white font-black text-xs tracking-widest uppercase">Active Member</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {progress.memberSince && (
                  <div>
                    <p className="text-white/40 text-[10px] uppercase tracking-wide mb-0.5">Since</p>
                    <p className="text-white text-xs font-semibold">{formatDate(progress.memberSince)}</p>
                  </div>
                )}
                {progress.memberExpiry && (
                  <div>
                    <p className="text-white/40 text-[10px] uppercase tracking-wide mb-0.5">Valid Until</p>
                    <p className="text-white text-xs font-semibold">{formatDate(progress.memberExpiry)}</p>
                  </div>
                )}
                {progress.daysUntilExpiry != null && (
                  <div>
                    <p className="text-white/40 text-[10px] uppercase tracking-wide mb-0.5">Days Left</p>
                    <p className="text-brand-300 text-xs font-black">{progress.daysUntilExpiry} days</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Non-member Progress Card */
          <div
            className="rounded-2xl overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg, #374151 0%, #1f2937 60%, #111827 100%)' }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                backgroundSize: '16px 16px',
                opacity: 0.03,
              }}
            />
            <div className="relative z-10 p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-1">
                <p className="text-white font-black text-xl">Jadi Member</p>
                <span className="text-xs font-bold text-dark-300 bg-white/10 px-2.5 py-1 rounded-full">
                  Belum aktif
                </span>
              </div>
              <p className="text-white/50 text-xs mb-5">
                Kumpulkan belanja {formatCurrency(progress.minMonthlyAmount ?? 0)} dalam periode ini untuk unlock membership
              </p>

              {/* Progress */}
              <div className="space-y-2 mb-5">
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Total belanja periode ini</span>
                  <span className="text-white font-bold">
                    {formatCurrency(progress.currentSpend ?? 0)}
                    <span className="text-white/40 font-normal"> / {formatCurrency(progress.minMonthlyAmount ?? 0)}</span>
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-2.5 rounded-full transition-all duration-700 bg-gradient-to-r from-brand-500 to-brand-800"
                    style={{ width: `${Math.min(progress.progressPercent ?? 0, 100)}%` }}
                  />
                </div>
                <p className="text-brand-400 text-xs font-semibold">
                  {formatCurrency(progress.remaining ?? 0)} lagi untuk jadi Member
                </p>
              </div>

              {/* Duration info */}
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-5 space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-brand-400 flex-shrink-0" />
                  <p className="text-white/60 text-xs">
                    Membership aktif selama{' '}
                    <span className="text-white font-bold">{progress.renewalPeriodDays ?? 180} hari</span>
                    {' '}setelah kamu memenuhi syarat
                  </p>
                </div>
                {progress.daysLeftInWindow != null && (
                  <div className="flex items-center gap-2">
                    <TrendingUp size={13} className="text-brand-400 flex-shrink-0" />
                    <p className="text-white/60 text-xs">
                      Sisa waktu periode ini:{' '}
                      <span className={`font-bold ${progress.daysLeftInWindow <= 14 ? 'text-red-400' : 'text-white'}`}>
                        {progress.daysLeftInWindow} hari
                      </span>
                      {progress.daysLeftInWindow <= 14 && (
                        <span className="text-red-400"> — segera belanja!</span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Benefits */}
              <p className="text-white/40 text-[10px] uppercase tracking-widest mb-3">Yang kamu dapat</p>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-brand-800/30 flex items-center justify-center flex-shrink-0">
                    <Truck size={13} className="text-brand-400" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-semibold">Gratis Ongkir</p>
                    <p className="text-white/40 text-[11px]">Tidak ada biaya pengiriman di setiap pesanan</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-brand-800/30 flex items-center justify-center flex-shrink-0">
                    <Star size={13} className="text-brand-400" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-semibold">Member Badge</p>
                    <p className="text-white/40 text-[11px]">Badge eksklusif yang tampil di profil kamu</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Benefits Grid — only for active members */}
        {progress?.isMember && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-dark-200 p-5 text-center">
              <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Truck size={20} className="text-brand-800" />
              </div>
              <p className="font-bold text-dark-900 text-sm">Gratis Ongkir</p>
              <p className="text-xs text-dark-500 mt-1">Tidak ada biaya pengiriman untuk member</p>
            </div>
            <div className="bg-white rounded-2xl border border-dark-200 p-5 text-center">
              <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star size={20} className="text-brand-800" />
              </div>
              <p className="font-bold text-dark-900 text-sm">Member Badge</p>
              <p className="text-xs text-dark-500 mt-1">Badge eksklusif di profil kamu</p>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/orders"
            className="flex items-center justify-between bg-white rounded-2xl border border-dark-200 p-5 hover:border-brand-800 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-dark-100 group-hover:bg-brand-100 rounded-xl flex items-center justify-center transition-colors">
                <Package size={18} className="text-dark-600 group-hover:text-brand-800 transition-colors" />
              </div>
              <span className="font-semibold text-dark-800 text-sm">View My Orders</span>
            </div>
            <ChevronRight size={16} className="text-dark-400 group-hover:text-brand-800 transition-colors" />
          </Link>
          <Link
            to="/home"
            className="flex items-center justify-between bg-white rounded-2xl border border-dark-200 p-5 hover:border-brand-800 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-dark-100 group-hover:bg-brand-100 rounded-xl flex items-center justify-center transition-colors">
                <TrendingUp size={18} className="text-dark-600 group-hover:text-brand-800 transition-colors" />
              </div>
              <span className="font-semibold text-dark-800 text-sm">Continue Shopping</span>
            </div>
            <ChevronRight size={16} className="text-dark-400 group-hover:text-brand-800 transition-colors" />
          </Link>
        </div>

        {/* Favorites */}
        {isAuthenticated && (
          <div className="bg-white rounded-2xl border border-dark-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-dark-100">
              <h2 className="font-bold text-dark-900 flex items-center gap-2">
                <Heart size={16} className="text-red-500" fill="currentColor" /> My Favorites
              </h2>
              <span className="text-xs text-dark-400">{favorites.length} item{favorites.length !== 1 ? 's' : ''}</span>
            </div>

            {favLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : favorites.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Heart size={28} className="text-dark-300 mx-auto mb-2" />
                <p className="text-sm text-dark-500">No favorites yet.</p>
                <Link to="/home" className="mt-2 inline-block text-sm text-brand-700 hover:underline font-medium">
                  Browse products
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-dark-100">
                {favorites.map(({ product }) => {
                  if (!product) return null;
                  const imgs = product.images || [];
                  const raw = imgs[0]?.url || imgs[0] || null;
                  const src = raw ? imageUrl(raw) : null;
                  const displayPrice = product.displayPrice ?? product.price;
                  return (
                    <Link
                      key={product.id}
                      to={`/products/${product.id}`}
                      className="bg-white flex items-center gap-3 p-3 hover:bg-dark-50 transition-colors group"
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-dark-100 flex-shrink-0">
                        {src ? (
                          <img src={src} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-dark-300 text-lg">?</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-dark-900 line-clamp-2 leading-snug group-hover:text-brand-800 transition-colors">
                          {product.name}
                        </p>
                        <p className="text-brand-800 font-black text-sm mt-0.5">
                          {formatCurrency(displayPrice)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Alamat Pengiriman */}
        {isAuthenticated && (
          <div className="bg-white rounded-2xl border border-dark-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-dark-100">
              <h2 className="font-bold text-dark-900 flex items-center gap-2">
                <MapPin size={16} className="text-brand-800" /> Shipping Addresses
              </h2>
              <button
                onClick={openAdd}
                className="inline-flex items-center gap-1 text-sm text-brand-700 hover:text-brand-900 font-medium"
              >
                <Plus size={15} /> Add
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <MapPin size={28} className="text-dark-300 mx-auto mb-2" />
                <p className="text-sm text-dark-500">No saved addresses.</p>
                <button onClick={openAdd} className="mt-2 text-sm text-brand-700 hover:underline font-medium">
                  + Add address
                </button>
              </div>
            ) : (
              <div className="divide-y divide-dark-100">
                {addresses.map((addr) => (
                  <div key={addr.id} className="px-5 py-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm text-dark-900">{addr.label}</span>
                      <p className="text-sm text-dark-700 mt-0.5">{addr.recipientName}{user?.phone ? ` · ${user.phone}` : ''}</p>
                      <p className="text-xs text-dark-500 mt-0.5">
                        {addr.street}, {addr.city}, {addr.province} {addr.postalCode}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => openEdit(addr)} className="p-1.5 text-dark-400 hover:text-brand-700 rounded-lg hover:bg-brand-50 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteConfirm(addr)} className="p-1.5 text-dark-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Address Modal */}
      <Modal
        isOpen={Boolean(addressModal)}
        onClose={() => { setAddressModal(null); reset(); }}
        title={addressModal?.id ? 'Edit Address' : 'Add Address'}
        size="md"
      >
        <form
          onSubmit={handleSubmit((v) =>
            saveMutation.mutate({ ...v, ...addrRegionCodes })
          )}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            {ADDRESS_TOP_FIELDS.map(({ name, label, placeholder, full }) => (
              <div key={name} className={full ? 'col-span-2' : ''}>
                <label className="block text-xs font-medium text-dark-700 mb-1">{label}</label>
                <input
                  {...register(name, { required: `${label} is required` })}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 border border-dark-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
                />
                {errors[name] && <p className="text-xs text-red-500 mt-0.5">{errors[name].message}</p>}
              </div>
            ))}
          </div>
          <WilayahSelect
            key={wilayahKey}
            initialValue={addressModal?.id ? {
              provinceId: addressModal.provinceCode,
              regencyId: addressModal.regencyCode,
              districtId: addressModal.districtCode,
              villageId: addressModal.villageCode,
            } : undefined}
            onChange={({ province, regency, district, village }) => {
              if (province) { setValue('province', province.name); setAddrRegionCodes((c) => ({ ...c, provinceCode: province.id })); }
              if (regency) { setValue('city', regency.name); setAddrRegionCodes((c) => ({ ...c, regencyCode: regency.id })); }
              if (district) setAddrRegionCodes((c) => ({ ...c, districtCode: district.id }));
              if (village) setAddrRegionCodes((c) => ({ ...c, villageCode: village.id }));
            }}
            showVillage={false}
          />
          <div>
            <label className="block text-xs font-medium text-dark-700 mb-1">Postal Code</label>
            <input
              {...register('postalCode')}
              placeholder="12345"
              className="w-full px-3 py-2 border border-dark-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setAddressModal(null); reset(); }}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting || saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Address"
        size="sm"
      >
        <p className="text-sm text-dark-600 mb-4">
          Delete address <strong>{deleteConfirm?.label}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            variant="danger"
            className="flex-1"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(deleteConfirm.id)}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </Modal>

      <Footer />
    </div>
  );
}

export default ProfilePage;
