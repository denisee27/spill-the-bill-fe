import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import LoadingSpinner from '../../shared/components/LoadingSpinner';

/**
 * Route guard for authenticated users.
 */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}

/**
 * Redirects admin users away from user-facing pages to the admin dashboard.
 */
export function AdminRedirect({ children }) {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) return null;
  if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
  return children;
}

/**
 * Route guard for admin users.
 */
export function AdminRoute() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
