import { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { PriceCalculator } from './PriceCalculator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2, ImagePlus, X, Camera, Image } from 'lucide-react';
import {
  getProductAdmin,
  createProduct,
  updateProduct,
  getCategories,
  getOrigins,
} from '../../products/services/product.service';
import { getAdminEvents } from '../../events/services/event.service';
import api from '../../../shared/services/api';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import { MediaUpload } from '../../../shared/components/MediaUpload';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import { PRODUCT_TYPE } from '../../../shared/constants';
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
            <div className="absolute bottom-full mb-1 left-0 bg-white rounded-xl shadow-xl border border-dark-200 overflow-hidden z-30 w-40">
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
export function AdminProductModal({ isOpen, onClose, productId }) {
  const isEdit = Boolean(productId);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [images, setImages] = useState([]);
  const [hasVariants, setHasVariants] = useState(false);
  const [variantImages, setVariantImages] = useState([]);

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
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { variants: [], originId: '', eventId: '' },
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
    enabled: isEdit && isOpen,
  });

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

  // Populate on edit
  useEffect(() => {
    if (!productData) return;
    const p = productData?.data || productData?.product || productData;
    const variants = p.variants || p.ProductVariant || [];
    const withVariants = variants.length > 0;

    reset({
      name: p.name,
      type: p.type,
      categoryId: p.categoryId || p.category?.id,
      description: p.description,
      price: withVariants ? '' : p.price,
      fee: withVariants ? '' : (p.fee || 0),
      originalPrice: withVariants ? '' : (p.originalPrice || ''),
      stock: withVariants ? '' : p.stock,
      variants: variants.map((v) => ({
        id: v.id,
        name: v.name,
        price: v.price,
        fee: v.fee || 0,
        originalPrice: v.originalPrice || '',
        stock: v.stock ?? 0,
      })),
      originId: p.originId || '',
      eventId: p.eventProducts?.[0]?.eventId || '',
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
      const savedProductId = result?.data?.id || result?.id;
      if (pendingEventIdRef.current && savedProductId) {
        try {
          await api.post(`/events/${pendingEventIdRef.current}/products`, {
            productIds: [savedProductId],
          });
        } catch { /* non-critical */ }
        pendingEventIdRef.current = null;
      }
      toast.success(isEdit ? 'Product updated!' : 'Product created!');
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

  const TABS = ['Basic Info', 'Pricing & Stock', 'Media', ...(watchedType === 'JASTIP' ? ['Event'] : [])];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Product' : 'Add Product'} size="lg">
      {isEdit && productLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
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
                  <select
                    className="w-full px-3 py-2 border border-dark-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
                    {...register('type', { required: 'Type is required' })}
                  >
                    <option value="">Select type</option>
                    <option value={PRODUCT_TYPE.JASTIP}>Jastip</option>
                    <option value={PRODUCT_TYPE.PRELOVED}>Preloved</option>
                  </select>
                  {errors.type && <p className="text-xs text-red-600 mt-1">{errors.type.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Category</label>
                  <select
                    className="w-full px-3 py-2 border border-dark-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
                    {...register('categoryId')}
                  >
                    <option value="">No category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Shipping Origin</label>
                <select
                  className="w-full px-3 py-2 border border-dark-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
                  {...register('originId')}
                >
                  <option value="">No origin</option>
                  {origins.map((o) => <option key={o.id} value={o.id}>{o.label} — {o.city}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Description</label>
                <textarea
                  rows={4}
                  placeholder="Product description..."
                  className="w-full px-3 py-2 border border-dark-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 resize-none"
                  {...register('description')}
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
            <MediaUpload files={images} onChange={setImages} />
          )}

          {/* ── Tab 3: Event (JASTIP only) ── */}
          {activeTab === 3 && watchedType === 'JASTIP' && (
            <div>
              <p className="text-xs text-dark-400 mb-3">Assign this Jastip product to an event</p>
              <select
                className="w-full px-3 py-2 border border-dark-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
                {...register('eventId')}
              >
                <option value="">No event</option>
                {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
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
