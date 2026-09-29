import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Plus, Edit, Trash2, X, Search, Package, CalendarDays,
  Upload, ImageIcon, Tag, ShoppingBag,
} from 'lucide-react';
import api from '../../../shared/services/api';
import {
  getAdminEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  addEventProducts,
  removeEventProduct,
} from '../../../features/events/services/event.service';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import Modal from '../../../shared/components/Modal';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import EmptyState from '../../../shared/components/EmptyState';
import { formatDate, formatCurrency, imageUrl } from '../../../shared/utils/format';

const MAX_BANNER_SIZE = 2 * 1024 * 1024;

async function getAllProducts(search) {
  const res = await api.get('/products', {
    params: { limit: 100, ...(search ? { search } : {}) },
  });
  return res.data;
}

function parseImages(raw) {
  try { return JSON.parse(raw || '[]'); } catch { return []; }
}

const STATUS_OPTIONS = ['ACTIVE', 'CLOSED', 'DRAFT'];

const STATUS_STYLES = {
  ACTIVE: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-600',
  DRAFT: 'bg-yellow-100 text-yellow-700',
};

const STATUS_LABELS = { ACTIVE: 'Active', CLOSED: 'Closed', DRAFT: 'Draft' };

export function AdminEventsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [productSearch, setProductSearch] = useState('');
  const debouncedSearch = useDebounce(productSearch, 300);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const queryClient = useQueryClient();

  // --- Events list ---
  const { data, isLoading } = useQuery({
    queryKey: ['admin-events'],
    queryFn: () => getAdminEvents(),
  });
  const events = data?.data?.events ?? data?.events ?? [];

  // --- Full event detail (includes products) when editing ---
  const { data: eventDetailData, isLoading: eventDetailLoading } = useQuery({
    queryKey: ['event-detail-edit', editing?.id],
    queryFn: () => getEvent(editing.id),
    enabled: !!editing?.id && modalOpen,
    staleTime: 0,
  });
  const eventDetail = eventDetailData?.data ?? eventDetailData ?? null;
  const currentEventProducts = eventDetail?.products ?? [];

  // --- All products (for add dropdown) ---
  const { data: allProductsData, isLoading: allProductsLoading } = useQuery({
    queryKey: ['all-products-for-event', debouncedSearch],
    queryFn: () => getAllProducts(debouncedSearch),
    enabled: !!editing?.id && modalOpen && activeTab === 'products',
    staleTime: 10_000,
  });
  const allProducts = allProductsData?.data?.products ?? allProductsData?.products ?? [];

  const currentProductIds = useMemo(
    () => new Set(currentEventProducts.map((ep) => ep.productId ?? ep.product?.id ?? ep.id)),
    [currentEventProducts]
  );

  const filteredProducts = useMemo(
    () => allProducts.filter((p) => !currentProductIds.has(p.id)),
    [allProducts, currentProductIds]
  );

  // --- Form ---
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const resetBanner = () => {
    setBannerFile(null);
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    setBannerPreview(null);
  };

  const openAdd = () => {
    setEditing(null);
    setProductSearch('');
    setActiveTab('info');
    resetBanner();
    reset({ name: '', description: '', destination: '', status: 'ACTIVE', startDate: '', endDate: '' });
    setModalOpen(true);
  };

  const openEdit = (ev) => {
    setEditing(ev);
    setProductSearch('');
    setActiveTab('info');
    resetBanner();
    reset({
      name: ev.name,
      description: ev.description || '',
      destination: ev.destination || '',
      status: ev.status,
      startDate: ev.startDate ? new Date(ev.startDate).toISOString().slice(0, 16) : '',
      endDate: ev.endDate ? new Date(ev.endDate).toISOString().slice(0, 16) : '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetBanner();
  };

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BANNER_SIZE) {
      toast.error('Image must be smaller than 2 MB');
      e.target.value = '';
      return;
    }
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  // --- Mutations ---
  const saveMutation = useMutation({
    mutationFn: (formValues) => {
      const fd = new FormData();
      if (formValues.name) fd.append('name', formValues.name);
      if (formValues.description) fd.append('description', formValues.description);
      if (formValues.destination) fd.append('destination', formValues.destination);
      if (formValues.status) fd.append('status', formValues.status);
      if (formValues.startDate) fd.append('startDate', new Date(formValues.startDate).toISOString());
      if (formValues.endDate) fd.append('endDate', new Date(formValues.endDate).toISOString());
      if (bannerFile) fd.append('banner', bannerFile);
      return editing ? updateEvent(editing.id, fd) : createEvent(fd);
    },
    onSuccess: (res) => {
      toast.success(editing ? 'Event updated!' : 'Event created!');
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      if (editing) {
        queryClient.invalidateQueries({ queryKey: ['event-detail-edit', editing.id] });
      }
      closeModal();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      toast.success('Event deleted');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to delete'),
  });

  const addProductMutation = useMutation({
    mutationFn: ({ eventId, productId }) => addEventProducts(eventId, [productId]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-detail-edit', editing?.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to add product'),
  });

  const removeProductMutation = useMutation({
    mutationFn: ({ eventId, productId }) => removeEventProduct(eventId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-detail-edit', editing?.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to remove product'),
  });

  const existingBannerUrl = editing?.bannerImage ? imageUrl(editing.bannerImage) : null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-dark-900">Events</h1>
          <p className="text-dark-500 text-sm mt-1">
            {events.length} event{events.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="primary" onClick={openAdd}>
          <Plus size={16} /> Add Event
        </Button>
      </div>

      {/* Events table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events"
          description="Create your first jastip event."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-dark-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-dark-50 border-b border-dark-200">
              <tr>
                <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Event</th>
                <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Destination</th>
                <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Dates</th>
                <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Status</th>
                <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Products</th>
                <th scope="col" className="text-right px-4 py-3 font-semibold text-dark-700"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {events.map((ev, i) => {
                const productCount = ev._count?.products ?? ev.products?.length ?? 0;
                const isExpired = ev.endDate && new Date(ev.endDate) < new Date();
                const statusStyle = isExpired
                  ? 'bg-red-100 text-red-700'
                  : (STATUS_STYLES[ev.status] || STATUS_STYLES.DRAFT);
                return (
                  <tr key={ev.id} className={i % 2 === 0 ? 'bg-white' : 'bg-dark-50/50'}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {ev.bannerImage ? (
                          <img
                            src={imageUrl(ev.bannerImage)}
                            alt={ev.name}
                            className="w-12 h-8 object-cover rounded-lg border border-dark-100 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-8 rounded-lg bg-dark-100 flex items-center justify-center flex-shrink-0">
                            <ImageIcon size={13} className="text-dark-400" />
                          </div>
                        )}
                        <span className="font-semibold text-dark-900 truncate max-w-[160px]">{ev.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-dark-600 text-sm">{ev.destination || '-'}</td>
                    <td className="px-4 py-3 text-dark-500 text-xs whitespace-nowrap">
                      {ev.startDate ? formatDate(ev.startDate) : '—'}
                      {ev.endDate ? ` → ${formatDate(ev.endDate)}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusStyle}`}>
                        {isExpired ? 'Expired' : (STATUS_LABELS[ev.status] ?? ev.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-dark-600 text-sm">
                        <ShoppingBag size={13} className="text-dark-400" />
                        {productCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(ev)}
                          aria-label={`Edit event ${ev.name}`}
                          className="p-1.5 text-dark-500 hover:text-brand-800 hover:bg-brand-50 rounded-lg transition-colors"
                        >
                          <Edit size={15} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(ev)}
                          aria-label={`Delete event ${ev.name}`}
                          className="p-1.5 text-dark-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? `Edit — ${editing.name}` : 'Add Event'}
        size="lg"
      >
        {/* Tabs */}
        <div role="tablist" className="flex border-b border-dark-200 mb-5 -mt-1">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'info'}
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-brand-700 text-brand-700'
                : 'border-transparent text-dark-500 hover:text-dark-800'
            }`}
          >
            Event Info
          </button>
          {editing && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'products'}
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'products'
                  ? 'border-brand-700 text-brand-700'
                  : 'border-transparent text-dark-500 hover:text-dark-800'
              }`}
            >
              Products
              {currentEventProducts.length > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  activeTab === 'products' ? 'bg-brand-100 text-brand-700' : 'bg-dark-200 text-dark-600'
                }`}>
                  {currentEventProducts.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* ── INFO TAB ── */}
        {activeTab === 'info' && (
          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
            <Input
              label="Name"
              required
              placeholder="Japan Trip May 2025"
              error={errors.name?.message}
              {...register('name', { required: 'Name is required' })}
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-dark-700">Description</label>
              <textarea
                rows={3}
                placeholder="Describe the event..."
                className="w-full px-3 py-2 border border-dark-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-transparent resize-none"
                {...register('description')}
              />
            </div>

            <Input label="Destination" placeholder="Tokyo, Japan" {...register('destination')} />

            {/* Banner upload */}
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">Banner Image</label>
              <p className="text-xs text-dark-400 mb-2">
                Recommended: 1200 × 400 px · Max 2 MB · JPG / PNG / WebP
              </p>

              {(bannerPreview || existingBannerUrl) && (
                <div className="relative mb-2 rounded-xl overflow-hidden border border-dark-200 bg-dark-50">
                  <img
                    src={bannerPreview || existingBannerUrl}
                    alt="Banner preview"
                    className="w-full h-32 object-cover"
                  />
                  {bannerPreview && (
                    <button
                      type="button"
                      onClick={resetBanner}
                      aria-label="Remove banner image"
                      className="absolute top-2 right-2 p-1 bg-white/90 rounded-full text-dark-600 hover:text-red-600 shadow"
                    >
                      <X size={13} aria-hidden="true" />
                    </button>
                  )}
                  {existingBannerUrl && !bannerPreview && (
                    <span className="absolute bottom-2 left-2 text-xs bg-black/40 text-white px-2 py-0.5 rounded-full">
                      Current banner
                    </span>
                  )}
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer px-3 py-2 border border-dashed border-dark-300 rounded-xl hover:border-brand-600 hover:bg-brand-50/50 transition-colors">
                <Upload size={15} className="text-dark-400 flex-shrink-0" />
                <span className="text-sm text-dark-500 truncate">
                  {bannerFile
                    ? bannerFile.name
                    : existingBannerUrl
                    ? 'Replace banner image...'
                    : 'Choose image...'}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleBannerChange}
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 border border-dark-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
                {...register('status', { required: true })}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Start Date" type="datetime-local" {...register('startDate')} />
              <Input label="End Date" type="datetime-local" {...register('endDate')} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={isSubmitting || saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Saving...' : editing ? 'Update Event' : 'Create Event'}
              </Button>
            </div>
          </form>
        )}

        {/* ── PRODUCTS TAB ── */}
        {activeTab === 'products' && editing && (
          <div className="space-y-5">
            {/* Current products */}
            <div>
              <h3 className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-2">
                Products in this event
              </h3>

              {eventDetailLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : currentEventProducts.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center border border-dashed border-dark-200 rounded-xl bg-dark-50/50">
                  <Package size={28} className="text-dark-300 mb-2" />
                  <p className="text-sm text-dark-500 font-medium">No products yet</p>
                  <p className="text-xs text-dark-400 mt-0.5">Search and add products below</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {currentEventProducts.map((ep) => {
                    const product = ep.product ?? ep;
                    const productId = ep.productId ?? product.id;
                    const images = parseImages(product.images);
                    const thumb = images[0] ? imageUrl(images[0]) : null;
                    const variantCount = product.variants?.length ?? 0;
                    return (
                      <li
                        key={productId}
                        className="flex items-center gap-3 px-3 py-2.5 bg-white border border-dark-200 rounded-xl hover:border-dark-300 transition-colors"
                      >
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded-lg flex-shrink-0 border border-dark-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-dark-100 flex items-center justify-center flex-shrink-0">
                            <ImageIcon size={14} className="text-dark-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-dark-900 truncate">{product.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-brand-700 font-medium">
                              {formatCurrency(product.price)}
                            </span>
                            {product.category?.name && (
                              <span className="inline-flex items-center gap-0.5 text-xs text-dark-400">
                                <Tag size={10} />
                                {product.category.name}
                              </span>
                            )}
                            {variantCount > 0 && (
                              <span className="text-xs text-dark-400">{variantCount} variant{variantCount !== 1 ? 's' : ''}</span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={removeProductMutation.isPending}
                          onClick={() => removeProductMutation.mutate({ eventId: editing.id, productId })}
                          aria-label={`Remove ${product.name} from event`}
                          className="flex-shrink-0 p-1.5 text-dark-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X size={14} aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-dark-100" />

            {/* Add products */}
            <div>
              <h3 className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-2">
                Add products
              </h3>

              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" aria-hidden="true" />
                <input
                  type="search"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products..."
                  aria-label="Search products to add"
                  className="w-full pl-9 pr-3 py-2 border border-dark-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
                />
                {productSearch && (
                  <button
                    type="button"
                    onClick={() => setProductSearch('')}
                    aria-label="Clear product search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600"
                  >
                    <X size={13} aria-hidden="true" />
                  </button>
                )}
              </div>

              {allProductsLoading ? (
                <div className="flex justify-center py-6">
                  <LoadingSpinner />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-5 text-sm text-dark-400">
                  {debouncedSearch
                    ? `No products matching "${debouncedSearch}"`
                    : allProducts.length === 0
                    ? 'No products available'
                    : 'All products are already in this event'}
                </div>
              ) : (
                <ul className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
                  {filteredProducts.map((p) => {
                    const images = parseImages(p.images);
                    const thumb = images[0] ? imageUrl(images[0]) : null;
                    const isAdding =
                      addProductMutation.isPending &&
                      addProductMutation.variables?.productId === p.id;
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          disabled={addProductMutation.isPending}
                          onClick={() =>
                            addProductMutation.mutate({ eventId: editing.id, productId: p.id })
                          }
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:border-brand-200 hover:bg-brand-50/60 transition-colors text-left"
                        >
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={p.name}
                              className="w-9 h-9 object-cover rounded-lg flex-shrink-0 border border-dark-100"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-dark-100 flex items-center justify-center flex-shrink-0">
                              <ImageIcon size={13} className="text-dark-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-dark-800 truncate">{p.name}</p>
                            <p className="text-xs text-dark-400">{formatCurrency(p.price)}</p>
                          </div>
                          <div className="flex-shrink-0">
                            {isAdding ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <span className="flex items-center gap-0.5 text-xs text-brand-700 font-medium">
                                <Plus size={13} /> Add
                              </span>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        variant="danger"
        title="Hapus Event"
        message={`Yakin ingin menghapus event "${deleteTarget?.name}"?`}
        confirmLabel={deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
      />
    </div>
  );
}

export default AdminEventsPage;
