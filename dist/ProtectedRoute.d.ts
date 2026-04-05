import type { ReactNode } from 'react';
export interface ProtectedRouteProps {
    children: ReactNode;
    loginPath?: string;
    /** Optional loading fallback; defaults to null */
    loadingFallback?: ReactNode;
}
export declare function ProtectedRoute({ children, loginPath, loadingFallback }: ProtectedRouteProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ProtectedRoute.d.ts.map