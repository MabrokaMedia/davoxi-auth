import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.js';
export function ProtectedRoute({ children, loginPath = '/login', loadingFallback = null }) {
    const { user, loading } = useAuth();
    if (loading)
        return _jsx(_Fragment, { children: loadingFallback });
    if (!user)
        return _jsx(Navigate, { to: loginPath, replace: true });
    return _jsx(_Fragment, { children: children });
}
//# sourceMappingURL=ProtectedRoute.js.map