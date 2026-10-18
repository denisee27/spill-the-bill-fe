import { useState } from 'react';
import { X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import Button from './Button';
import { formatCurrency } from '../utils/format';

function CategoryMultiSelect({ categories, selected, onChange }) {
  const [search, setSearch] = useState('');
  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <input
        placeholder="Search categories..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-2.5 py-1.5 text-sm border border-dark-200 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-brand-700"
      />
      <div className="max-h-40 overflow-y-auto space-y-1">
        {filtered.map((c) => (
          <label key={c.id} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-dark-50 rounded px-1">
            <input
              type="checkbox"
              checked={selected.includes(c.id)}
              onChange={() => {
                const next = selected.includes(c.id)
                  ? selected.filter((id) => id !== c.id)
                  : [...selected, c.id];
                onChange(next);
              }}
              className="accent-brand-800"
            />
            <span className="text-sm text-dark-700">{c.name}</span>
          </label>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-dark-400 text-center py-2">No categories found</p>
        )}
      </div>
    </div>
  );
}

const SORT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name A–Z' },
];

const CONDITIONS = ['New', 'Good', 'Well Used'];

export function FilterPanel({
  isOpen,
  onClose,
  categories = [],
  selectedCategories = [],
  priceRange = [0, 10000000],
  maxPrice = 10000000,
  sortBy = '',
  inStock = false,
  condition = '',
  onApply,
  onReset,
}) {
  const [localCategories, setLocalCategories] = useState(selectedCategories);
  const [localPrice, setLocalPrice] = useState(priceRange);
  const [localSort, setLocalSort] = useState(sortBy);
  const [localInStock, setLocalInStock] = useState(inStock);
  const [localCondition, setLocalCondition] = useState(condition);

  const handleApply = () => {
    onApply({
      categories: localCategories,
      priceRange: localPrice,
      sortBy: localSort,
      inStock: localInStock,
      condition: localCondition,
    });
    onClose();
  };

  const handleReset = () => {
    setLocalCategories([]);
    setLocalPrice([0, maxPrice]);
    setLocalSort('');
    setLocalInStock(false);
    setLocalCondition('');
    onReset?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-sm bg-white h-full flex flex-col shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-brand-800" />
            <h2 className="font-bold text-dark-900">Filter & Sort</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-dark-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 p-5 space-y-6">
          {/* Sort */}
          <div>
            <h3 className="text-sm font-semibold text-dark-800 mb-3">Sort By</h3>
            <div className="relative">
              <select
                value={localSort}
                onChange={(e) => setLocalSort(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white cursor-pointer"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="text-sm font-semibold text-dark-800 mb-3">Price Range</h3>
            <div className="px-2">
              <Slider
                range
                min={0}
                max={maxPrice}
                step={50000}
                value={localPrice}
                onChange={setLocalPrice}
                styles={{
                  track: { backgroundColor: '#9b1c1c' },
                  handle: { borderColor: '#9b1c1c', backgroundColor: '#9b1c1c' },
                  rail: { backgroundColor: '#e5e7eb' },
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-dark-500 mt-2">
              <span>{formatCurrency(localPrice[0])}</span>
              <span>{formatCurrency(localPrice[1])}</span>
            </div>
          </div>

          {/* Condition */}
          <div>
            <h3 className="text-sm font-semibold text-dark-800 mb-3">Condition</h3>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setLocalCondition(localCondition === c ? '' : c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    localCondition === c
                      ? 'bg-brand-800 text-white border-brand-800'
                      : 'bg-white text-dark-600 border-dark-200 hover:border-brand-700'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* In Stock Only */}
          <div>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-semibold text-dark-800">In Stock Only</span>
              <button
                role="switch"
                aria-checked={localInStock}
                onClick={() => setLocalInStock((v) => !v)}
                className={`relative w-10 h-5 rounded-full transition-colors ${localInStock ? 'bg-brand-800' : 'bg-dark-200'}`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${localInStock ? 'translate-x-5' : 'translate-x-0.5'}`}
                />
              </button>
            </label>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-dark-800 mb-3">
                Category
                {localCategories.length > 0 && (
                  <span className="ml-2 text-xs bg-brand-100 text-brand-800 px-1.5 py-0.5 rounded-full">
                    {localCategories.length}
                  </span>
                )}
              </h3>
              <CategoryMultiSelect
                categories={categories}
                selected={localCategories}
                onChange={setLocalCategories}
              />
            </div>
          )}

          {/* Actions — right after last filter */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={handleReset}>
              Reset
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FilterPanel;
