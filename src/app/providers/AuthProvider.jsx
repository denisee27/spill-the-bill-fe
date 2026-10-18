import { createContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../../features/auth/services/auth.service';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // When admin login returns requires2fa, store tempToken here
  const [pendingAdmin2fa, setPendingAdmin2fa] = useState(null);

  // On mount: validate session via cookie (no localStorage token needed)
  useEffect(() => {
    authService
      .getMe()
      .then((data) => {
        const userData = data?.data || data?.user || data;
        setUser(userData);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authService.login(credentials);
    const inner = data?.data ?? data;

    // Admin 2FA: backend returns requires2fa + tempToken, no cookie set yet
    if (inner?.requires2fa) {
      setPendingAdmin2fa(inner.tempToken);
      return { requires2fa: true };
    }

    const userData = inner?.user ?? inner;
    if (userData?.id) {
      setUser(userData);
    }
    return data;
  }, []);

  const confirm2fa = useCallback(async (code) => {
    if (!pendingAdmin2fa) throw new Error('No pending 2FA session');
    const data = await authService.verifyAdmin2fa(pendingAdmin2fa, code);
    const inner = data?.data ?? data;
    const userData = inner?.user ?? inner;
    if (userData?.id) {
      setUser(userData);
    }
    setPendingAdmin2fa(null);
    return data;
  }, [pendingAdmin2fa]);

  const register = useCallback(async (formData) => {
    const data = await authService.register(formData);
    const inner = data?.data ?? data;
    const userData = inner?.user ?? inner;
    if (userData?.id) {
      setUser(userData);
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    } finally {
      setUser(null);
      setPendingAdmin2fa(null);
    }
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'ADMIN',
    isLoading,
    pendingAdmin2fa: Boolean(pendingAdmin2fa),
    login,
    confirm2fa,
    register,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
