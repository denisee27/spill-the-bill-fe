import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Search, Copy, ChevronUp, ChevronDown, ChevronsUpDown, SlidersHorizontal, X } from 'lucide-react';
import {
  getAdminProducts, deleteProduct, updateProductStock,
  bulkSoldOut, duplicateProduct, getCategories,
} from '../../products/services/product.service';
import { useProductTypes } from '../../../shared/hooks/useProductTypes';
import { ProductBadge } from '../../products/components/ProductBadge';
import Button from '../../../shared/components/Button';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import EmptyState from '../../../shared/components/EmptyState';
import { formatCurrency, imageUrl, formatDate } from '../../../shared/utils/format';
import { AdminProductModal } from '../components/AdminProductModal';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import clsx from 'clsx';

const SORT_OPTIONS = [
  { value: 'updated_desc', label: 'Updated: Newest' },
  { value: 'updated_asc',  label: 'Updated: Oldest' },
  { value: 'newest',       label: 'Created: Newest' },
  { value: 'oldest',       label: 'Created: Oldest' },
  { value: 'price_asc',   label: 'Price: Low → High' },
  { value: 'price_desc',  label: 'Price: High → Low' },
  { value: 'name_asc',    label: 'Name A–Z' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'DRAFT', label: 'Draft' },
];

const CONDITION_OPTIONS = [
  { value: '', label: 'All Conditions' },
  { value: 'New', label: 'New' },
  { value: 'Good', label: 'Good' },
  { value: 'Well Used', label: 'Well Used' },
];

function SortHeader({ label, field, sortBy, onSort }) {
  const isAsc = sortBy === `${field}_asc`;
  const isDesc = sortBy === `${field}_desc`;
  const active = isAsc || isDesc;
  return (
    <button
      type="button"
      onClick={() => onSort(isDesc ? `${field}_asc` : `${field}_desc`)}
      className={clsx(
        'flex items-center gap-1 font-semibold transition-colors',
        active ? 'text-brand-800' : 'text-dark-700 hover:text-dark-900'
      )}
    >
      {label}
      {isDesc ? <ChevronDown size={13} /> : isAsc ? <ChevronUp size={13} /> : <ChevronsUpDown size={13} className="opacity-40" />}
    </button>
  );
}

