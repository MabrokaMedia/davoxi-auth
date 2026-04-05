import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.js';

export interface ProtectedRouteProps {
  children: ReactNode;
  loginPath?: string;
  /** Optional loading fallback; defaults to null */
  loadingFallback?: ReactNode;
}

export function ProtectedRoute({ children, loginPath = '/login', loadingFallback = null }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) return <>{loadingFallback}</>;
  if (!user) return <Navigate to={loginPath} replace />;

  return <>{children}</>;
}
