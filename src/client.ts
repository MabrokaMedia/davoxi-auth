/**
 * Shared API client for auth operations.
 * Access token is kept in-memory only (not persisted to storage).
 * Only the refresh token is persisted in localStorage for page-reload recovery.
 */

export const STORAGE_REFRESH = 'voiceai_refresh_token';

// In-memory access token — cleared on tab close, not accessible from storage
let accessToken: string | null = null;

/** Get the current access token (in-memory only). */
export function getAccessToken(): string | null {
  return accessToken;
}

/** Set the access token (in-memory only). */
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export class ApiError extends Error {
  status: number;
  body?: Record<string, unknown>;
  constructor(status: number, message: string, body?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

let refreshPromise: Promise<void> | null = null;

function createRefreshToken(baseUrl: string) {
  return async function refreshToken(): Promise<void> {
    const rt = localStorage.getItem(STORAGE_REFRESH);
    if (!rt) throw new ApiError(401, 'No refresh token');

    const res = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: rt }),
    });

    if (!res.ok) {
      accessToken = null;
      localStorage.removeItem(STORAGE_REFRESH);
      throw new ApiError(401, 'Session expired');
    }

    const data = await res.json();
    accessToken = data.access_token;
    localStorage.setItem(STORAGE_REFRESH, data.refresh_token);
  };
}

async function request<T>(baseUrl: string, path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const url = `${baseUrl}${path}`;
  const token = accessToken;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 && retry && localStorage.getItem(STORAGE_REFRESH)) {
    const doRefresh = createRefreshToken(baseUrl);
    if (!refreshPromise) refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
    try {
      await refreshPromise;
      return request<T>(baseUrl, path, options, false);
    } catch {
      window.dispatchEvent(new CustomEvent('auth:expired'));
      throw new ApiError(401, 'Session expired');
    }
  }

  if (!res.ok) {
    let body: Record<string, unknown> = {};
    let msg = res.statusText;
    try {
      body = await res.json();
      msg = (body.message as string) || (body.error as string) || msg;
    } catch { /* text body */ }
    throw new ApiError(res.status, msg);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export function createApi(baseUrl: string) {
  return {
    get: <T>(path: string) => request<T>(baseUrl, path),
    post: <T>(path: string, body?: unknown) => request<T>(baseUrl, path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
    put: <T>(path: string, body?: unknown) => request<T>(baseUrl, path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),
    patch: <T>(path: string, body?: unknown) => request<T>(baseUrl, path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
    del: <T>(path: string, body?: unknown) => request<T>(baseUrl, path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }),
  };
}

export type ApiClient = ReturnType<typeof createApi>;
