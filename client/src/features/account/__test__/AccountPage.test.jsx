import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render.jsx';
import AccountPage from '../AccountPage.jsx';

// Mock the auth context to provide a current user.
vi.mock('@/features/auth/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'ada@example.com', displayName: 'Ada' },
    isAuthenticated: true,
    isLoading: false
  })
}));

vi.mock('@/lib/api-client.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }
  };
});
import { api } from '@/lib/api-client.js';

describe('AccountPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the user details', () => {
    renderWithProviders(<AccountPage />);
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
  });

  it('opens the confirmation dialog from the danger zone', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AccountPage />);

    await user.click(screen.getByRole('button', { name: /^delete account$/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/delete your account\?/i)).toBeInTheDocument();
  });

  it('keeps the confirm button disabled until the email is typed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AccountPage />);

    await user.click(screen.getByRole('button', { name: /^delete account$/i }));

    const confirmBtn = await screen.findByRole('button', {
      name: /delete my account/i
    });
    expect(confirmBtn).toBeDisabled();

    // Wrong text -> still disabled.
    await user.type(screen.getByLabelText(/to confirm/i), 'wrong@example.com');
    expect(confirmBtn).toBeDisabled();

    // Correct email -> enabled.
    await user.clear(screen.getByLabelText(/to confirm/i));
    await user.type(screen.getByLabelText(/to confirm/i), 'ada@example.com');
    expect(confirmBtn).toBeEnabled();
  });

  it('calls DELETE /api/account on confirmation', async () => {
    api.delete.mockResolvedValueOnce(null);
    const user = userEvent.setup();
    renderWithProviders(<AccountPage />);

    await user.click(screen.getByRole('button', { name: /^delete account$/i }));
    await user.type(screen.getByLabelText(/to confirm/i), 'ada@example.com');
    await user.click(
      await screen.findByRole('button', { name: /delete my account/i })
    );

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/account');
    });
  });

  it('does not delete when cancelled', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AccountPage />);

    await user.click(screen.getByRole('button', { name: /^delete account$/i }));
    await user.click(await screen.findByRole('button', { name: /cancel/i }));

    expect(api.delete).not.toHaveBeenCalled();
  });

  it('is case-insensitive on the confirmation email', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AccountPage />);

    await user.click(screen.getByRole('button', { name: /^delete account$/i }));
    await user.type(screen.getByLabelText(/to confirm/i), 'ADA@Example.COM');

    expect(
      await screen.findByRole('button', { name: /delete my account/i })
    ).toBeEnabled();
  });
});
