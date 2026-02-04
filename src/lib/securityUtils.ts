/**
 * Security Utilities
 * Helper functions for common security operations
 */

/**
 * Encrypt sensitive data using browser crypto API
 */
export async function encryptData(data: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(data);
  const encodedKey = encoder.encode(key);

  try {
    // Use PBKDF2 to derive a key
    const derivedKey = await crypto.subtle.importKey(
      'raw',
      encodedKey,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const key256 = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('salt'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      derivedKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key256,
      encodedData
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);

    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 */
export async function decryptData(encryptedData: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const encodedKey = encoder.encode(key);

  try {
    // Convert from base64
    const binaryString = atob(encryptedData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const iv = bytes.slice(0, 12);
    const data = bytes.slice(12);

    // Derive key
    const derivedKey = await crypto.subtle.importKey(
      'raw',
      encodedKey,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const key256 = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('salt'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      derivedKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    // Decrypt
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key256,
      data
    );

    return new TextDecoder().decode(decryptedData);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Generate cryptographically secure random string
 */
export function generateSecureToken(length: number = 32): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  let token = '';
  for (let i = 0; i < length; i++) {
    token += charset[array[i] % charset.length];
  }

  return token;
}

/**
 * Check if URL is safe (prevent open redirects)
 */
export function isSafeURL(url: string, baseURL: string = window.location.origin): boolean {
  try {
    const urlObj = new URL(url, baseURL);

    // Must be same origin or explicitly whitelisted
    if (urlObj.origin !== baseURL) {
      return false;
    }

    // Check for dangerous protocols
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHTML(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'\/]/g, char => map[char]);
}

/**
 * Strip HTML tags (simpler version for display purposes)
 */
export function stripHTMLTags(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

/**
 * Validate input against allowed characters
 */
export function validateAlphanumeric(input: string, allowSpaces: boolean = false): boolean {
  const pattern = allowSpaces ? /^[a-zA-Z0-9\s]*$/ : /^[a-zA-Z0-9]*$/;
  return pattern.test(input);
}

/**
 * Validate against injection attacks
 */
export function validateNoInjection(input: string): boolean {
  // Check for SQL injection patterns
  const sqlPatterns = [
    /(\bor\b|\band\b)\s*=\s*/i,
    /;\s*(delete|drop|insert|update)/i,
    /\/\*|\*\//,
    /xp_|sp_/,
  ];

  // Check for script injection
  const scriptPatterns = [/<script/i, /javascript:/i, /on\w+\s*=/i];

  // Check for command injection
  const commandPatterns = [/[;&|`$()]/];

  const allPatterns = [...sqlPatterns, ...scriptPatterns, ...commandPatterns];

  return !allPatterns.some(pattern => pattern.test(input));
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid characters
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.{2,}/g, '.'); // Replace multiple dots with single dot
}

/**
 * Check if password was in a data breach (using Have I Been Pwned concept)
 * Note: In production, integrate with actual HIBP API
 */
export async function checkPasswordBreach(password: string): Promise<{ breached: boolean; count?: number }> {
  try {
    // This is a placeholder - in production use actual HIBP API
    const commonPasswords = [
      '123456',
      'password',
      '123456789',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'letmein',
      'welcome',
      '123123',
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      return { breached: true, count: 1000000 }; // Arbitrary high number
    }

    return { breached: false };
  } catch (error) {
    // On error, assume safe rather than block
    return { breached: false };
  }
}

/**
 * Generate secure password
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = uppercase + lowercase + numbers + symbols;

  let password = '';

  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Check for suspicious user behavior
 */
export function isSuspiciousBehavior(indicators: {
  failedAttempts?: number;
  locationChange?: boolean;
  unusualTime?: boolean;
  bulkOperation?: boolean;
  sensitiveDataAccess?: boolean;
}): { suspicious: boolean; riskScore: number } {
  let riskScore = 0;

  if (indicators.failedAttempts && indicators.failedAttempts > 3) {
    riskScore += 30;
  }

  if (indicators.locationChange) {
    riskScore += 25;
  }

  if (indicators.unusualTime) {
    riskScore += 15;
  }

  if (indicators.bulkOperation) {
    riskScore += 20;
  }

  if (indicators.sensitiveDataAccess) {
    riskScore += 35;
  }

  return {
    suspicious: riskScore >= 50,
    riskScore,
  };
}

/**
 * Validate JWT token format (basic check)
 */
export function isValidJWTFormat(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  try {
    // Decode without verification (just checking format)
    const decoded = atob(parts[1]);
    JSON.parse(decoded);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract claims from JWT (without verification)
 */
export function getJWTClaims(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const decoded = atob(parts[1]);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Check if JWT token is expired
 */
export function isJWTExpired(token: string): boolean {
  try {
    const claims = getJWTClaims(token);
    if (!claims || !claims.exp) return true;

    return Date.now() >= claims.exp * 1000;
  } catch {
    return true;
  }
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: any, fieldsToMask: string[] = []): any {
  const defaultFields = ['password', 'email', 'ssn', 'creditCard', 'token', 'apiKey'];
  const fieldsToCheck = [...defaultFields, ...fieldsToMask];

  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const masked = Array.isArray(data) ? [...data] : { ...data };

  for (const key in masked) {
    if (fieldsToCheck.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      if (typeof masked[key] === 'string') {
        masked[key] = '*'.repeat(8);
      }
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key], fieldsToMask);
    }
  }

  return masked;
}

/**
 * Generate content security policy header value
 */
export function generateCSPHeader(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Adjust for your needs
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

/**
 * Generate security headers object
 */
export function getSecurityHeaders(): { [key: string]: string } {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Content-Security-Policy': generateCSPHeader(),
  };
}
