import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
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
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    console.log('AuthProvider useEffect - savedToken:', savedToken, 'savedUser:', savedUser);

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        console.log('AuthProvider - setting user from localStorage:', parsedUser);
        setToken(savedToken);
        setUser(parsedUser);
      } catch (error) {
        console.error('AuthProvider - error parsing saved user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    console.log('useAuth login called with:', { newToken, newUser });
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    console.log('useAuth login completed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value: AuthContextType = useMemo(() => ({
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token,
    isLoading,
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
