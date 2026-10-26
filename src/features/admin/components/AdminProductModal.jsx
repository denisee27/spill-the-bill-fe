import { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { PriceCalculator } from './PriceCalculator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2, ImagePlus, X, Camera, Image, ChevronDown, Search, Loader2 } from 'lucide-react';
import api from '../../../shared/services/api';
import {
  getProductAdmin,
  createProduct,
  updateProduct,
  getCategories,
  getOrigins,
} from '../../products/services/product.service';
import { getAdminEvents } from '../../events/services/event.service';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import { MediaUpload } from '../../../shared/components/MediaUpload';
import { RichTextEditor } from '../../../shared/components/RichTextEditor';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import { useProductTypes } from '../../../shared/hooks/useProductTypes';
import { imageUrl as buildImageUrl, formatCurrency } from '../../../shared/utils/format';
import clsx from 'clsx';

// ── Per-variant row: has its own useWatch for live PriceCalculator ──────────
function VariantRow({
  field, i, control, register,
  imgVal, onPickerToggle, isPickerOpen, onCameraClick, onGalleryClick,
  onImageRemove, onRemoveVariant,
}) {
  const price = useWatch({ control, name: `variants.${i}.price` });
  const fee = useWatch({ control, name: `variants.${i}.fee` });
  const orig = useWatch({ control, name: `variants.${i}.originalPrice` });

  const previewSrc = imgVal instanceof File
    ? URL.createObjectURL(imgVal)
    : (typeof imgVal === 'string' && imgVal ? buildImageUrl(imgVal) : null);

  return (
    <div className="rounded-xl border border-dark-200 bg-dark-50/40 p-3 space-y-2">
      {/* Input row */}
      <div
        className="grid gap-2 items-center"
        style={{ gridTemplateColumns: '44px 1fr 90px 80px 90px 62px 32px' }}
      >
        {/* Photo picker */}
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={onPickerToggle}
            className="w-11 h-11 rounded-lg border-2 border-dashed border-dark-300 overflow-hidden flex items-center justify-center hover:border-brand-600 transition-colors bg-white"
          >
            {previewSrc ? (
              <img src={previewSrc} alt="" className="w-full h-full object-cover" />
            ) : (
              <ImagePlus size={14} className="text-dark-400" />
            )}
          </button>

          {/* Picker dropdown */}
          {isPickerOpen && (
            <div
              className="absolute bottom-full mb-1 left-0 bg-white rounded-xl shadow-xl border border-dark-200 overflow-hidden z-30 w-40"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={onCameraClick}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-dark-700 hover:bg-dark-50 transition-colors"
              >
                <Camera size={13} className="text-brand-700 flex-shrink-0" />
                Take Photo
              </button>
              <div className="border-t border-dark-100" />
              <button
                type="button"
                onClick={onGalleryClick}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-dark-700 hover:bg-dark-50 transition-colors"
              >
                <Image size={13} className="text-brand-700 flex-shrink-0" />
                Choose Gallery
              </button>
            </div>
          )}

          {previewSrc && (
            <button
              type="button"
              onClick={onImageRemove}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"
            >
              <X size={8} />
            </button>
          )}
        </div>

        <input
          placeholder="e.g. Size S"
          className="px-2.5 py-2 border border-dark-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 w-full bg-white"
          {...register(`variants.${i}.name`, { required: true })}
        />
        <input
          type="number"
          placeholder="350000"
          min={0}
          className="px-2.5 py-2 border border-dark-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 w-full bg-white"
          {...register(`variants.${i}.price`, { required: true, min: 0 })}
        />
        <input
          type="number"
          placeholder="0"
          min={0}
          className="px-2.5 py-2 border border-dark-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 w-full bg-white"
          {...register(`variants.${i}.fee`, { min: 0 })}
        />
        <input
          type="number"
          placeholder="—"
          min={0}
          className="px-2.5 py-2 border border-dark-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 w-full bg-white"
          {...register(`variants.${i}.originalPrice`, { min: 0 })}
        />
        <input
          type="number"
          placeholder="0"
          min={0}
          className="px-2.5 py-2 border border-dark-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 w-full bg-white"
          {...register(`variants.${i}.stock`, { min: 0 })}
        />
        <button
          type="button"
          onClick={onRemoveVariant}
          className="p-1.5 text-dark-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Per-variant calculator */}
      <PriceCalculator price={price} fee={fee} originalPrice={orig} />
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export function AdminProductModal({ isOpen, onClose, productId, isDuplicate = false }) {
  const isEdit = Boolean(productId) && !isDuplicate;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [images, setImages] = useState([]);
  const [hasVariants, setHasVariants] = useState(false);
  const [variantImages, setVariantImages] = useState([]);
  const [lensLoading, setLensLoading] = useState(false);
  const lensInputRef = useRef(null);

  // Variant image picker state
  const [openPickerIdx, setOpenPickerIdx] = useState(null);  // which variant picker is open
  const [captureTargetIdx, setCaptureTargetIdx] = useState(null); // which variant to write to
  const variantCameraRef = useRef(null);
  const variantGalleryRef = useRef(null);

  const pendingEventIdRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { variants: [], originId: '', eventId: '', freeShipping: false },
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: 'variants',
  });
  const watchedType = useWatch({ control, name: 'type' });
  const watchedPrice = useWatch({ control, name: 'price' });
  const watchedFee = useWatch({ control, name: 'fee' });
  const watchedOriginalPrice = useWatch({ control, name: 'originalPrice' });

  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ['product', 'admin', productId],
    queryFn: () => getProductAdmin(productId),
    enabled: Boolean(productId) && isOpen,
  });

  const { types: productTypes } = useProductTypes({ includeInactive: true });

  const { data: catData } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const categories = catData?.data || catData?.categories || catData || [];

  const { data: originsData } = useQuery({ queryKey: ['origins'], queryFn: getOrigins });
  const origins = originsData?.data || [];

  const { data: eventsData } = useQuery({
    queryKey: ['admin', 'events'],
    queryFn: () => getAdminEvents(),
  });
  const events = eventsData?.data?.events || eventsData?.events || [];

  // Close picker when clicking outside
  useEffect(() => {
    if (openPickerIdx === null) return;
    const handler = () => setOpenPickerIdx(null);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openPickerIdx]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      reset({ variants: [], originId: '', eventId: '' });
      setImages([]);
      setHasVariants(false);
      setVariantImages([]);
      setActiveTab(0);
      setOpenPickerIdx(null);
    }
  }, [isOpen, reset]);

  // Populate on edit or duplicate
  useEffect(() => {
    if (!productData) return;
    const p = productData?.data || productData?.product || productData;
    const variants = p.variants || p.ProductVariant || [];
    const withVariants = variants.length > 0;

    reset({
      name: isDuplicate ? `Copy of ${p.name}` : p.name,
      type: p.type,
      categoryId: p.categoryId || p.category?.id,
      description: p.description,
      price: withVariants ? '' : p.price,
      fee: withVariants ? '' : (p.fee || 0),
      originalPrice: withVariants ? '' : (p.originalPrice || ''),
      stock: withVariants ? '' : p.stock,
      variants: variants.map((v) => ({
        // strip id so backend creates new variants
        name: v.name,
        price: v.price,
        fee: v.fee || 0,
        originalPrice: v.originalPrice || '',
        stock: v.stock ?? 0,
      })),
      condition: p.condition || 'New',
      status: isDuplicate ? 'DRAFT' : (p.status || 'ACTIVE'),
      originId: p.originId || '',
      eventId: isDuplicate ? '' : (p.eventProducts?.[0]?.eventId || ''),
      freeShipping: p.freeShipping ?? false,
    });

    setHasVariants(withVariants);
    setVariantImages(variants.map((v) => v.imageUrl || null));
    if (p.images?.length) setImages(p.images.map((img) => img.url || img));
  }, [productData, reset]);

  const handleToggleVariants = (checked) => {
    setHasVariants(checked);
    if (!checked) {
      setValue('variants', []);
      setVariantImages([]);
    } else {
      setValue('price', '');
      setValue('fee', '');
      setValue('originalPrice', '');
      setValue('stock', '');
    }
  };

  const handleAddVariant = () => {
    appendVariant({ name: '', price: '', fee: 0, originalPrice: '', stock: 0 });
    setVariantImages((prev) => [...prev, null]);
  };

  const handleRemoveVariant = (i) => {
    removeVariant(i);
    setVariantImages((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleVariantImageChange = (i, file) => {
    setVariantImages((prev) => {
      const next = [...prev];
      next[i] = file;
      return next;
    });
  };

  // Variant camera/gallery handlers
  const handleVariantCaptureFile = (e) => {
    const file = e.target.files?.[0];
    if (file && captureTargetIdx !== null) handleVariantImageChange(captureTargetIdx, file);
    e.target.value = '';
    setCaptureTargetIdx(null);
  };

  const openVariantCamera = (i) => {
    setCaptureTargetIdx(i);
    setOpenPickerIdx(null);
    variantCameraRef.current?.click();
  };

  const openVariantGallery = (i) => {
    setCaptureTargetIdx(i);
    setOpenPickerIdx(null);
    variantGalleryRef.current?.click();
  };

  const saveMutation = useMutation({
    mutationFn: (fd) => (isEdit ? updateProduct(productId, fd) : createProduct(fd)),
    onSuccess: async (result) => {
      // isEdit already false for duplicate, so createProduct is called automatically
      const savedProductId = result?.data?.id || result?.id;
      if (pendingEventIdRef.current && savedProductId) {
        try {
          await api.post(`/events/${pendingEventIdRef.current}/products`, {
            productIds: [savedProductId],
          });
        } catch { /* non-critical */ }
        pendingEventIdRef.current = null;
      }
      toast.success(isEdit ? 'Product updated!' : isDuplicate ? 'Product duplicated!' : 'Product created!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      onClose();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to save product'),
  });

  const onSubmit = (data) => {
    const fd = new FormData();
    fd.append('name', data.name);
    fd.append('type', data.type);
    fd.append('description', data.description || '');
    if (data.condition) fd.append('condition', data.condition);
    if (data.status) fd.append('status', data.status);
    if (data.categoryId) fd.append('categoryId', data.categoryId);
    if (data.originId) fd.append('originId', data.originId);

    if (!hasVariants) {
      const total = (parseFloat(data.price) || 0) + (parseFloat(data.fee) || 0);
      const original = parseFloat(data.originalPrice) || 0;
      if (original > 0 && total > original) {
        toast.error(`Total (${formatCurrency(total)}) exceeds Original Price (${formatCurrency(original)}). Reduce Price or Fee.`);
        return;
      }
      fd.append('price', data.price || 0);
      fd.append('fee', data.fee || 0);
      if (data.originalPrice) fd.append('originalPrice', data.originalPrice);
      fd.append('stock', data.stock ?? 0);
      fd.append('variants', JSON.stringify([]));
    } else {
      const variants = data.variants || [];
      if (variants.length === 0) { toast.error('Add at least one variant'); return; }

      const minPrice = Math.min(...variants.map((v) => parseFloat(v.price) || 0));
      fd.append('price', minPrice);
      fd.append('stock', 0);

      const variantsJson = variants.map((v, i) => ({
        ...v,
        fee: parseFloat(v.fee) || 0,
        imageUrl: variantImages[i] instanceof File ? null : (variantImages[i] || null),
      }));
      fd.append('variants', JSON.stringify(variantsJson));

      variantImages.forEach((img, i) => {
        if (img instanceof File) fd.append(`variantImage_${i}`, img);
      });
    }

    const existingMedia = images.filter((img) => typeof img === 'string');
    const newFiles = images.filter((img) => img instanceof File);
    fd.append('existingMedia', JSON.stringify(existingMedia));
    newFiles.forEach((file) => fd.append('images', file));

    pendingEventIdRef.current =
      data.type === 'JASTIP' && data.eventId ? data.eventId : null;

    saveMutation.mutate(fd);
  };

  const handleLensSearch = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    // Open tab immediately inside user-gesture context — avoids popup blocker
    const newTab = window.open('', '_blank');
    setLensLoading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/upload/temp', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = res.data?.data?.url;
      if (!url) throw new Error('No URL returned');
      newTab.location.href = `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(url)}`;
    } catch (err) {
      newTab?.close();
      console.error('Lens upload error:', err);
      toast.error('Gagal upload foto. Coba lagi.');
    } finally {
      setLensLoading(false);
    }
  };

  const onSubmitError = (errs) => {
    const basicFields = ['name', 'type', 'originId'];
    const pricingFields = ['price'];
    if (basicFields.some((f) => errs[f])) setActiveTab(0);
    else if (pricingFields.some((f) => errs[f])) setActiveTab(1);
  };

  const TABS = ['Basic Info', 'Pricing & Stock', 'Media', ...(watchedType === 'JASTIP' ? ['Event'] : [])];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Product' : isDuplicate ? 'Duplicate Product' : 'Add Product'} size="lg">
      {(isEdit || isDuplicate) && productLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit, onSubmitError)}>
          {/* Tab bar */}
          <div className="flex gap-1 border-b border-dark-200 -mx-6 px-6 mb-5 overflow-x-auto scrollbar-hide">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(i)}
                className={clsx(
                  'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all -mb-px',
                  activeTab === i
                    ? 'border-brand-800 text-brand-800'
                    : 'border-transparent text-dark-500 hover:text-dark-800'
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ── Tab 0: Basic Info ── */}
          {activeTab === 0 && (
            <div className="space-y-4">
              <Input
                label="Product Name"
                required
                placeholder="Enter product name"
                error={errors.name?.message}
                {...register('name', { required: 'Name is required' })}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none pl-3 pr-8 py-2 border border-dark-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white cursor-pointer"
                      {...register('type', { required: 'Type is required' })}
                    >
                      <option value="">Select type</option>
                      {productTypes.map((t) => (
                        <option key={t.id} value={t.slug}>{t.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
                  </div>
                  {errors.type && <p className="text-xs text-red-600 mt-1">{errors.type.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Category</label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none pl-3 pr-8 py-2 border border-dark-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white cursor-pointer"
                      {...register('categoryId')}
                    >
                      <option value="">No category</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">
                  Shipping Origin <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    className={clsx(
                      'w-full appearance-none pl-3 pr-8 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white cursor-pointer',
                      errors.originId ? 'border-red-400 focus:ring-red-400' : 'border-dark-300'
                    )}
                    {...register('originId', { required: 'Shipping origin is required' })}
                  >
                    <option value="">Select origin</option>
                    {origins.map((o) => <option key={o.id} value={o.id}>{o.label} — {o.city}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
                </div>
                {errors.originId && <p className="text-xs text-red-600 mt-1">{errors.originId.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Condition</label>
                <div className="relative">
                  <select
                    className="w-full appearance-none pl-3 pr-8 py-2 border border-dark-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white cursor-pointer"
                    {...register('condition')}
                  >
                    <option value="New">New</option>
                    <option value="Good">Good</option>
                    <option value="Well Used">Well Used</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Status</label>
                <div className="relative">
                  <select
                    className="w-full appearance-none pl-3 pr-8 py-2 border border-dark-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white cursor-pointer"
                    {...register('status')}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Description</label>
                <RichTextEditor
                  value={watch('description') || ''}
                  onChange={(html) => setValue('description', html)}
                />
              </div>
            </div>
          )}

          {/* ── Tab 1: Pricing & Stock (+ Variants) ── */}
          {activeTab === 1 && (
            <div className="space-y-5">
              {/* Has Variants toggle */}
              <div className="flex items-center justify-between pb-4 border-b border-dark-100">
                <div>
                  <p className="text-sm font-semibold text-dark-800">Has Variants</p>
                  <p className="text-xs text-dark-400 mt-0.5">
                    {hasVariants
                      ? 'Each variant has its own price, stock, and optional image.'
                      : 'Single price and stock for this product.'}
                  </p>
                </div>
                <div
                  role="switch"
                  aria-checked={hasVariants}
                  onClick={() => handleToggleVariants(!hasVariants)}
                  className={clsx(
                    'w-11 h-6 rounded-full transition-colors relative flex-shrink-0 cursor-pointer',
                    hasVariants ? 'bg-brand-800' : 'bg-dark-200'
                  )}
                >
                  <span className={clsx(
                    'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200',
                    hasVariants ? 'left-6' : 'left-1'
                  )} />
                </div>
              </div>

              {/* Free Shipping toggle */}
              <div className="flex items-center justify-between pb-4 border-b border-dark-100">
                <div>
                  <p className="text-sm font-semibold text-dark-800">Gratis Ongkir</p>
                  <p className="text-xs text-dark-400 mt-0.5">
                    {watch('freeShipping')
                      ? 'Ongkos kirim ditanggung penjual — pembeli tidak perlu bayar ongkir.'
                      : 'Pembeli menanggung biaya pengiriman.'}
                  </p>
                </div>
                <div
                  role="switch"
                  aria-checked={!!watch('freeShipping')}
                  onClick={() => setValue('freeShipping', !watch('freeShipping'))}
                  className={clsx(
                    'w-11 h-6 rounded-full transition-colors relative flex-shrink-0 cursor-pointer',
                    watch('freeShipping') ? 'bg-green-600' : 'bg-dark-200'
                  )}
                >
                  <span className={clsx(
                    'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200',
                    watch('freeShipping') ? 'left-6' : 'left-1'
                  )} />
                </div>
              </div>

              {!hasVariants ? (
                /* Simple pricing */
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      label="Base Price (IDR)"
                      type="number"
                      required
                      placeholder="350000"
                      error={errors.price?.message}
                      {...register('price', {
                        required: !hasVariants ? 'Price is required' : false,
                        min: { value: 0, message: 'Must be ≥ 0' },
                      })}
                    />
                    <Input
                      label="Service Fee (IDR)"
                      type="number"
                      placeholder="0"
                      {...register('fee', { min: 0 })}
                    />
                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-1">
                        Original Price
                        <span className="ml-1 text-xs font-normal text-dark-400">coret</span>
                      </label>
                      <input
                        type="number"
                        placeholder="500000"
                        min={0}
                        className="w-full px-3 py-2 border border-dark-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
                        {...register('originalPrice', { min: 0 })}
                      />
                    </div>
                  </div>
                  <PriceCalculator price={watchedPrice} fee={watchedFee} originalPrice={watchedOriginalPrice} />
                  <Input
                    label="Stock"
                    type="number"
                    placeholder="10"
                    {...register('stock', { min: 0 })}
                  />
                  <p className="text-xs text-dark-400">Stock = 0 → automatically labeled Sold Out.</p>
                </div>
              ) : (
                /* Variant pricing */
                <div className="space-y-3">
                  {/* Column headers */}
                  {variantFields.length > 0 && (
                    <div
                      className="grid gap-2 text-xs font-semibold text-dark-400 px-3"
                      style={{ gridTemplateColumns: '44px 1fr 90px 80px 90px 62px 32px' }}
                    >
                      <span>Foto</span>
                      <span>Variant name</span>
                      <span>Price (IDR)</span>
                      <span>Fee (IDR)</span>
                      <span>Original (IDR)</span>
                      <span>Stock</span>
                      <span />
                    </div>
                  )}

                  {/* Variant rows */}
                  {variantFields.map((field, i) => (
                    <VariantRow
                      key={field.id}
                      field={field}
                      i={i}
                      control={control}
                      register={register}
                      imgVal={variantImages[i]}
                      isPickerOpen={openPickerIdx === i}
                      onPickerToggle={(e) => {
                        e.stopPropagation();
                        setOpenPickerIdx((prev) => (prev === i ? null : i));
                      }}
                      onCameraClick={(e) => { e.stopPropagation(); openVariantCamera(i); }}
                      onGalleryClick={(e) => { e.stopPropagation(); openVariantGallery(i); }}
                      onImageRemove={() => handleVariantImageChange(i, null)}
                      onRemoveVariant={() => handleRemoveVariant(i)}
                    />
                  ))}

                  {variantFields.length === 0 && (
                    <div className="text-sm text-dark-400 py-6 text-center border-2 border-dashed border-dark-200 rounded-xl">
                      No variants yet — click "Add Variant" to start.
                    </div>
                  )}

                  <Button type="button" variant="secondary" size="sm" onClick={handleAddVariant}>
                    <Plus size={14} /> Add Variant
                  </Button>

                  {/* Shared hidden inputs for variant image capture */}
                  <input
                    ref={variantCameraRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleVariantCaptureFile}
                  />
                  <input
                    ref={variantGalleryRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleVariantCaptureFile}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Tab 2: Media ── */}
          {activeTab === 2 && (
            <div className="space-y-4">
              {/* Google Lens reverse image search */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Search size={13} className="text-blue-700 flex-shrink-0" />
                  <p className="text-xs font-semibold text-blue-800">Cari produk serupa di Google Lens</p>
                </div>
                <p className="text-xs text-blue-600">Foto barangnya → sistem upload otomatis → Google Lens carikan gambar produk serupa di tab baru.</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => lensInputRef.current?.click()}
                    disabled={lensLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors"
                  >
                    {lensLoading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                    {lensLoading ? 'Mengupload...' : 'Ambil / Pilih Foto'}
                  </button>
                </div>
                <input
                  ref={lensInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLensSearch}
                />
              </div>

              <MediaUpload files={images} onChange={setImages} />
            </div>
          )}

          {/* ── Tab 3: Event (JASTIP only) ── */}
          {activeTab === 3 && watchedType === 'JASTIP' && (
            <div>
              <p className="text-xs text-dark-400 mb-3">Assign this Jastip product to an event</p>
              <div className="relative">
                <select
                  className="w-full appearance-none pl-3 pr-8 py-2 border border-dark-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white cursor-pointer"
                  {...register('eventId')}
                >
                  <option value="">No event</option>
                  {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-dark-100">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isSubmitting || saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default AdminProductModal;
