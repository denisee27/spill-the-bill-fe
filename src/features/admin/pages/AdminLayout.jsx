import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Suspense } from 'react';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingCart,
  Ticket,
  Users,
  UserCheck,
  MessageSquare,
  CalendarDays,
  MapPin,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import clsx from 'clsx';
import { LogoutConfirmModal } from '../../../shared/components/LogoutConfirmModal';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [{ to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    label: 'Catalogue',
    items: [
      { to: '/admin/products',   icon: Package,    label: 'Products' },
      { to: '/admin/categories', icon: Tag,         label: 'Categories' },
      { to: '/admin/origins',    icon: MapPin,      label: 'Origins' },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { to: '/admin/orders',   icon: ShoppingCart, label: 'Orders' },
      { to: '/admin/vouchers', icon: Ticket,        label: 'Vouchers' },
      { to: '/admin/events',   icon: CalendarDays,  label: 'Events' },
    ],
  },
  {
    label: 'Users',
    items: [
      { to: '/admin/users',   icon: Users,     label: 'Users' },
      { to: '/admin/members', icon: UserCheck, label: 'Members' },
    ],
  },
  {
    label: 'Settings',
    items: [{ to: '/admin/whatsapp', icon: MessageSquare, label: 'WhatsApp' }],
  },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    navigate('/');
  };

  const Sidebar = ({ onClose, collapsed = false, onToggleCollapse }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={clsx('flex items-center border-b border-brand-700', collapsed ? 'justify-center px-3 py-4' : 'justify-between px-5 py-4')}>
        {collapsed ? (
          <img src="/logo.png" alt="Spill the Bill" className="w-7 h-7 object-contain" />
        ) : (
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Spill the Bill" className="w-7 h-7 object-contain" />
            <span className="font-bold text-white text-sm">Spill The Bill!</span>
          </div>
        )}
        {onClose && (
          <button onClick={onClose} aria-label="Close navigation menu" className="text-white/60 hover:text-white lg:hidden">
            <X size={20} aria-hidden="true" />
          </button>
        )}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="text-white/60 hover:text-white transition-colors hidden lg:block"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav aria-label="Admin navigation" className={clsx('flex-1 py-4 overflow-y-auto space-y-4', collapsed ? 'px-2' : 'px-3')}>
        {NAV_SECTIONS.map(({ label: sectionLabel, items }) => (
          <div key={sectionLabel}>
            {!collapsed && (
              <p className="px-3 mb-1 text-[10px] font-black tracking-widest text-white/40 uppercase">
                {sectionLabel}
              </p>
            )}
            <div className="space-y-0.5">
              {items.map(({ to, icon: Icon, label: itemLabel }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  title={collapsed ? itemLabel : undefined}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center transition-all border-l-4 rounded-xl text-sm',
                      collapsed ? 'justify-center py-2.5 px-0 border-transparent' : 'gap-3 px-3 py-2.5',
                      isActive
                        ? 'bg-white text-brand-900 font-bold shadow-sm border-brand-300'
                        : 'text-white/70 hover:bg-white/10 hover:text-white font-medium border-transparent'
                    )
                  }
                >
                  <Icon size={17} aria-hidden="true" />
                  {!collapsed && itemLabel}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={clsx('py-4 border-t border-brand-700', collapsed ? 'px-2' : 'px-3')}>
        {!collapsed && (
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-white/60">Logged in as</p>
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
          </div>
        )}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          title={collapsed ? 'Logout' : undefined}
          className={clsx(
            'flex items-center w-full rounded-xl text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all',
            collapsed ? 'justify-center py-2.5 px-0' : 'gap-2 px-3 py-2'
          )}
        >
          <LogOut size={17} />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
      <div className="flex h-screen bg-dark-100">
        {/* Desktop Sidebar */}
        <aside className={clsx('hidden lg:flex flex-col bg-brand-800 flex-shrink-0 transition-all duration-200', sidebarCollapsed ? 'w-16' : 'w-60')}>
          <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed((c) => !c)} />
        </aside>

        {/* Mobile Sidebar overlay */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 z-50 w-60 bg-brand-800 lg:hidden flex flex-col">
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </aside>
          </>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar (mobile) */}
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-3 focus:bg-brand-800 focus:text-white focus:rounded-lg focus:m-2">
            Skip to main content
          </a>
          <header className="lg:hidden bg-white border-b border-dark-200 px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={sidebarOpen}
              aria-controls="mobile-sidebar"
              className="p-1.5 rounded-lg text-dark-600 hover:bg-dark-100"
            >
              <Menu size={20} aria-hidden="true" />
            </button>
            <span className="font-bold text-dark-900">Admin Panel</span>
          </header>

          <main id="main-content" className="flex-1 overflow-y-auto p-6">
            <Suspense fallback={<div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </>
  );
}

export default AdminLayout;
