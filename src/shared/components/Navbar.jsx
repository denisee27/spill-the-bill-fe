import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, User, LogOut, Package, ChevronDown, X } from 'lucide-react';
import clsx from 'clsx';
import { LogoutConfirmModal } from './LogoutConfirmModal';

export function Navbar({ user, cartCount = 0, onSearchChange, searchValue = '', onLoginClick, onLogout }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const navigate = useNavigate();
  const hasSearch = typeof onSearchChange === 'function';

  const handleLogout = () => {
    setUserMenuOpen(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout?.();
  };

  return (
    <>
      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      <nav className="sticky top-0 z-40 bg-white border-b border-dark-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Primary row ── */}
          <div className="flex items-center gap-3 h-14">

            {/* Logo */}
            <Link to="/home" className="flex items-center gap-2 flex-shrink-0">
              <img src="/logo.png" alt="Spill the Bill" className="w-7 h-7 object-contain" />
              <span className="font-bold text-dark-900 text-base hidden sm:block">
                Spill the <span className="text-brand-800">Bill</span>
              </span>
            </Link>

            {/* Desktop search — only when search is available */}
            {hasSearch && (
              <div className="hidden sm:flex flex-1 max-w-sm relative">
                <Search size={15} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
                <input
                  type="search"
                  aria-label="Search products"
                  placeholder="Search products..."
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-dark-50 rounded-full text-sm border border-dark-200 focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-transparent focus:bg-white transition-all [&::-webkit-search-cancel-button]:hidden"
                />
                {searchValue && (
                  <button
                    onClick={() => onSearchChange('')}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            )}

            {/* Spacer when no search on desktop */}
            <div className="flex-1" />

            {/* Actions */}
            <div className="flex items-center gap-1">

              {/* Mobile search toggle — only when search is available */}
              {hasSearch && (
                <button
                  onClick={() => setMobileSearchOpen((v) => !v)}
                  aria-label="Toggle search"
                  className="sm:hidden p-2 rounded-xl text-dark-500 hover:text-brand-800 hover:bg-dark-50 transition-colors"
                >
                  {mobileSearchOpen ? <X size={19} /> : <Search size={19} />}
                </button>
              )}

              {user ? (
                <>
                  {/* Cart */}
                  <button
                    onClick={() => navigate('/cart')}
                    aria-label={`Cart${cartCount > 0 ? `, ${cartCount} item${cartCount !== 1 ? 's' : ''}` : ''}`}
                    className="relative p-2 rounded-xl text-dark-600 hover:text-brand-800 hover:bg-brand-50 transition-colors"
                  >
                    <ShoppingCart size={20} aria-hidden="true" />
                    {cartCount > 0 && (
                      <span
                        aria-hidden="true"
                        className="absolute -top-0.5 -right-0.5 bg-brand-800 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none"
                      >
                        {cartCount > 9 ? '9+' : cartCount}
                      </span>
                    )}
                  </button>

                  {/* User menu */}
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen((v) => !v)}
                      aria-expanded={userMenuOpen}
                      aria-haspopup="menu"
                      className="flex items-center gap-1.5 pl-1 pr-2 py-1.5 rounded-xl text-dark-700 hover:bg-dark-100 transition-colors"
                    >
                      <div className="w-7 h-7 bg-brand-800 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold leading-none">
                          {user.name ? user.name[0].toUpperCase() : <User size={13} />}
                        </span>
                      </div>
                      <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">
                        {user.name || user.email}
                      </span>
                      {user.isMember && (
                        <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 bg-brand-100 text-brand-800 text-[10px] font-black rounded-full leading-none">
                          MEMBER
                        </span>
                      )}
                      <ChevronDown size={13} className={clsx('text-dark-400 transition-transform hidden sm:block', userMenuOpen && 'rotate-180')} />
                    </button>

                    {userMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                        <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-2xl shadow-lg border border-dark-200 z-20 overflow-hidden">
                          <div className="px-4 py-3 bg-dark-50 border-b border-dark-100">
                            <p className="text-sm font-semibold text-dark-900 truncate">{user.name}</p>
                            <p className="text-xs text-dark-400 truncate mt-0.5">{user.email}</p>
                          </div>
                          <div className="py-1">
                            <Link
                              to="/profile"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-dark-700 hover:bg-dark-50 transition-colors"
                            >
                              <User size={15} className="text-dark-400" />
                              My Profile
                            </Link>
                            <Link
                              to="/orders"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-dark-700 hover:bg-dark-50 transition-colors"
                            >
                              <Package size={15} className="text-dark-400" />
                              My Orders
                            </Link>
                            <div className="border-t border-dark-100 my-1" />
                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <LogOut size={15} />
                              Logout
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <button
                  onClick={onLoginClick}
                  className="px-4 py-2 bg-brand-800 text-white rounded-xl text-sm font-semibold hover:bg-brand-900 active:scale-95 transition-all"
                >
                  Login
                </button>
              )}
            </div>
          </div>

          {/* ── Mobile search row ── */}
          {hasSearch && mobileSearchOpen && (
            <div className="sm:hidden pb-3">
              <div className="relative">
                <Search size={15} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
                <input
                  type="search"
                  aria-label="Search products"
                  placeholder="Search products..."
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-9 py-2.5 bg-dark-50 rounded-full text-sm border border-dark-200 focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-white transition-all"
                />
                {searchValue && (
                  <button
                    onClick={() => onSearchChange('')}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}

export default Navbar;