export function AdminProductsPage() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('updated_desc');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const [filterFeatured, setFilterFeatured] = useState('');
  const [filterSoldOut, setFilterSoldOut] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [editingStockId, setEditingStockId] = useState(null);
  const [editingStockValue, setEditingStockValue] = useState('');
  const [productModal, setProductModal] = useState({ open: false, productId: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queryClient = useQueryClient();

  const { types: productTypes } = useProductTypes({ includeInactive: true });
  const { data: catData } = useQuery({ queryKey: ['categories'], queryFn: getCategories, staleTime: 5 * 60_000 });
  const categories = Array.isArray(catData?.data) ? catData.data : (catData?.data?.categories ?? catData?.categories ?? []);

  const activeFilters = [filterType, filterStatus, filterCategory, filterCondition, filterFeatured, filterSoldOut].filter(Boolean).length;

  const queryParams = {
    search: search || undefined,
    sortBy,
    type: filterType || undefined,
    status: filterStatus || undefined,
    categoryId: filterCategory || undefined,
    condition: filterCondition || undefined,
    isFeatured: filterFeatured === 'true' ? true : undefined,
    isSoldOut: filterSoldOut === 'true' ? true : filterSoldOut === 'false' ? false : undefined,
    limit: 200,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'products', queryParams],
    queryFn: () => getAdminProducts(queryParams),
    staleTime: 15_000,
  });

  const products = data?.data?.products ?? data?.products ?? [];

  const resetFilters = () => {
    setFilterType('');
    setFilterStatus('');
    setFilterCategory('');
    setFilterCondition('');
    setFilterFeatured('');
    setFilterSoldOut('');
  };

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      toast.success('Product deleted');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to delete'),
  });

  const soldOutMutation = useMutation({
    mutationFn: ({ ids, soldOut }) => bulkSoldOut(ids, soldOut),
    onSuccess: () => {
      toast.success('Products updated');
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to update'),
  });

  const stockMutation = useMutation({
    mutationFn: ({ id, stock }) => updateProductStock(id, stock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed to update stock'),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id) => duplicateProduct(id),
    onSuccess: (res) => {
      const newId = res?.data?.id || res?.id;
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (newId) {
        setProductModal({ open: true, productId: newId });
      } else {
        toast.success('Product duplicated');
      }
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to duplicate'),
  });

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.size === products.length ? new Set() : new Set(products.map((p) => p.id)));
  };

  const saveStock = (id) => {
    const value = parseInt(editingStockValue, 10);
    if (!isNaN(value) && value >= 0) stockMutation.mutate({ id, stock: value });
    setEditingStockId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-dark-900">Products</h1>
          <p className="text-dark-500 text-sm mt-1">{products.length} products</p>
        </div>
        <Button variant="primary" onClick={() => setProductModal({ open: true, productId: null })}>
          <Plus size={16} /> Add Product
        </Button>
      </div>

      {/* Search + Sort + Filter bar */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="search"
            aria-label="Search products"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-dark-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border border-dark-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className={clsx(
            'flex items-center gap-2 px-3 py-2 border rounded-xl text-sm font-medium transition-colors',
            filtersOpen || activeFilters > 0
              ? 'bg-brand-800 text-white border-brand-800'
              : 'bg-white text-dark-700 border-dark-300 hover:border-brand-700'
          )}
        >
          <SlidersHorizontal size={14} />
          Filters
          {activeFilters > 0 && (
            <span className="bg-white/25 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
              {activeFilters}
            </span>
          )}
        </button>

        {activeFilters > 0 && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs text-dark-500 hover:text-dark-800 transition-colors"
          >
            <X size={12} /> Reset filters
          </button>
        )}
      </div>

      {/* Expandable filter panel */}
      {filtersOpen && (
        <div className="mb-4 p-4 bg-white border border-dark-200 rounded-2xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-semibold text-dark-600 mb-1">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-dark-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white"
              >
                <option value="">All Types</option>
                {productTypes.map((t) => (
                  <option key={t.id} value={t.slug}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark-600 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-dark-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark-600 mb-1">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-dark-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark-600 mb-1">Condition</label>
              <select
                value={filterCondition}
                onChange={(e) => setFilterCondition(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-dark-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white"
              >
                {CONDITION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark-600 mb-1">Featured</label>
              <select
                value={filterFeatured}
                onChange={(e) => setFilterFeatured(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-dark-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white"
              >
                <option value="">All</option>
                <option value="true">Featured</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark-600 mb-1">Stock</label>
              <select
                value={filterSoldOut}
                onChange={(e) => setFilterSoldOut(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-dark-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white"
              >
                <option value="">All</option>
                <option value="false">Available</option>
                <option value="true">Sold Out</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-dark-50 border border-dark-200 rounded-xl">
          <span className="text-sm font-medium text-dark-700">{selectedIds.size} selected</span>
          <Button size="sm" variant="danger" onClick={() => soldOutMutation.mutate({ ids: Array.from(selectedIds), soldOut: true })} disabled={soldOutMutation.isPending}>
            Mark as Sold Out
          </Button>
          <Button size="sm" variant="secondary" onClick={() => soldOutMutation.mutate({ ids: Array.from(selectedIds), soldOut: false })} disabled={soldOutMutation.isPending}>
            Mark as Available
          </Button>
          <button onClick={() => setSelectedIds(new Set())} className="text-sm text-dark-500 hover:text-dark-700 underline ml-auto">
            Clear selection
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : products.length === 0 ? (
        <EmptyState title="No products" description="Add your first product to get started." />
      ) : (
        <div className="bg-white rounded-2xl border border-dark-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dark-50 border-b border-dark-200">
                <tr>
                  <th scope="col" className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      aria-label="Select all products"
                      checked={products.length > 0 && selectedIds.size === products.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 accent-brand-800"
                    />
                  </th>
                  <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Product</th>
                  <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Type</th>
                  <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Category</th>
                  <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Price</th>
                  <th scope="col" className="text-left px-4 py-3 font-semibold text-dark-700">Stock / Status</th>
                  <th scope="col" className="text-left px-4 py-3">
                    <SortHeader label="Updated" field="updated" sortBy={sortBy} onSort={setSortBy} />
                  </th>
                  <th scope="col" className="text-right px-4 py-3 font-semibold text-dark-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {products.map((p, i) => {
                  const img = p.images?.[0]?.url || p.images?.[0];
                  const isSelected = selectedIds.has(p.id);
                  const soldOut = p.isSoldOut;
                  return (
                    <tr
                      key={p.id}
                      className={[
                        i % 2 === 0 ? 'bg-white' : 'bg-dark-50/50',
                        soldOut ? 'opacity-60 bg-red-50/30' : '',
                        isSelected ? 'ring-1 ring-inset ring-brand-300' : '',
                      ].join(' ')}
                    >
                      <td className="px-4 py-3">
                        <input type="checkbox" aria-label={`Select ${p.name}`} checked={isSelected} onChange={() => toggleSelect(p.id)} className="w-4 h-4 accent-brand-800" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-dark-200 flex-shrink-0">
                            {img && <img src={imageUrl(img)} alt={p.name} className="w-full h-full object-cover" />}
                          </div>
                          <span className="font-medium text-dark-900 line-clamp-1">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><ProductBadge type={p.type} /></td>
                      <td className="px-4 py-3 text-dark-600">{p.category?.name || '-'}</td>
                      <td className="px-4 py-3 font-medium text-dark-900">{formatCurrency(p.price)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {editingStockId === p.id ? (
                            <input
                              type="number"
                              value={editingStockValue}
                              autoFocus
                              className="w-20 px-2 py-1 border border-brand-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
                              onChange={(e) => setEditingStockValue(e.target.value)}
                              onBlur={() => saveStock(p.id)}
                              onKeyDown={(e) => { if (e.key === 'Enter') saveStock(p.id); if (e.key === 'Escape') setEditingStockId(null); }}
                            />
                          ) : (
                            <span className="text-dark-600 cursor-pointer hover:text-brand-800 hover:underline" onClick={() => { setEditingStockId(p.id); setEditingStockValue(p.stock?.toString() ?? '0'); }}>
                              {p.stock ?? '-'}
                            </span>
                          )}
                          {soldOut && <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">Sold Out</span>}
                          {p.status === 'DRAFT' && <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Draft</span>}
                          {p.status === 'INACTIVE' && <span className="text-xs font-bold text-dark-400 bg-dark-100 border border-dark-200 px-2 py-0.5 rounded-full">Inactive</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-dark-500 whitespace-nowrap">
                        {formatDate(p.updatedAt || p.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setProductModal({ open: true, productId: p.id })} aria-label={`Edit ${p.name}`} className="p-1.5 text-dark-500 hover:text-brand-800 hover:bg-brand-50 rounded-lg transition-colors inline-flex">
                            <Edit size={15} aria-hidden="true" />
                          </button>
                          <button onClick={() => duplicateMutation.mutate(p.id)} aria-label={`Duplicate ${p.name}`} disabled={duplicateMutation.isPending} className="p-1.5 text-dark-500 hover:text-brand-800 hover:bg-brand-50 rounded-lg transition-colors inline-flex disabled:opacity-40">
                            <Copy size={15} aria-hidden="true" />
                          </button>
                          <button onClick={() => setDeleteTarget(p)} aria-label={`Delete ${p.name}`} className="p-1.5 text-dark-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
        </div>
      )}

      <AdminProductModal
        isOpen={productModal.open}
        onClose={() => setProductModal({ open: false, productId: null })}
        productId={productModal.productId}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        variant="danger"
        title="Delete Product"
        message={`Delete product "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel={deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
      />
    </div>
  );
}

export default AdminProductsPage;
