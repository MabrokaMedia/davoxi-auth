import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, LinearProgress, Box, } from '@mui/material';
import { useAuth } from './AuthContext.js';
const COUNTDOWN_SECONDS = 120; // 2 minutes
export function IdleWarningDialog() {
    const { idleWarning, dismissIdleWarning, logout } = useAuth();
    const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
    useEffect(() => {
        if (!idleWarning) {
            setSecondsLeft(COUNTDOWN_SECONDS);
            return;
        }
        setSecondsLeft(COUNTDOWN_SECONDS);
        const interval = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [idleWarning]);
    if (!idleWarning)
        return null;
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    const progress = (secondsLeft / COUNTDOWN_SECONDS) * 100;
    return (_jsxs(Dialog, { open: idleWarning, maxWidth: "xs", fullWidth: true, children: [_jsx(DialogTitle, { sx: { fontWeight: 700 }, children: "Session Expiring" }), _jsxs(DialogContent, { children: [_jsx(Typography, { sx: { mb: 2 }, children: "Your session will expire due to inactivity." }), _jsx(Box, { sx: { mb: 2 }, children: _jsxs(Typography, { variant: "h4", sx: { textAlign: 'center', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }, children: [minutes, ":", seconds.toString().padStart(2, '0')] }) }), _jsx(LinearProgress, { variant: "determinate", value: progress, sx: { borderRadius: 1, height: 6 } })] }), _jsxs(DialogActions, { sx: { px: 3, pb: 2.5 }, children: [_jsx(Button, { onClick: logout, color: "inherit", size: "small", children: "Log out now" }), _jsx(Button, { onClick: dismissIdleWarning, variant: "contained", autoFocus: true, children: "Stay Logged In" })] })] }));
}
//# sourceMappingURL=IdleWarningDialog.js.map