import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { getProducts, deleteProduct, updateProductStock, bulkSoldOut } from '../../products/services/product.service';
import { ProductBadge } from '../../products/components/ProductBadge';
import Button from '../../../shared/components/Button';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import EmptyState from '../../../shared/components/EmptyState';
import { formatCurrency, imageUrl } from '../../../shared/utils/format';
import { AdminProductModal } from '../components/AdminProductModal';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';

export function AdminProductsPage() {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [editingStockId, setEditingStockId] = useState(null);
  const [editingStockValue, setEditingStockValue] = useState('');
  const [productModal, setProductModal] = useState({ open: false, productId: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'products', search],
    queryFn: () => getProducts({ search }),
    staleTime: 15_000,
  });

  const products = data?.data?.products ?? data?.products ?? [];

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


  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)));
    }
  };

  const saveStock = (id) => {
    const value = parseInt(editingStockValue, 10);
    if (!isNaN(value) && value >= 0) {
      stockMutation.mutate({ id, stock: value });
    }
    setEditingStockId(null);
  };

  const cancelStock = () => {
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

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
        <input
          type="search"
          aria-label="Search products"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm pl-9 pr-4 py-2 border border-dark-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white"
        />
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-dark-50 border border-dark-200 rounded-xl">
          <span className="text-sm font-medium text-dark-700">{selectedIds.size} selected</span>
          <Button
            size="sm"
            variant="danger"
            onClick={() => soldOutMutation.mutate({ ids: Array.from(selectedIds), soldOut: true })}
            disabled={soldOutMutation.isPending}
          >
            Mark as Sold Out
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => soldOutMutation.mutate({ ids: Array.from(selectedIds), soldOut: false })}
            disabled={soldOutMutation.isPending}
          >
            Mark as Available
          </Button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-dark-500 hover:text-dark-700 underline ml-auto"
          >
            Clear selection
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
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
                        <input
                          type="checkbox"
                          aria-label={`Select ${p.name}`}
                          checked={isSelected}
                          onChange={() => toggleSelect(p.id)}
                          className="w-4 h-4 accent-brand-800"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-dark-200 flex-shrink-0">
                            {img && (
                              <img src={imageUrl(img)} alt={p.name} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <span className="font-medium text-dark-900 line-clamp-1">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <ProductBadge type={p.type} />
                      </td>
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
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveStock(p.id);
                                if (e.key === 'Escape') cancelStock();
                              }}
                            />
                          ) : (
                            <span
                              className="text-dark-600 cursor-pointer hover:text-brand-800 hover:underline"
                              onClick={() => {
                                setEditingStockId(p.id);
                                setEditingStockValue(p.stock?.toString() ?? '0');
                              }}
                            >
                              {p.stock ?? '-'}
                            </span>
                          )}
                          {soldOut && (
                            <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                              Sold Out
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setProductModal({ open: true, productId: p.id })}
                            aria-label={`Edit ${p.name}`}
                            className="p-1.5 text-dark-500 hover:text-brand-800 hover:bg-brand-50 rounded-lg transition-colors inline-flex"
                          >
                            <Edit size={15} aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(p)}
                            aria-label={`Delete ${p.name}`}
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
