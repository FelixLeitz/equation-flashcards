import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client.js';

/**
 * Delete the current user's account and all their data.
 * The server clears the auth cookie; we clear all client cache so the
 * app immediately treats the user as logged out.
 */
export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete('/api/account'),
    onSuccess: () => {
      qc.setQueryData(['auth', 'me'], null);
      qc.clear();
    }
  });
}
