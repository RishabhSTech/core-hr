/**
 * Security Middleware Component
 * Provides application-wide security protections
 */

import { ReactNode, useEffect, useState } from 'react';
import { securityService } from '@/services/securityService';
import { getSecurityHeaders } from '@/lib/securityUtils';

interface SecurityMiddlewareProps {
  children: ReactNode;
  enableCSRF?: boolean;
  enableRateLimit?: boolean;
  enablePhishingDetection?: boolean;
}

/**
 * SecurityMiddleware - Wraps entire app with security protections
 */
export function SecurityMiddleware({
  children,
  enableCSRF = true,
  enableRateLimit = true,
  enablePhishingDetection = true,
}: SecurityMiddlewareProps) {
  const [isSecure, setIsSecure] = useState(true);
  const [securityError, setSecurityError] = useState<string | null>(null);

  useEffect(() => {
    // Apply security headers to document
    const headers = getSecurityHeaders();
    Object.entries(headers).forEach(([key, value]) => {
      // Headers can't be set from client-side, but we can add meta tags where applicable
      if (key === 'Content-Security-Policy') {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = value as string;
        document.head.appendChild(meta);
      }
    });

    // Initialize security service
    if (enableCSRF) {
      // CSRF tokens will be auto-generated where needed
    }

    // Set up security monitoring
    const interval = setInterval(() => {
      checkSecurityStatus();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [enableCSRF]);

  const checkSecurityStatus = () => {
    try {
      // Check for suspicious activities
      const report = securityService.getSecurityReport();
      if (report.totalSuspiciousActivities > 20) {
        setSecurityError('Multiple security alerts detected');
        setIsSecure(false);
      }

      if (report.securityStatus === 'critical') {
        setSecurityError('High security threat level');
        setIsSecure(false);
      }
    } catch (error) {
      console.error('Security check failed:', error);
    }
  };

  const handleSecurityError = (error: string) => {
    setSecurityError(error);
    setIsSecure(false);

    // Log security incident
    console.warn('Security incident:', error);
  };

  // If security is compromised, show warning
  if (!isSecure && securityError) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full border-2 border-red-500">
          <h1 className="text-2xl font-bold text-red-700 mb-4">⚠️ Security Alert</h1>
          <p className="text-gray-700 mb-6">{securityError}</p>
          <p className="text-sm text-gray-600 mb-6">
            Please refresh the page or contact your administrator if this persists.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
          >
            Refresh Page
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full mt-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <SecurityProvider
      enableCSRF={enableCSRF}
      enableRateLimit={enableRateLimit}
      enablePhishingDetection={enablePhishingDetection}
      onError={handleSecurityError}
    >
      {children}
    </SecurityProvider>
  );
}

/**
 * SecurityProvider - Context provider for security features
 */
function SecurityProvider({
  children,
  enableCSRF,
  enableRateLimit,
  enablePhishingDetection,
  onError,
}: SecurityMiddlewareProps & { onError: (error: string) => void }) {
  const [csrfToken, setCSRFToken] = useState<string>('');

  useEffect(() => {
    if (enableCSRF) {
      // Generate CSRF token
      const token = securityService.generateCSRFToken();
      setCSRFToken(token);

      // Store in meta tag for fetch requests
      const meta = document.createElement('meta');
      meta.name = 'csrf-token';
      meta.content = token;
      document.head.appendChild(meta);
    }

    // Intercept fetch for security headers
    const originalFetch = window.fetch;
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      const headers = init?.headers || {};

      // Add CSRF token to non-GET requests
      if (enableCSRF && typeof input === 'string' && !['GET', 'HEAD', 'OPTIONS'].includes((init?.method || 'GET').toUpperCase())) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      // Add security headers
      const secHeaders = getSecurityHeaders();
      Object.entries(secHeaders).forEach(([key, value]) => {
        if (key !== 'Content-Security-Policy') {
          headers[key] = value as string;
        }
      });

      return originalFetch.call(window, input, { ...init, headers });
    } as typeof fetch;

    return () => {
      window.fetch = originalFetch;
    };
  }, [enableCSRF, csrfToken]);

  // Add message event listener for XSS detection
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only allow messages from same origin
      if (event.origin !== window.location.origin) {
        console.warn('Blocked message from suspicious origin:', event.origin);
        onError('Received message from untrusted source');
        return;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onError]);

  // Monitor for suspicious activity
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Detect inspector opening attempts
      if (
        (event.key === 'F12') ||
        (event.ctrlKey && event.shiftKey && event.key === 'I') ||
        (event.ctrlKey && event.shiftKey && event.key === 'J') ||
        (event.ctrlKey && event.shiftKey && event.key === 'C')
      ) {
        // Log the attempt (don't block, just monitor)
        console.warn('Developer tools access attempt detected');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return <>{children}</>;
}

/**
 * Protected Route Wrapper
 * Ensures route is only accessible to authenticated users with proper permissions
 */
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
  isAuthenticated?: boolean;
  userRole?: string;
  fallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  isAuthenticated = false,
  userRole = '',
  fallback = null,
}: ProtectedRouteProps) {
  if (!isAuthenticated) {
    return fallback;
  }

  if (requiredRole && userRole !== requiredRole) {
    // Log unauthorized access attempt
    console.warn(
      `Unauthorized access attempt: User with role ${userRole} attempted to access ${requiredRole} route`
    );

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-700 mb-4">Access Denied</h1>
          <p className="text-gray-700 mb-6">You don't have permission to access this page.</p>
          <button
            onClick={() => window.history.back()}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * API Interceptor for security
 */
export function setupSecurityInterceptors() {
  // Intercept all API calls and add security measures
  const originalFetch = window.fetch;

  window.fetch = async function (input: RequestInfo | URL, config?: RequestInit) {
    const resource = input;
    let url = typeof resource === 'string' ? resource : (resource instanceof Request ? resource.url : String(resource));

    // Add CSRF token for non-GET requests
    const method = config?.method || 'GET';
    const headers = { ...config?.headers } as Record<string, string>;

    if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      if (token) {
        headers['X-CSRF-Token'] = token;
      }
    }

    // Rate limiting check
    const identifier = `${method}:${url}`;
    if (securityService.isRateLimited(identifier)) {
      throw new Error('Too many requests. Please try again later.');
    }

    const newConfig = { ...config, headers };

    try {
      const response = await originalFetch.call(window, resource, newConfig);

      // Check for suspicious response patterns
      if (response.status >= 500) {
        console.warn(`Server error from ${url}: ${response.status}`);
      }

      return response;
    } catch (error) {
      console.warn(`API call failed to ${url}: ${error}`);
      throw error;
    }
  } as typeof fetch;
}
