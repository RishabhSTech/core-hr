import { useCallback, useEffect, useState } from 'react';
import { securityService } from '@/services/securityService';
import {
  escapeHTML,
  isSafeURL,
  validateNoInjection,
  checkPasswordBreach,
  isSuspiciousBehavior,
  maskSensitiveData,
} from '@/lib/securityUtils';

/**
 * Hook for input validation and sanitization
 */
export function useSecureInput() {
  const sanitize = useCallback((input: string): string => {
    return securityService.sanitizeInput(input);
  }, []);

  const validate = useCallback((input: string, type: 'email' | 'password' | 'url' | 'phone' = 'email') => {
    switch (type) {
      case 'email':
        return securityService.validateEmail(input);
      case 'password':
        return securityService.validatePassword(input);
      case 'url':
        return securityService.validateURL(input);
      case 'phone':
        return securityService.validatePhoneNumber(input);
      default:
        return { valid: true };
    }
  }, []);

  const escapeForDisplay = useCallback((text: string): string => {
    return escapeHTML(text);
  }, []);

  return { sanitize, validate, escapeForDisplay };
}

/**
 * Hook for login protection and rate limiting
 */
export function useLoginSecurity() {
  const [isLocked, setIsLocked] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);

  const trackLoginAttempt = useCallback((identifier: string, success: boolean) => {
    const result = securityService.trackLoginAttempt(identifier, success);

    if (!result.allowed) {
      setIsLocked(true);
      // Parse remaining time from reason
      const match = result.reason?.match(/(\d+)\s*seconds?/);
      if (match) {
        setLockoutTime(parseInt(match[1]));
      }
    } else if (success) {
      setIsLocked(false);
      setAttempts(0);
      setLockoutTime(0);
    } else {
      setAttempts(prev => prev + 1);
    }

    return result;
  }, []);

  return { trackLoginAttempt, isLocked, attempts, lockoutTime };
}

/**
 * Hook for CSRF protection
 */
export function useCSRFToken() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const newToken = securityService.generateCSRFToken();
    setToken(newToken);
  }, []);

  const verifyToken = useCallback((tokenToVerify: string) => {
    return securityService.verifyCSRFToken(tokenToVerify);
  }, []);

  return { token, verifyToken };
}

/**
 * Hook for password validation
 */
export function usePasswordSecurity(password: string = '') {
  const [strength, setStrength] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [breached, setBreached] = useState(false);

  useEffect(() => {
    if (!password) {
      setStrength(0);
      setErrors([]);
      return;
    }

    // Validate password
    const validation = securityService.validatePassword(password);
    setErrors(validation.errors);

    // Calculate strength score
    let score = 0;
    if (password.length >= 12) score += 20;
    if (password.length >= 16) score += 10;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[a-z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 25;

    setStrength(Math.min(score, 100));

    // Check breach status
    checkPasswordBreach(password).then(result => {
      setBreached(result.breached);
    });
  }, [password]);

  return {
    strength,
    errors,
    breached,
    isValid: errors.length === 0 && !breached,
    getStrengthLabel: () => {
      if (strength < 25) return 'Very Weak';
      if (strength < 50) return 'Weak';
      if (strength < 75) return 'Good';
      if (strength < 90) return 'Strong';
      return 'Very Strong';
    },
  };
}

/**
 * Hook for phishing detection
 */
export function usePhishingDetection() {
  const detectEmail = useCallback((email: string) => {
    const emailValidation = securityService.validateEmail(email);
    const domainValidation = securityService.verifyEmailDomain(email);
    return {
      valid: emailValidation.valid && domainValidation.valid,
      errors: [
        emailValidation.reason,
        domainValidation.reason,
      ].filter(Boolean),
    };
  }, []);

  const detectPhishing = useCallback((indicators: {
    email?: string;
    url?: string;
    fromName?: string;
    linkText?: string;
    requestedInfo?: string[];
  }) => {
    return securityService.detectPhishing(indicators);
  }, []);

  const validateURL = useCallback((url: string) => {
    return isSafeURL(url);
  }, []);

  return { detectEmail, detectPhishing, validateURL };
}

/**
 * Hook for suspicious behavior detection
 */
export function useBehaviorMonitoring() {
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('low');

  const checkBehavior = useCallback((indicators: {
    failedAttempts?: number;
    locationChange?: boolean;
    unusualTime?: boolean;
    bulkOperation?: boolean;
    sensitiveDataAccess?: boolean;
  }) => {
    const result = isSuspiciousBehavior(indicators);

    if (result.riskScore >= 75) {
      setRiskLevel('high');
    } else if (result.riskScore >= 50) {
      setRiskLevel('medium');
    } else {
      setRiskLevel('low');
    }

    return result;
  }, []);

  return { checkBehavior, riskLevel };
}

/**
 * Hook for security monitoring and reporting
 */
export function useSecurityMonitoring() {
  const [report, setReport] = useState<any>(null);

  const getReport = useCallback(() => {
    const newReport = securityService.getSecurityReport();
    setReport(newReport);
    return newReport;
  }, []);

  const getSuspiciousActivities = useCallback((limit: number = 50) => {
    return securityService.getSuspiciousActivities(limit);
  }, []);

  useEffect(() => {
    // Get initial report
    getReport();

    // Update every 30 seconds
    const interval = setInterval(getReport, 30000);

    return () => clearInterval(interval);
  }, [getReport]);

  return { report, getReport, getSuspiciousActivities };
}

/**
 * Hook for form security
 */
export function useSecureForm() {
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [csrfToken, setCSRFToken] = useState<string | null>(null);

  // Generate CSRF token on mount
  useEffect(() => {
    const token = securityService.generateCSRFToken();
    setCSRFToken(token);
  }, []);

  const handleInputChange = useCallback((name: string, value: string) => {
    // Sanitize input
    const sanitized = securityService.sanitizeInput(value);

    // Validate against injection
    if (!validateNoInjection(value)) {
      setErrors(prev => ({
        ...prev,
        [name]: 'Input contains suspicious characters',
      }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    setFormData(prev => ({
      ...prev,
      [name]: sanitized,
    }));
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    for (const [key, value] of Object.entries(formData)) {
      if (!validateNoInjection(String(value))) {
        newErrors[key] = 'Invalid input detected';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const getSecureFormData = useCallback(() => {
    return {
      ...formData,
      _csrf: csrfToken,
    };
  }, [formData, csrfToken]);

  return {
    formData,
    errors,
    csrfToken,
    handleInputChange,
    validateForm,
    getSecureFormData,
    setFormData,
  };
}

/**
 * Hook for session security
 */
export function useSessionSecurity(lastActivityTime: number) {
  const [isSessionValid, setIsSessionValid] = useState(true);

  useEffect(() => {
    const checkSession = () => {
      const validation = securityService.validateSessionTimeout(lastActivityTime);
      setIsSessionValid(validation.valid);
    };

    // Check immediately and then every minute
    checkSession();
    const interval = setInterval(checkSession, 60000);

    return () => clearInterval(interval);
  }, [lastActivityTime]);

  const resetSession = useCallback(() => {
    return securityService.generateSessionToken();
  }, []);

  return { isSessionValid, resetSession };
}

/**
 * Hook for data logging with masking
 */
export function useSecureLogging() {
  const logSecurely = useCallback((data: any, context: string) => {
    const masked = maskSensitiveData(data);
    console.log(`[${context}]`, masked);

    // In production, send to secure logging service
    // Example: await sendToSecureLogger(context, masked);
  }, []);

  return { logSecurely };
}
