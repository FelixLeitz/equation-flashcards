import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { LoadingSpinner } from '@/components/LoadingSpinner.jsx';

/**
 * Protects routes that require authentication.
 * Redirects unauthenticated users to /login, preserving the intended path.
 */
export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

/**
 * For login/signup pages: redirect already-authenticated users to /decks.
 */
export function RedirectIfAuth() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }
  if (isAuthenticated) {
    return <Navigate to="/decks" replace />;
  }
  return <Outlet />;
}
