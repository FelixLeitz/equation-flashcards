import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext.jsx';
import { LoadingSpinner } from '@/components/LoadingSpinner.jsx';

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner fullScreen />;
  return <Navigate to={isAuthenticated ? '/decks' : '/login'} replace />;
}
