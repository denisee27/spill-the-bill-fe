import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '../services/api.js';
import { formatCurrency } from '../utils/format';

function parseImages(images) {
  try {
    const parsed = typeof images === 'string' ? JSON.parse(images) : images;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function SearchSuggestions({ query, onSelect }) {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['search-suggestions', query],
    queryFn: async () => {
      const res = await api.get(`/products/search-suggestions?q=${encodeURIComponent(query)}`);
      return res.data.data;
    },
    enabled: query.length >= 2,
    staleTime: 30_000,
  });

  if (query.length < 2 || (!isLoading && (!data || data.length === 0))) return null;

  const handleSelect = (product) => {
    onSelect?.(product);
    navigate(`/products/${product.id}`);
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-dark-200 rounded-xl shadow-lg z-50 overflow-hidden">
      {isLoading ? (
        <div className="px-4 py-3 text-sm text-dark-400">Searching...</div>
      ) : (
        <ul>
          {data.map((product) => {
            const imgs = parseImages(product.images);
            return (
              <li key={product.id}>
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-dark-50 transition-colors text-left"
                  onClick={() => handleSelect(product)}
                >
                  {imgs[0] ? (
                    <img
                      src={imgs[0]}
                      alt={product.name}
                      className="w-9 h-9 rounded-lg object-contain bg-white border border-dark-100 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-dark-100 flex items-center justify-center flex-shrink-0">
                      <Search size={14} className="text-dark-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-900 truncate">{product.name}</p>
                    <p className="text-xs text-dark-400">{formatCurrency(product.price)}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default SearchSuggestions;
