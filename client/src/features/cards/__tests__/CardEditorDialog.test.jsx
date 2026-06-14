import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render.jsx';
import { CardEditorDialog } from '../CardEditorDialog.jsx';

vi.mock('@/lib/api-client.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }
  };
});
import { api } from '@/lib/api-client.js';

describe('CardEditorDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a card with front and back', async () => {
    api.post.mockResolvedValueOnce({
      card: { id: '1', front: 'Q', back: 'A', order: 0 }
    });
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <CardEditorDialog
        open
        onOpenChange={onOpenChange}
        deckId="deck1"
        card={null}
      />
    );

    await user.type(screen.getByLabelText(/^front$/i), 'What is $2+2$?');
    await user.type(screen.getByLabelText(/^back$/i), '$4$');
    await user.click(screen.getByRole('button', { name: /add card/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/decks/deck1/cards', {
        front: 'What is $2+2$?',
        back: '$4$'
      });
    });
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('shows a live KaTeX preview of the front field', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <CardEditorDialog open onOpenChange={() => {}} deckId="d1" card={null} />
    );

    await user.type(screen.getByLabelText(/^front$/i), '$x^2$');

    // The preview area renders KaTeX output.
    await waitFor(() => {
      expect(document.querySelector('.katex')).toBeTruthy();
    });
  });

  it('prefills and PATCHes in edit mode', async () => {
    api.patch.mockResolvedValueOnce({
      card: { id: '1', front: 'Edited', back: 'B' }
    });
    const user = userEvent.setup();
    renderWithProviders(
      <CardEditorDialog
        open
        onOpenChange={() => {}}
        deckId="d1"
        card={{ id: '1', front: 'Original', back: 'B' }}
      />
    );

    const frontField = screen.getByLabelText(/^front$/i);
    expect(frontField).toHaveValue('Original');

    await user.clear(frontField);
    await user.type(frontField, 'Edited');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/api/cards/1', {
        front: 'Edited',
        back: 'B'
      });
    });
  });
});
