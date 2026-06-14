import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client.js';

const deckKey = (id) => ['decks', id];

export function useCreateCard(deckId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input) => api.post(`/api/decks/${deckId}/cards`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: deckKey(deckId) });
      qc.invalidateQueries({ queryKey: ['decks'] }); // refresh list cardCount
    }
  });
}

export function useUpdateCard(deckId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }) => api.patch(`/api/cards/${id}`, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: deckKey(deckId) })
  });
}

export function useDeleteCard(deckId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/api/cards/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: deckKey(deckId) });
      qc.invalidateQueries({ queryKey: ['decks'] });
    }
  });
}
