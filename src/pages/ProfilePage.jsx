import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  User,
  Star,
  Gift,
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
} from 'lucide-react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useCart } from '../features/cart/hooks/useCart';
import { Navbar } from '../shared/components/Navbar';
import LoadingSpinner from '../shared/components/LoadingSpinner';
import Modal from '../shared/components/Modal';
import Button from '../shared/components/Button';
import { WilayahSelect } from '../shared/components/WilayahSelect';
import { formatCurrency, formatDate } from '../shared/utils/format';
import api from '../shared/services/api';
import { Footer } from '../shared/components/Footer';
import {
  getAddresses,
  createAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
} from '../features/orders/services/order.service';

async function getMemberProgress() {
  const res = await api.get('/members/my-progress');
  return res.data;
}

const ADDRESS_TOP_FIELDS = [
  { name: 'label', label: 'Label', placeholder: 'Home, Office, etc.' },
  { name: 'recipientName', label: 'Recipient Name', placeholder: 'Full recipient name' },
  { name: 'phone', label: 'Phone Number', placeholder: '08xxxxxxxxxx' },
  { name: 'street', label: 'Street Address', placeholder: 'Street name, number, etc.', full: true },
];

export function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [addressModal, setAddressModal] = useState(null); // null | 'add' | address object
  const [deleteConfirm, setDeleteConfirm] = useState(null);
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

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

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

  const defaultMutation = useMutation({
    mutationFn: setDefaultAddress,
    onSuccess: () => { toast.success('Default address changed'); invalidateAddresses(); },
    onError: () => toast.error('Failed to change default address'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => { toast.success('Address deleted'); invalidateAddresses(); setDeleteConfirm(null); },
    onError: () => toast.error('Failed to delete address'),
  });

  const openAdd = () => { reset({}); setAddressModal('add'); };
  const openEdit = (addr) => { reset(addr); setAddressModal(addr); };

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
                {user?.phone && (
                  <div className="flex items-center gap-2 text-sm text-dark-600">
                    <Phone size={13} className="text-dark-400 flex-shrink-0" />
                    <span>{user.phone}</span>
                  </div>
                )}
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
              <p className="text-white/40 text-[10px] uppercase tracking-widest mb-0.5">Name</p>
              <p className="text-white font-black text-2xl leading-tight">{user?.name || '-'}</p>
              <div className="grid grid-cols-3 gap-4 mt-5">
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
          <div className="bg-dark-900 rounded-2xl overflow-hidden p-6">
            <p className="text-white font-black text-xl mb-1">Unlock Member</p>
            <p className="text-dark-400 text-xs mb-5">Keep shopping to unlock member status</p>
            <div className="space-y-2 mb-5">
              <div className="flex justify-between text-xs">
                <span className="text-dark-400 font-medium">This month's spending</span>
                <span className="text-white font-bold">
                  {formatCurrency(progress.currentSpend ?? 0)} / {formatCurrency(progress.minMonthlyAmount ?? 0)}
                </span>
              </div>
              <div className="w-full bg-dark-700 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all duration-700 bg-gradient-to-r from-brand-500 to-brand-700"
                  style={{ width: `${Math.min(progress.progressPercent ?? 0, 100)}%` }}
                />
              </div>
              <p className="text-brand-400 text-xs font-semibold">
                {formatCurrency(
                  Math.max((progress.minMonthlyAmount ?? 0) - (progress.currentSpend ?? 0), 0)
                )}{' '}
                more to unlock member status!
              </p>
            </div>
            <div className="space-y-2">
              {(progress.discountPercent ?? 0) > 0 && (
                <div className="flex items-center gap-2 text-xs text-dark-400">
                  <Gift size={13} className="text-brand-500 flex-shrink-0" />
                  <span>{progress.discountPercent}% discount on all orders</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-dark-400">
                <Truck size={13} className="text-brand-500 flex-shrink-0" />
                <span>Free shipping on every order</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-dark-400">
                <Star size={13} className="text-brand-500 flex-shrink-0" />
                <span>Exclusive member badge on your profile</span>
              </div>
            </div>
          </div>
        )}

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-dark-200 p-5 text-center">
            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Gift size={20} className="text-brand-800" />
            </div>
            <p className="font-bold text-dark-900 text-sm">
              {(progress.discountPercent ?? 0) > 0
                ? `${progress.discountPercent}% Discount`
                : 'Member Discount'}
            </p>
            <p className="text-xs text-dark-500 mt-1">On every order you place</p>
          </div>
          <div className="bg-white rounded-2xl border border-dark-200 p-5 text-center">
            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Truck size={20} className="text-brand-800" />
            </div>
            <p className="font-bold text-dark-900 text-sm">Free Shipping</p>
            <p className="text-xs text-dark-500 mt-1">No delivery fees for members</p>
          </div>
          <div className="bg-white rounded-2xl border border-dark-200 p-5 text-center">
            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Star size={20} className="text-brand-800" />
            </div>
            <p className="font-bold text-dark-900 text-sm">Member Badge</p>
            <p className="text-xs text-dark-500 mt-1">Show off your member status</p>
          </div>
        </div>

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
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 cursor-pointer ${addr.isDefault ? 'border-brand-800 bg-brand-800' : 'border-dark-300'}`}
                        onClick={() => !addr.isDefault && defaultMutation.mutate(addr.id)}
                      >
                        {addr.isDefault && <Check size={10} className="text-white" strokeWidth={3} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-dark-900">{addr.label}</span>
                          {addr.isDefault && (
                            <span className="text-xs bg-brand-100 text-brand-800 px-1.5 py-0.5 rounded-md font-medium">Default</span>
                          )}
                        </div>
                        <p className="text-sm text-dark-700 mt-0.5">{addr.recipientName} · {addr.phone}</p>
                        <p className="text-xs text-dark-500 mt-0.5">
                          {addr.street}, {addr.city}, {addr.province} {addr.postalCode}
                        </p>
                      </div>
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
        <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="space-y-3">
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
            onChange={({ province, regency }) => {
              if (province) setValue('province', province.name);
              if (regency) setValue('city', regency.name);
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
