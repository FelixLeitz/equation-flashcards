import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Sentry } from '@/lib/sentry.js';
import { queryClient } from '@/lib/query-client.js';
import { AuthProvider } from '@/features/auth/AuthContext.jsx';
import { router } from '@/router.jsx';
import { ErrorFallback } from '@/components/ErrorFallback.jsx';

export default function App() {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster position="top-center" />
        </AuthProvider>
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  );
}
