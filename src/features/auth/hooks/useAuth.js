import { useContext } from 'react';
import { AuthContext } from '../../../app/providers/AuthProvider';

/**
 * Hook to access auth context: user, isAuthenticated, login, register, logout
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}

export default useAuth;
