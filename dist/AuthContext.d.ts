import { type ReactNode } from 'react';
import { type ApiClient } from './client.js';
export interface User {
    id: string;
    name: string;
    email: string;
    org_id: string;
    organization: string;
    role?: string;
    created_at?: string;
}
export interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}
export interface AuthContextValue {
    user: User | null;
    token: string | null;
    loading: boolean;
    idleWarning: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string, organization: string) => Promise<void>;
    googleLogin: (credential: string) => Promise<void>;
    logout: () => void;
    updateProfile: (data: Partial<User>) => void;
    dismissIdleWarning: () => void;
    /** The API client bound to the configured apiUrl */
    api: ApiClient;
}
export interface AuthProviderProps {
    children: ReactNode;
    apiUrl: string;
    onLogout?: () => void;
    idleTimeoutMs?: number;
}
export declare function AuthProvider({ children, apiUrl, onLogout, idleTimeoutMs }: AuthProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useAuth(): AuthContextValue;
//# sourceMappingURL=AuthContext.d.ts.map