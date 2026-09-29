import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './providers/AuthProvider';
import { ProtectedRoute, AdminRoute, AdminRedirect } from './router/index';
import { ToastContainer } from '../shared/components/Toast';
import LoadingSpinner from '../shared/components/LoadingSpinner';

// Pages — lazy loaded for code splitting
const LandingPage = lazy(() => import('../pages/LandingPage'));
const HomePage = lazy(() => import('../pages/HomePage'));
const ProductDetailPage = lazy(() => import('../pages/ProductDetailPage'));
const EventDetailPage = lazy(() => import('../pages/EventDetailPage'));
const CartPage = lazy(() => import('../pages/CartPage'));
const CheckoutPage = lazy(() => import('../pages/CheckoutPage'));
const OrdersPage = lazy(() => import('../pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('../pages/OrderDetailPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));

// Admin — lazy loaded separately (never needed by regular users)
const AdminLayout = lazy(() => import('../features/admin/pages/AdminLayout').then((m) => ({ default: m.AdminLayout })));
const AdminDashboardPage = lazy(() => import('../features/admin/pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const AdminProductsPage = lazy(() => import('../features/admin/pages/AdminProductsPage').then((m) => ({ default: m.AdminProductsPage })));
const AdminCategoriesPage = lazy(() => import('../features/admin/pages/AdminCategoriesPage').then((m) => ({ default: m.AdminCategoriesPage })));
const AdminOrdersPage = lazy(() => import('../features/admin/pages/AdminOrdersPage').then((m) => ({ default: m.AdminOrdersPage })));
const AdminOrderDetailPage = lazy(() => import('../features/admin/pages/AdminOrderDetailPage').then((m) => ({ default: m.AdminOrderDetailPage })));
const AdminVouchersPage = lazy(() => import('../features/admin/pages/AdminVouchersPage').then((m) => ({ default: m.AdminVouchersPage })));
const AdminEventsPage = lazy(() => import('../features/admin/pages/AdminEventsPage').then((m) => ({ default: m.AdminEventsPage })));
const AdminMembersPage = lazy(() => import('../features/admin/pages/AdminMembersPage').then((m) => ({ default: m.AdminMembersPage })));
const AdminUsersPage = lazy(() => import('../features/admin/pages/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })));
const AdminUserDetailPage = lazy(() => import('../features/admin/pages/AdminUserDetailPage').then((m) => ({ default: m.AdminUserDetailPage })));
const AdminWhatsappPage = lazy(() => import('../features/admin/pages/AdminWhatsappPage').then((m) => ({ default: m.AdminWhatsappPage })));
const AdminOriginsPage = lazy(() => import('../features/admin/pages/AdminOriginsPage').then((m) => ({ default: m.AdminOriginsPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="min-h-screen bg-dark-50 flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ToastContainer />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/home" element={<AdminRedirect><HomePage /></AdminRedirect>} />
              <Route path="/products/:id" element={<AdminRedirect><ProductDetailPage /></AdminRedirect>} />
              <Route path="/events/:id" element={<AdminRedirect><EventDetailPage /></AdminRedirect>} />

              {/* Protected (auth required) */}
              <Route element={<ProtectedRoute />}>
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/orders/:id" element={<OrderDetailPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              {/* Admin (admin role required) */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboardPage />} />
                  <Route path="products" element={<AdminProductsPage />} />
                  <Route path="categories" element={<AdminCategoriesPage />} />
                  <Route path="orders" element={<AdminOrdersPage />} />
                  <Route path="orders/:id" element={<AdminOrderDetailPage />} />
                  <Route path="vouchers" element={<AdminVouchersPage />} />
                  <Route path="members" element={<AdminMembersPage />} />
                  <Route path="events" element={<AdminEventsPage />} />
                  <Route path="origins" element={<AdminOriginsPage />} />
                  <Route path="users" element={<AdminUsersPage />} />
                  <Route path="users/:id" element={<AdminUserDetailPage />} />
                  <Route path="whatsapp" element={<AdminWhatsappPage />} />
                </Route>
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
