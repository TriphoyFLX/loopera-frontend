import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import AuthPrompt from '../components/AuthPrompt';
import '../components/AuthPrompt.css';

export type AuthGateFeature = 'download' | 'buy' | 'upload' | 'profile' | 'chats' | 'like' | 'default';

interface SheetState {
  feature: AuthGateFeature;
  onSuccess?: () => void;
}

interface AuthGateContextValue {
  requireAuth: (action: () => void, feature?: AuthGateFeature) => boolean;
  openAuthPrompt: (feature?: AuthGateFeature) => void;
  closeAuthPrompt: () => void;
}

const AuthGateContext = createContext<AuthGateContextValue | undefined>(undefined);

export const saveAuthReturnTo = (path: string) => {
  sessionStorage.setItem('auth_return_to', path);
};

export const consumeAuthReturnTo = (fallback = '/') => {
  const value = sessionStorage.getItem('auth_return_to');
  sessionStorage.removeItem('auth_return_to');
  return value || fallback;
};

export const AuthGateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sheet, setSheet] = useState<SheetState | null>(null);

  const returnPath = `${location.pathname}${location.search}`;

  const closeAuthPrompt = useCallback(() => setSheet(null), []);

  const openAuthPrompt = useCallback((feature: AuthGateFeature = 'default') => {
    setSheet({ feature });
  }, []);

  const requireAuth = useCallback(
    (action: () => void, feature: AuthGateFeature = 'default') => {
      if (isAuthenticated) {
        action();
        return true;
      }
      setSheet({ feature, onSuccess: action });
      return false;
    },
    [isAuthenticated],
  );

  const handleLogin = useCallback(() => {
    saveAuthReturnTo(returnPath);
    setSheet(null);
    navigate(`/auth?returnTo=${encodeURIComponent(returnPath)}`);
  }, [navigate, returnPath]);

  const handleGuest = useCallback(() => {
    setSheet(null);
  }, []);

  const value = useMemo(
    () => ({ requireAuth, openAuthPrompt, closeAuthPrompt }),
    [requireAuth, openAuthPrompt, closeAuthPrompt],
  );

  return (
    <AuthGateContext.Provider value={value}>
      {children}
      {sheet && (
        <div className="auth-gate-overlay" onClick={closeAuthPrompt}>
          <div className="auth-gate-sheet-wrap" onClick={(e) => e.stopPropagation()}>
            <AuthPrompt
              feature={sheet.feature}
              variant="sheet"
              returnTo={returnPath}
              onLogin={handleLogin}
              onGuest={handleGuest}
            />
          </div>
        </div>
      )}
    </AuthGateContext.Provider>
  );
};

export const useAuthGate = () => {
  const context = useContext(AuthGateContext);
  if (!context) {
    throw new Error('useAuthGate must be used within AuthGateProvider');
  }
  return context;
};
