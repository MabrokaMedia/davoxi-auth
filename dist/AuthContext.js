import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { createApi, STORAGE_REFRESH, setAccessToken } from './client.js';
const AuthContext = createContext(null);
const STORAGE_USER = 'voiceai_user';
const DEFAULT_IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE = 2 * 60 * 1000; // warn 2 minutes before logout
export function AuthProvider({ children, apiUrl, onLogout, idleTimeoutMs, impersonateToken }) {
    const IDLE_TIMEOUT = idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT;
    const apiRef = useRef(createApi(apiUrl));
    // Update api client if apiUrl changes
    useEffect(() => {
        apiRef.current = createApi(apiUrl);
    }, [apiUrl]);
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    // If an impersonate token is provided, skip the loading state entirely —
    // the admin panel supplies a valid short-lived access token directly.
    const [loading, setLoading] = useState(!impersonateToken);
    const [idleWarning, setIdleWarning] = useState(false);
    const logoutTimerRef = useRef(0);
    const warningTimerRef = useRef(0);
    const clearSession = useCallback(() => {
        localStorage.removeItem(STORAGE_USER);
        localStorage.removeItem(STORAGE_REFRESH);
        setAccessToken(null);
        setUser(null);
        setToken(null);
        setIdleWarning(false);
        onLogout?.();
    }, [onLogout]);
    // Seed in-memory access token for impersonation sessions
    useEffect(() => {
        if (impersonateToken) {
            setAccessToken(impersonateToken);
            setToken(impersonateToken);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    // Restore session on mount (skipped when impersonating)
    useEffect(() => {
        if (impersonateToken)
            return;
        const storedUser = localStorage.getItem(STORAGE_USER);
        const rt = localStorage.getItem(STORAGE_REFRESH);
        if (storedUser && rt) {
            apiRef.current.post('/auth/refresh', { refresh_token: rt })
                .then((res) => {
                setAccessToken(res.access_token);
                localStorage.setItem(STORAGE_REFRESH, res.refresh_token);
                try {
                    const parsed = JSON.parse(storedUser);
                    const safeUser = {
                        id: String(parsed.id ?? ''),
                        name: String(parsed.name ?? ''),
                        email: String(parsed.email ?? ''),
                        org_id: String(parsed.org_id ?? ''),
                        organization: String(parsed.organization ?? ''),
                        role: parsed.role != null ? String(parsed.role) : undefined,
                    };
                    if (!safeUser.id || !safeUser.org_id || !safeUser.email) {
                        clearSession();
                    }
                    else {
                        setUser(safeUser);
                    }
                }
                catch {
                    clearSession();
                }
                setToken(res.access_token);
            })
                .catch(() => {
                clearSession();
            })
                .finally(() => setLoading(false));
        }
        else {
            setLoading(false);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    // Detect bfcache restoration (browser back-button after logout)
    useEffect(() => {
        const handler = (event) => {
            if (event.persisted) {
                const rt = localStorage.getItem(STORAGE_REFRESH);
                if (!rt) {
                    setUser(null);
                    setToken(null);
                    setAccessToken(null);
                }
            }
        };
        window.addEventListener('pageshow', handler);
        return () => window.removeEventListener('pageshow', handler);
    }, []);
    // Listen for auth expiry events from API client
    useEffect(() => {
        const handler = () => clearSession();
        window.addEventListener('auth:expired', handler);
        return () => window.removeEventListener('auth:expired', handler);
    }, [clearSession]);
    // Multi-tab session sync
    useEffect(() => {
        const handler = (e) => {
            if (e.key === STORAGE_REFRESH && e.newValue === null) {
                setAccessToken(null);
                setUser(null);
                setToken(null);
                setIdleWarning(false);
            }
        };
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, []);
    const idleWarningRef = useRef(false);
    // Start idle timers (warning at IDLE_TIMEOUT - 2min, logout at IDLE_TIMEOUT)
    const startIdleTimers = useCallback(() => {
        clearTimeout(warningTimerRef.current);
        clearTimeout(logoutTimerRef.current);
        setIdleWarning(false);
        idleWarningRef.current = false;
        warningTimerRef.current = window.setTimeout(() => {
            setIdleWarning(true);
            idleWarningRef.current = true;
        }, IDLE_TIMEOUT - WARNING_BEFORE);
        logoutTimerRef.current = window.setTimeout(() => {
            clearSession();
        }, IDLE_TIMEOUT);
    }, [clearSession, IDLE_TIMEOUT]);
    // Idle session timeout with warning
    useEffect(() => {
        if (!user)
            return;
        startIdleTimers();
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        const handleActivity = () => {
            // When warning is showing, user must click "Stay Logged In" — ignore activity
            if (idleWarningRef.current)
                return;
            startIdleTimers();
        };
        events.forEach(e => window.addEventListener(e, handleActivity));
        return () => {
            clearTimeout(warningTimerRef.current);
            clearTimeout(logoutTimerRef.current);
            events.forEach(e => window.removeEventListener(e, handleActivity));
        };
    }, [user, startIdleTimers]);
    const dismissIdleWarning = useCallback(() => {
        startIdleTimers();
    }, [startIdleTimers]);
    const login = useCallback(async (email, password) => {
        const res = await apiRef.current.post('/auth/login', { email, password });
        setAccessToken(res.access_token);
        localStorage.setItem(STORAGE_REFRESH, res.refresh_token);
        localStorage.setItem(STORAGE_USER, JSON.stringify(res.user));
        setUser(res.user);
        setToken(res.access_token);
    }, []);
    const signup = useCallback(async (name, email, password, organization) => {
        const res = await apiRef.current.post('/auth/signup', {
            name,
            email,
            password,
            org_name: organization,
        });
        setAccessToken(res.access_token);
        localStorage.setItem(STORAGE_REFRESH, res.refresh_token);
        localStorage.setItem(STORAGE_USER, JSON.stringify(res.user));
        setUser(res.user);
        setToken(res.access_token);
    }, []);
    const googleLogin = useCallback(async (accessToken) => {
        const res = await apiRef.current.post('/auth/google', { access_token: accessToken });
        setAccessToken(res.access_token);
        localStorage.setItem(STORAGE_REFRESH, res.refresh_token);
        localStorage.setItem(STORAGE_USER, JSON.stringify(res.user));
        setUser(res.user);
        setToken(res.access_token);
    }, []);
    const logout = useCallback(async () => {
        const rt = localStorage.getItem(STORAGE_REFRESH);
        try {
            if (rt)
                await apiRef.current.post('/auth/logout', { refresh_token: rt });
        }
        catch { /* ignore */ }
        clearSession();
    }, [clearSession]);
    const updateProfile = useCallback((data) => {
        setUser(prev => {
            if (!prev)
                return prev;
            const updated = { ...prev, ...data };
            localStorage.setItem(STORAGE_USER, JSON.stringify(updated));
            return updated;
        });
    }, []);
    return (_jsx(AuthContext.Provider, { value: { user, token, loading, idleWarning, login, signup, googleLogin, logout, updateProfile, dismissIdleWarning, api: apiRef.current }, children: children }));
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
//# sourceMappingURL=AuthContext.js.map