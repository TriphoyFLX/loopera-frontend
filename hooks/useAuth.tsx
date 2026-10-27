import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types/auth';
import { tokenStorage } from '../utils/tokenStorage';
import {
  AUTH_EXPIRED_EVENT,
  AUTH_REFRESHED_EVENT,
  ensureValidSession,
} from '../utils/http';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  updateUser: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    tokenStorage.removeToken();
    tokenStorage.removeUser();
  }, []);

  const login = useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    tokenStorage.setToken(newToken);
    tokenStorage.setUser(newUser);
  }, []);

  const updateUser = useCallback((nextUser: User) => {
    setUser(nextUser);
    tokenStorage.setUser(nextUser);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      const savedToken = tokenStorage.getToken();
      const savedUser = tokenStorage.getUser();

      if (!savedToken || !savedUser) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      setToken(savedToken);
      setUser(savedUser);

      const valid = await ensureValidSession();
      if (cancelled) return;

      if (!valid) {
        logout();
      } else {
        const refreshedToken = tokenStorage.getToken();
        const refreshedUser = tokenStorage.getUser();
        if (refreshedToken) setToken(refreshedToken);
        if (refreshedUser) setUser(refreshedUser);
      }

      setIsLoading(false);
    };

    initAuth();

    const handleRefreshed = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.token) setToken(detail.token);
      if (detail?.user) setUser(detail.user);
    };

    const handleExpired = () => logout();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && tokenStorage.getToken()) {
        void ensureValidSession();
      }
    };

    window.addEventListener(AUTH_REFRESHED_EVENT, handleRefreshed);
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_REFRESHED_EVENT, handleRefreshed);
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [logout]);

  const value: AuthContextType = useMemo(() => {
    const role = String(user?.role || '').toLowerCase();
    const isAdmin = role === 'admin';
    const isManager = role === 'manager';
    return {
      user,
      token,
      login,
      updateUser,
      logout,
      isAuthenticated: !!token,
      isLoading,
      isAdmin,
      isManager,
      isStaff: isAdmin || isManager,
    };
  }, [user, token, login, updateUser, logout, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
