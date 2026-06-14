import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '@/test/render.jsx';
import DeckDetailPage from '../DeckDetailPage.jsx';

vi.mock('@/lib/api-client.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }
  };
});
import { api } from '@/lib/api-client.js';

function renderDetail(route = '/decks/deck1') {
  return renderWithProviders(
    <Routes>
      <Route path="/decks/:id" element={<DeckDetailPage />} />
    </Routes>,
    { route }
  );
}

describe('DeckDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the deck header and its cards', async () => {
    api.get.mockResolvedValueOnce({
      deck: { id: 'deck1', title: 'Calculus', description: 'Derivatives' },
      cards: [
        { id: 'c1', front: 'Derivative of $x^2$?', back: '$2x$', order: 0 }
      ]
    });
    renderDetail();

    expect(await screen.findByText('Calculus')).toBeInTheDocument();
    expect(screen.getByText('Derivatives')).toBeInTheDocument();
    expect(screen.getByText(/card 1 · front/i)).toBeInTheDocument();
  });

  it('shows the empty state when the deck has no cards', async () => {
    api.get.mockResolvedValueOnce({
      deck: { id: 'deck1', title: 'Empty', description: '' },
      cards: []
    });
    renderDetail();

    expect(await screen.findByText(/no cards yet/i)).toBeInTheDocument();
  });

  it('disables the Study button when there are no cards', async () => {
    api.get.mockResolvedValueOnce({
      deck: { id: 'deck1', title: 'Empty', description: '' },
      cards: []
    });
    renderDetail();

    const studyButton = await screen.findByRole('button', { name: /study/i });
    expect(studyButton).toBeDisabled();
  });

  it('opens the add-card dialog', async () => {
    api.get.mockResolvedValueOnce({
      deck: { id: 'deck1', title: 'Deck', description: '' },
      cards: []
    });
    const user = userEvent.setup();
    renderDetail();

    await screen.findByText(/no cards yet/i);
    await user.click(screen.getAllByRole('button', { name: /add a card/i })[0]);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/inline math/i)).toBeInTheDocument();
  });

  it('deletes a card after confirmation', async () => {
    api.get.mockResolvedValue({
      deck: { id: 'deck1', title: 'Deck', description: '' },
      cards: [{ id: 'c1', front: 'Q', back: 'A', order: 0 }]
    });
    api.delete.mockResolvedValueOnce(null);
    const user = userEvent.setup();
    renderDetail();

    await screen.findByText(/card 1 · front/i);

    await user.click(screen.getByRole('button', { name: /card actions/i }));
    await user.click(await screen.findByRole('menuitem', { name: /delete/i }));
    await user.click(
      await screen.findByRole('button', { name: /delete card/i })
    );

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/cards/c1');
    });
  });
});
