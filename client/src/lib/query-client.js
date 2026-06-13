import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api-client.js';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry auth/permission/not-found errors — retrying won't help.
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 30_000, // 30s — decks/cards don't change every second
      refetchOnWindowFocus: false
    }
  }
});
