// Empty in dev -> relative '/api/...' calls hit the Vite proxy.
// Set in production to the deployed backend URL.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Error thrown by apiFetch on non-2xx responses.
 * Carries the HTTP status and the backend's structured error payload.
 */
export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Make a JSON request to the API.
 * - Sends cookies (HttpOnly JWT) via credentials: 'include'.
 * - Parses JSON responses; returns null for 204 No Content.
 * - Throws ApiError on non-2xx, populated from the backend error shape.
 *
 * @param {string} path  e.g. '/api/decks'
 * @param {object} [options]  fetch options ({ method, body, headers })
 */
export async function apiFetch(path, options = {}) {
  const { body, headers, ...rest } = options;

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    ...rest
  });

  // 204 No Content — nothing to parse.
  if (res.status === 204) {
    return null;
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON response; leave data null.
  }

  if (!res.ok) {
    const err = data?.error ?? {};
    throw new ApiError(
      err.message || `Request failed (${res.status})`,
      res.status,
      err.code || 'UNKNOWN',
      err.details
    );
  }

  return data;
}

// Convenience helpers.
export const api = {
  get: (path, options) => apiFetch(path, { ...options, method: 'GET' }),
  post: (path, body, options) =>
    apiFetch(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) =>
    apiFetch(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => apiFetch(path, { ...options, method: 'DELETE' })
};
