// src/hooks/useSessionTimeout.ts
// Auto logout on inactivity
import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIMEOUT = 25 * 60 * 1000; // 25 minutes

export function useSessionTimeout() {
  const auth = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimeout = useCallback(() => {
    // Clear existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

    // Set warning timeout
    warningTimeoutRef.current = setTimeout(() => {
      console.warn('Session will expire soon due to inactivity');
      // You can show a warning toast here
    }, WARNING_TIMEOUT);

    // Set logout timeout
    timeoutRef.current = setTimeout(() => {
      console.log('Session expired due to inactivity');
      auth.signOut();
    }, INACTIVITY_TIMEOUT);
  }, [auth]);

  useEffect(() => {
    resetTimeout();

    // Set up event listeners for user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      resetTimeout();
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      // Cleanup
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [resetTimeout]);
}
