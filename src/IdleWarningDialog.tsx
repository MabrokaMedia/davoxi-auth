import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  LinearProgress,
  Box,
} from '@mui/material';
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

  if (!idleWarning) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = (secondsLeft / COUNTDOWN_SECONDS) * 100;

  return (
    <Dialog open={idleWarning} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Session Expiring
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>
          Your session will expire due to inactivity.
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h4" sx={{ textAlign: 'center', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ borderRadius: 1, height: 6 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={logout} color="inherit" size="small">
          Log out now
        </Button>
        <Button
          onClick={dismissIdleWarning}
          variant="contained"
          autoFocus
        >
          Stay Logged In
        </Button>
      </DialogActions>
    </Dialog>
  );
}
