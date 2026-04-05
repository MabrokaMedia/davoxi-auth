/**
 * Shared API client for auth operations.
 * Access token is kept in-memory only (not persisted to storage).
 * Only the refresh token is persisted in localStorage for page-reload recovery.
 */
export declare const STORAGE_REFRESH = "voiceai_refresh_token";
/** Get the current access token (in-memory only). */
export declare function getAccessToken(): string | null;
/** Set the access token (in-memory only). */
export declare function setAccessToken(token: string | null): void;
export declare class ApiError extends Error {
    status: number;
    body?: Record<string, unknown>;
    constructor(status: number, message: string, body?: Record<string, unknown>);
}
export declare function createApi(baseUrl: string): {
    get: <T>(path: string) => Promise<T>;
    post: <T>(path: string, body?: unknown) => Promise<T>;
    put: <T>(path: string, body?: unknown) => Promise<T>;
    patch: <T>(path: string, body?: unknown) => Promise<T>;
    del: <T>(path: string, body?: unknown) => Promise<T>;
};
export type ApiClient = ReturnType<typeof createApi>;
//# sourceMappingURL=client.d.ts.map