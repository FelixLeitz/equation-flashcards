import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '@/test/render.jsx';
import StudyMode from '../StudyMode.jsx';

vi.mock('@/lib/api-client.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }
  };
});
import { api } from '@/lib/api-client.js';

function renderStudy() {
  return renderWithProviders(
    <Routes>
      <Route path="/decks/:id/study" element={<StudyMode />} />
      <Route path="/decks/:id" element={<div>Deck Detail</div>} />
    </Routes>,
    { route: '/decks/deck1/study' }
  );
}

const threeCards = {
  deck: { id: 'deck1', title: 'Deck', description: '' },
  cards: [
    { id: 'c1', front: 'Q1', back: 'A1', order: 0 },
    { id: 'c2', front: 'Q2', back: 'A2', order: 1 },
    { id: 'c3', front: 'Q3', back: 'A3', order: 2 }
  ]
};

describe('StudyMode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the first card front and the position indicator', async () => {
    api.get.mockResolvedValueOnce(threeCards);
    renderStudy();

    expect(await screen.findByText('Q1')).toBeInTheDocument();
    expect(screen.getByText('Card 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('Question')).toBeInTheDocument();
  });

  it('flips to the back when the card is clicked', async () => {
    api.get.mockResolvedValueOnce(threeCards);
    const user = userEvent.setup();
    renderStudy();

    await screen.findByText('Q1');
    const cards = screen.getAllByRole('button', { name: /show answer/i });
    await user.click(cards[0]);

    expect(await screen.findByText('A1')).toBeInTheDocument();
    expect(screen.getByText('Answer')).toBeInTheDocument();
  });

  it('advances to the next card and resets to the front', async () => {
    api.get.mockResolvedValueOnce(threeCards);
    const user = userEvent.setup();
    renderStudy();

    await screen.findByText('Q1');
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    expect(await screen.findByText('Q2')).toBeInTheDocument();
    expect(screen.getByText('Card 2 of 3')).toBeInTheDocument();
    // Back to front face on the new card.
    expect(screen.getByText('Question')).toBeInTheDocument();
  });

  it('disables Previous on the first card', async () => {
    api.get.mockResolvedValueOnce(threeCards);
    renderStudy();

    await screen.findByText('Q1');
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
  });

  it('shows the complete view after the last card', async () => {
    api.get.mockResolvedValueOnce(threeCards);
    const user = userEvent.setup();
    renderStudy();

    await screen.findByText('Q1');
    await user.click(screen.getByRole('button', { name: /^next$/i })); // -> Q2
    await user.click(screen.getByRole('button', { name: /^next$/i })); // -> Q3
    await user.click(screen.getByRole('button', { name: /finish/i })); // -> done

    expect(await screen.findByText(/session complete/i)).toBeInTheDocument();
    expect(screen.getByText(/reviewed all 3 cards/i)).toBeInTheDocument();
  });

  it('restarts the session from the complete view', async () => {
    api.get.mockResolvedValueOnce(threeCards);
    const user = userEvent.setup();
    renderStudy();

    await screen.findByText('Q1');
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    await user.click(screen.getByRole('button', { name: /finish/i }));

    await screen.findByText(/session complete/i);
    await user.click(screen.getByRole('button', { name: /study again/i }));

    expect(await screen.findByText('Q1')).toBeInTheDocument();
    expect(screen.getByText('Card 1 of 3')).toBeInTheDocument();
  });

  it('flips with the spacebar', async () => {
    api.get.mockResolvedValueOnce(threeCards);
    const user = userEvent.setup();
    renderStudy();

    await screen.findByText('Q1');
    await user.keyboard(' ');

    expect(await screen.findByText('A1')).toBeInTheDocument();
  });

  it('navigates with arrow keys', async () => {
    api.get.mockResolvedValueOnce(threeCards);
    const user = userEvent.setup();
    renderStudy();

    await screen.findByText('Q1');
    await user.keyboard('{ArrowRight}');

    expect(await screen.findByText('Q2')).toBeInTheDocument();
  });

  it('shows a no-cards message for an empty deck', async () => {
    api.get.mockResolvedValueOnce({
      deck: { id: 'deck1', title: 'Empty', description: '' },
      cards: []
    });
    renderStudy();

    expect(await screen.findByText(/no cards yet/i)).toBeInTheDocument();
  });
});
