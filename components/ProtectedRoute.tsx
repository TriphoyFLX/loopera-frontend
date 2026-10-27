import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n/useI18n';
import AuthPrompt from './AuthPrompt';
import type { AuthGateFeature } from '../hooks/useAuthGate';
import './AuthPrompt.css';

interface ProtectedRouteProps {
  children: ReactNode;
  feature?: AuthGateFeature;
}

const ProtectedRoute = ({ children, feature = 'default' }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useI18n();
  const location = useLocation();

  if (isLoading) {
    return <div className="auth-wall-loading">{t('loading.default')}</div>;
  }

  if (!isAuthenticated) {
    return (
      <AuthPrompt
        feature={feature}
        variant="page"
        returnTo={`${location.pathname}${location.search}`}
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
