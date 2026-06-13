import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api-client.js';

const ME_KEY = ['auth', 'me'];

/**
 * Fetch the current user. Returns null (not an error) when unauthenticated,
 * so the app can treat "logged out" as a normal state.
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        const data = await api.get('/api/auth/me');
        return data.user;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          return null; // not logged in
        }
        throw err;
      }
    },
    staleTime: 5 * 60_000 // user identity rarely changes within a session
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (credentials) => api.post('/api/auth/login', credentials),
    onSuccess: (data) => {
      qc.setQueryData(ME_KEY, data.user);
    }
  });
}

export function useSignup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input) => api.post('/api/auth/signup', input),
    onSuccess: (data) => {
      qc.setQueryData(ME_KEY, data.user);
    }
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/api/auth/logout'),
    onSuccess: () => {
      qc.setQueryData(ME_KEY, null);
      qc.clear(); // drop any cached decks/cards from the previous session
    }
  });
}
