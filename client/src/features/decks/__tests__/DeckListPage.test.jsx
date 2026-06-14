import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render.jsx';
import DeckListPage from '../DeckListPage.jsx';

vi.mock('@/lib/api-client.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn()
    }
  };
});
import { api } from '@/lib/api-client.js';

describe('DeckListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the empty state when there are no decks', async () => {
    api.get.mockResolvedValueOnce({ decks: [] });
    renderWithProviders(<DeckListPage />);

    expect(await screen.findByText(/no decks yet/i)).toBeInTheDocument();
  });

  it('renders a list of decks with card counts', async () => {
    api.get.mockResolvedValueOnce({
      decks: [
        {
          id: '1',
          title: 'Calculus',
          description: 'Derivatives',
          cardCount: 3
        },
        { id: '2', title: 'Algebra', description: '', cardCount: 1 }
      ]
    });
    renderWithProviders(<DeckListPage />);

    expect(await screen.findByText('Calculus')).toBeInTheDocument();
    expect(screen.getByText('Algebra')).toBeInTheDocument();
    expect(screen.getByText('3 cards')).toBeInTheDocument();
    expect(screen.getByText('1 card')).toBeInTheDocument();
  });

  it('opens the create dialog when "New deck" is clicked', async () => {
    api.get.mockResolvedValueOnce({ decks: [] });
    const user = userEvent.setup();
    renderWithProviders(<DeckListPage />);

    await screen.findByText(/no decks yet/i);
    await user.click(screen.getByRole('button', { name: /^new deck$/i }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/give your deck a title/i)).toBeInTheDocument();
  });

  it('deletes a deck after confirmation', async () => {
    api.get.mockResolvedValue({
      decks: [{ id: '1', title: 'ToDelete', description: '', cardCount: 0 }]
    });
    api.delete.mockResolvedValueOnce(null);
    const user = userEvent.setup();
    renderWithProviders(<DeckListPage />);

    await screen.findByText('ToDelete');

    // Open the deck's action menu and choose Delete.
    await user.click(screen.getByRole('button', { name: /deck actions/i }));
    await user.click(await screen.findByRole('menuitem', { name: /delete/i }));

    // Confirmation dialog appears (REQ-UI-007).
    const confirmButton = await screen.findByRole('button', {
      name: /delete deck/i
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/decks/1');
    });
  });

  it('does NOT delete when the confirmation is cancelled', async () => {
    api.get.mockResolvedValue({
      decks: [{ id: '1', title: 'Keep', description: '', cardCount: 0 }]
    });
    const user = userEvent.setup();
    renderWithProviders(<DeckListPage />);

    await screen.findByText('Keep');

    await user.click(screen.getByRole('button', { name: /deck actions/i }));
    await user.click(await screen.findByRole('menuitem', { name: /delete/i }));

    // Cancel instead of confirming.
    await user.click(await screen.findByRole('button', { name: /cancel/i }));

    expect(api.delete).not.toHaveBeenCalled();
  });

  it('shows an error state if decks fail to load', async () => {
    api.get.mockRejectedValueOnce(new Error('network'));
    renderWithProviders(<DeckListPage />);

    expect(
      await screen.findByText(/could not load your decks/i)
    ).toBeInTheDocument();
  });
});
