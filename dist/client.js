/**
 * Shared API client for auth operations.
 * Access token is kept in-memory only (not persisted to storage).
 * Only the refresh token is persisted in localStorage for page-reload recovery.
 */
export const STORAGE_REFRESH = 'voiceai_refresh_token';
// In-memory access token — cleared on tab close, not accessible from storage
let accessToken = null;
/** Get the current access token (in-memory only). */
export function getAccessToken() {
    return accessToken;
}
/** Set the access token (in-memory only). */
export function setAccessToken(token) {
    accessToken = token;
}
export class ApiError extends Error {
    status;
    body;
    constructor(status, message, body) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.body = body;
    }
}
let refreshPromise = null;
function createRefreshToken(baseUrl) {
    return async function refreshToken() {
        const rt = localStorage.getItem(STORAGE_REFRESH);
        if (!rt)
            throw new ApiError(401, 'No refresh token');
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
/** Read the Cloudflare Access JWT from the CF_Authorization cookie (if present). */
function getCfAccessToken() {
    try {
        const match = document.cookie
            .split('; ')
            .find((c) => c.startsWith('CF_Authorization='));
        return match ? match.split('=')[1] : null;
    }
    catch {
        return null;
    }
}
async function request(baseUrl, path, options = {}, retry = true) {
    const url = `${baseUrl}${path}`;
    const token = accessToken;
    const cfToken = getCfAccessToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(cfToken ? { 'Cf-Access-Jwt-Assertion': cfToken } : {}),
        ...options.headers,
    };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401 && retry && localStorage.getItem(STORAGE_REFRESH)) {
        const doRefresh = createRefreshToken(baseUrl);
        if (!refreshPromise)
            refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
        try {
            await refreshPromise;
            return request(baseUrl, path, options, false);
        }
        catch {
            window.dispatchEvent(new CustomEvent('auth:expired'));
            throw new ApiError(401, 'Session expired');
        }
    }
    if (!res.ok) {
        let body = {};
        let msg = res.statusText;
        try {
            body = await res.json();
            msg = body.message || body.error || msg;
        }
        catch { /* text body */ }
        throw new ApiError(res.status, msg);
    }
    if (res.status === 204)
        return undefined;
    return res.json();
}
export function createApi(baseUrl) {
    return {
        get: (path) => request(baseUrl, path),
        post: (path, body) => request(baseUrl, path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
        put: (path, body) => request(baseUrl, path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),
        patch: (path, body) => request(baseUrl, path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
        del: (path, body) => request(baseUrl, path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }),
    };
}
//# sourceMappingURL=client.js.map