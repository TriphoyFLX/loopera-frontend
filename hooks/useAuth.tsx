import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types/auth';
import { tokenStorage } from '../utils/tokenStorage';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = tokenStorage.getToken();
    const savedUser = tokenStorage.getUser();

    console.log('AuthProvider useEffect - savedToken:', savedToken, 'savedUser:', savedUser);

    if (savedToken && savedUser) {
      try {
        console.log('AuthProvider - setting user from tokenStorage:', savedUser);
        setToken(savedToken);
        setUser(savedUser);
      } catch (error) {
        console.error('AuthProvider - error parsing saved user:', error);
        tokenStorage.removeToken();
        tokenStorage.removeUser();
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    console.log('useAuth login called with:', { newToken, newUser });
    setToken(newToken);
    setUser(newUser);
    tokenStorage.setToken(newToken);
    tokenStorage.setUser(newUser);
    console.log('useAuth login completed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    tokenStorage.removeToken();
    tokenStorage.removeUser();
  };

  const value: AuthContextType = useMemo(() => ({
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token,
    isLoading,
    isAdmin: user?.role === 'admin',
  }), [user, token, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
