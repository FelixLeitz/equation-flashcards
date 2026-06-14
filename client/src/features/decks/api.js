import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client.js';

const DECKS_KEY = ['decks'];
const deckKey = (id) => ['decks', id];

/** List the current user's decks (with cardCount). */
export function useDecks() {
  return useQuery({
    queryKey: DECKS_KEY,
    queryFn: async () => {
      const data = await api.get('/api/decks');
      return data.decks;
    }
  });
}

/** Fetch a single deck and its cards. */
export function useDeck(id) {
  return useQuery({
    queryKey: deckKey(id),
    queryFn: async () => {
      const data = await api.get(`/api/decks/${id}`);
      return data; // { deck, cards }
    },
    enabled: Boolean(id)
  });
}

export function useCreateDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input) => api.post('/api/decks', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: DECKS_KEY })
  });
}

export function useUpdateDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }) => api.patch(`/api/decks/${id}`, updates),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: DECKS_KEY });
      qc.invalidateQueries({ queryKey: deckKey(id) });
    }
  });
}

export function useDeleteDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/api/decks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: DECKS_KEY })
  });
}
