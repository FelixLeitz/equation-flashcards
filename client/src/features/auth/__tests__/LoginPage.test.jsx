import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render.jsx';
import LoginPage from '../LoginPage.jsx';
import { ApiError } from '@/lib/api-client.js';

vi.mock('@/lib/api-client.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    api: { ...actual.api, post: vi.fn() }
  };
});
import { api } from '@/lib/api-client.js';

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits valid credentials to the login endpoint', async () => {
    api.post.mockResolvedValueOnce({
      user: { id: '1', email: 'ada@example.com', displayName: 'Ada' }
    });
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/password/i), 'correcthorse9');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'ada@example.com',
        password: 'correcthorse9'
      });
    });
  });

  it('shows a generic error on 401 (REQ-ACC-008)', async () => {
    api.post.mockRejectedValueOnce(
      new ApiError('Invalid email or password.', 401, 'UNAUTHENTICATED')
    );
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword1');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(
      await screen.findByText(/invalid email or password/i)
    ).toBeInTheDocument();
  });

  it('blocks submit and shows validation error for a malformed email', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.type(screen.getByLabelText(/password/i), 'whatever');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });
});
