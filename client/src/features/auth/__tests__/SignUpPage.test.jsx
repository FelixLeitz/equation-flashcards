import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render.jsx';
import SignUpPage from '../SignUpPage.jsx';

// Mock the API client used by the auth hooks.
vi.mock('@/lib/api-client.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    api: { ...actual.api, post: vi.fn() }
  };
});
import { api } from '@/lib/api-client.js';

describe('SignUpPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows validation errors for empty fields on submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignUpPage />);

    await user.click(screen.getByRole('button', { name: /create account/i }));

    // Zod errors render inline (REQ-UI-009).
    expect(
      await screen.findAllByText(/required|invalid|at least/i)
    ).not.toHaveLength(0);
    expect(api.post).not.toHaveBeenCalled();
  });

  it('shows a validation error for a weak password', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SignUpPage />);

    await user.type(screen.getByLabelText(/display name/i), 'Ada');
    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/password/i), 'short');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/at least/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('submits valid data to the signup endpoint', async () => {
    api.post.mockResolvedValueOnce({
      user: { id: '1', email: 'ada@example.com', displayName: 'Ada' }
    });
    const user = userEvent.setup();
    renderWithProviders(<SignUpPage />);

    await user.type(screen.getByLabelText(/display name/i), 'Ada');
    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/password/i), 'correcthorse9');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/auth/signup', {
        displayName: 'Ada',
        email: 'ada@example.com',
        password: 'correcthorse9'
      });
    });
  });
});
