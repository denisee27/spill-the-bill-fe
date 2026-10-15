import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../features/auth/hooks/useAuth';
import { LoginModal } from '../features/auth/components/LoginModal';
import { useCart } from '../features/cart/hooks/useCart';
import { useProducts } from '../features/products/hooks/useProducts';
import { ProductGrid } from '../features/products/components/ProductGrid';
import { EventCard } from '../features/events/components/EventCard';
import { getEvents } from '../features/events/services/event.service';
import { getCategories } from '../features/products/services/product.service';
import { Navbar } from '../shared/components/Navbar';
import LoadingSpinner from '../shared/components/LoadingSpinner';
import EmptyState from '../shared/components/EmptyState';
import { useDebounce } from '../shared/hooks/useDebounce';
import { TAB_VALUES } from '../shared/constants';
import { useProductTypes } from '../shared/hooks/useProductTypes';
import { CalendarDays, SlidersHorizontal } from 'lucide-react';
import { Footer } from '../shared/components/Footer';
import { FilterPanel } from '../shared/components/FilterPanel';
import { SEO } from '../shared/components/SEO';
import clsx from 'clsx';

const MAX_PRICE = 10000000;

function parseCats(str) {
  if (!str) return [];
  return str.split(',').filter(Boolean);
}

export function HomePage() {
  const { types: productTypes } = useProductTypes();
  const TABS = [
    { value: TAB_VALUES.ALL, label: 'All Products' },
    ...productTypes.map((t) => ({ value: t.slug, label: t.name })),
  ];

  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [loginOpen, setLoginOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  // All filter/tab state lives in URL — persists across navigation
  const tab = searchParams.get('tab') || TAB_VALUES.ALL;
  const sortBy = searchParams.get('sort') || '';
  const selectedCategories = parseCats(searchParams.get('cats'));
  const minPrice = Number(searchParams.get('minP') || 0);
  const maxPrice = Number(searchParams.get('maxP') || MAX_PRICE);
  const priceRange = [minPrice, maxPrice];
  const inStock = searchParams.get('inStock') === 'true';
  const condition = searchParams.get('cond') || '';

  const debouncedSearch = useDebounce(search, 350);
  const isJastipTab = tab === TAB_VALUES.JASTIP;

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    minPrice > 0 ||
    maxPrice < MAX_PRICE ||
    !!sortBy ||
    inStock ||
    !!condition;

  const filters = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(tab !== TAB_VALUES.ALL ? { type: tab.toUpperCase() } : {}),
    ...(selectedCategories.length > 0 ? { categoryIds: selectedCategories.join(',') } : {}),
    ...(minPrice > 0 ? { minPrice } : {}),
    ...(maxPrice < MAX_PRICE ? { maxPrice } : {}),
    ...(sortBy ? { sortBy } : {}),
    ...(inStock ? { inStock: true } : {}),
    ...(condition ? { condition } : {}),
  };

  const {
    data: productsData,
    isLoading: productsLoading,
    isFetching: productsFetching,
    error: productsError,
  } = useProducts(filters, {
    enabled: !isJastipTab,
    placeholderData: (prev) => prev,
  });

  const {
    data: eventsData,
    isLoading: eventsLoading,
    error: eventsError,
  } = useQuery({
    queryKey: ['events', { status: 'ACTIVE' }],
    queryFn: () => getEvents({ status: 'ACTIVE' }),
    enabled: isJastipTab,
    placeholderData: (prev) => prev,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 5 * 60_000,
  });

  const products = productsData?.data?.products ?? productsData?.products ?? [];
  const events = Array.isArray(eventsData?.data) ? eventsData.data : (eventsData?.data?.events ?? eventsData?.events ?? []);
  const categories = Array.isArray(categoriesData?.data)
    ? categoriesData.data
    : (categoriesData?.data?.categories ?? categoriesData?.categories ?? []);

  const isLoading = isJastipTab ? eventsLoading : productsLoading;
  const isFetching = isJastipTab ? false : productsFetching;
  const error = isJastipTab ? eventsError : productsError;

  const { cartCount, addItem } = useCart({
    isAuthenticated,
    onRequireAuth: () => setLoginOpen(true),
  });

  // Merge updates into current params, dropping empty/default values
  const buildParams = (overrides) => {
    const next = { ...Object.fromEntries(searchParams.entries()), ...overrides };
    if (!next.tab || next.tab === TAB_VALUES.ALL) delete next.tab;
    if (!next.q) delete next.q;
    if (!next.sort) delete next.sort;
    if (!next.cats) delete next.cats;
    if (!next.minP || next.minP === '0') delete next.minP;
    if (!next.maxP || next.maxP === String(MAX_PRICE)) delete next.maxP;
    if (!next.inStock || next.inStock === 'false') delete next.inStock;
    if (!next.cond) delete next.cond;
    return next;
  };

  const handleTabChange = (newTab) => {
    // Reset all filters on tab switch, keep search for non-jastip
    const params = {};
    if (newTab !== TAB_VALUES.ALL) params.tab = newTab;
    if (search && newTab !== TAB_VALUES.JASTIP) params.q = search;
    setSearchParams(params);
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    setSearchParams(buildParams({ q: val }));
  };

  const handleFilterApply = ({ categories: cats, priceRange: pr, sortBy: sb, inStock: is, condition: cond }) => {
    setSearchParams(buildParams({
      cats: cats.length > 0 ? cats.join(',') : '',
      minP: pr[0] > 0 ? String(pr[0]) : '',
      maxP: pr[1] < MAX_PRICE ? String(pr[1]) : '',
      sort: sb || '',
      inStock: is ? 'true' : 'false',
      cond: cond || '',
    }));
  };

  const handleFilterReset = () => {
    setSearchParams(buildParams({ cats: '', minP: '', maxP: '', sort: '', inStock: 'false', cond: '' }));
  };

  const handleAddToCart = (product) => {
    if (!isAuthenticated) {
      setPendingProduct(product);
      setLoginOpen(true);
      return;
    }
    addItem({ productId: product.id, quantity: 1 });
  };

  const handleLoginSuccess = () => {
    setLoginOpen(false);
    if (pendingProduct) {
      addItem({ productId: pendingProduct.id, quantity: 1 });
      setPendingProduct(null);
    }
  };

  return (
    <div className="min-h-screen bg-dark-50 animate-fade-up">
      <SEO title="Shop" url="/home" />
      <Navbar
        user={user}
        cartCount={cartCount}
        onSearchChange={isJastipTab ? undefined : handleSearchChange}
        searchValue={isJastipTab ? '' : search}
        onLoginClick={() => setLoginOpen(true)}
        onLogout={logout}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
        {/* Hero strip */}
        <div className="mb-5 rounded-2xl overflow-hidden bg-brand-900 relative">
          <div className="px-6 py-8 sm:py-10 relative z-10">
            <p className="text-brand-300 text-xs font-semibold tracking-widest uppercase mb-2">
              Jastip &amp; Preloved — Jakarta
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight max-w-xs">
              Your personal shopper.
            </h1>
            <p className="text-brand-300 text-sm mt-2 max-w-xs leading-relaxed">
              Jakarta event finds &amp; quality preloved, handpicked for you.
            </p>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 pointer-events-none">
            <div className="absolute top-4 right-8 w-24 h-24 rounded-full border-2 border-white" />
            <div className="absolute bottom-4 right-20 w-16 h-16 rounded-full bg-white" />
            <div className="absolute top-1/2 right-4 w-8 h-8 rounded-full bg-brand-400" />
          </div>
        </div>

        {/* Sticky tab bar + filter bar */}
        <div className="sticky top-[57px] z-30 bg-dark-50/90 backdrop-blur-md -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2 pb-3 mb-4 space-y-2">
          <div role="tablist" className="flex gap-1 bg-white rounded-xl p-1 border border-dark-200 w-fit mx-auto sm:mx-0">
            {TABS.map(({ value, label }) => {
              const count = value === TAB_VALUES.JASTIP ? events.length : products.length;
              const showCount = tab === value && !isLoading && count > 0;
              return (
                <button
                  key={value}
                  onClick={() => handleTabChange(value)}
                  role="tab"
                  aria-selected={tab === value}
                  className={clsx(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 flex items-center gap-1.5',
                    tab === value
                      ? 'bg-brand-800 text-white shadow-sm'
                      : 'text-dark-500 hover:text-dark-900 hover:bg-dark-50'
                  )}
                >
                  {label}
                  {showCount && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none bg-white/20 text-white">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Filter bar — products tab only */}
          {!isJastipTab && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterOpen(true)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-medium transition-colors',
                  hasActiveFilters
                    ? 'bg-brand-800 text-white border-brand-800'
                    : 'bg-white text-dark-700 border-dark-200 hover:border-dark-400'
                )}
              >
                <SlidersHorizontal size={14} />
                Filter
                {hasActiveFilters && (
                  <span className="w-2 h-2 bg-white rounded-full" />
                )}
              </button>
              {hasActiveFilters && (
                <button
                  onClick={handleFilterReset}
                  className="text-xs text-dark-500 hover:text-dark-800 underline"
                >
                  Reset
                </button>
              )}
            </div>
          )}
        </div>

        <FilterPanel
          isOpen={filterOpen}
          onClose={() => setFilterOpen(false)}
          categories={categories}
          selectedCategories={selectedCategories}
          priceRange={priceRange}
          maxPrice={MAX_PRICE}
          sortBy={sortBy}
          inStock={inStock}
          condition={condition}
          onApply={handleFilterApply}
          onReset={handleFilterReset}
        />

        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {isJastipTab
              ? 'Failed to load events. Please check your connection.'
              : 'Failed to load products. Please check your connection.'}
          </div>
        )}

        {/* Jastip tab — event cards */}
        {isJastipTab ? (
          isLoading ? (
            <div className="flex justify-center py-24">
              <LoadingSpinner size="lg" />
            </div>
          ) : events.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No events yet"
              description="Check back soon for upcoming jastip events."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => navigate(`/events/${event.id}`)}
                />
              ))}
            </div>
          )
        ) : (
          <>
            {/* Results context — show even while refetching */}
            {!isLoading && products.length > 0 && (
              <p className="text-sm text-dark-500 mb-4">
                <strong className="text-dark-900">{products.length}</strong>{' '}
                product{products.length !== 1 ? 's' : ''}
                {debouncedSearch ? (
                  <> for &ldquo;<strong className="text-dark-900">{debouncedSearch}</strong>&rdquo;</>
                ) : null}
              </p>
            )}

            {/* Subtle fetching indicator — thin animated bar */}
            {isFetching && !isLoading && (
              <div className="h-0.5 w-full bg-dark-100 rounded-full mb-4 overflow-hidden">
                <div className="h-full bg-brand-700 rounded-full animate-slide-progress" style={{ width: '40%' }} />
              </div>
            )}

            {/* Product grid — fades slightly while refetching new results */}
            <div className={clsx('transition-opacity duration-300', isFetching && !isLoading && 'opacity-50')}>
              <ProductGrid
                products={products}
                isLoading={isLoading}
                onAddToCart={handleAddToCart}
              />
            </div>
          </>
        )}
      </div>

      <Footer />

      <LoginModal
        isOpen={loginOpen}
        onClose={() => {
          setLoginOpen(false);
          setPendingProduct(null);
        }}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default HomePage;
