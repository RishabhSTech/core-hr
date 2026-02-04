// src/hooks/useRateLimit.ts
import { useState, useCallback, useRef } from 'react';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export function useRateLimit(config: RateLimitConfig) {
  const [remaining, setRemaining] = useState(config.maxRequests);
  const requestTimestamps = useRef<number[]>([]);

  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Remove old requests outside the window
    requestTimestamps.current = requestTimestamps.current.filter(
      timestamp => timestamp > windowStart
    );

    // Check if we can make a request
    if (requestTimestamps.current.length < config.maxRequests) {
      requestTimestamps.current.push(now);
      setRemaining(config.maxRequests - requestTimestamps.current.length);
      return true;
    }

    return false;
  }, [config.maxRequests, config.windowMs]);

  const reset = useCallback(() => {
    requestTimestamps.current = [];
    setRemaining(config.maxRequests);
  }, [config.maxRequests]);

  return { canMakeRequest: checkRateLimit, remaining, reset };
}

export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastRunTime = useRef(0);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRunTime.current >= delay) {
        callback(...args);
        lastRunTime.current = now;
      }
    },
    [callback, delay]
  );
}
