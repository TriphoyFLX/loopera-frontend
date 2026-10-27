import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { ReactNode } from 'react';

interface GuestRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

const GuestRoute = ({ children, redirectTo = '/' }: GuestRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default GuestRoute;
