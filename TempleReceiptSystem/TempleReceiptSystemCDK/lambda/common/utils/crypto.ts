/**
 * Cryptographic utilities for hashing and masking PII
 * Uses Node.js built-in crypto module
 */

import { createHash } from 'crypto';

/**
 * Hash a PAN card number using SHA256
 * Returns hash with prefix for identification
 *
 * @param pan - Normalized PAN (ABCDE1234F)
 * @returns Hash string with prefix (e.g., "h:sha256:abc123...")
 */
export function hashPAN(pan: string): string {
  const hash = createHash('sha256').update(pan).digest('hex');
  return `h:sha256:${hash}`;
}

/**
 * Mask PAN for display - show first 5 and last 1 character
 * Example: ABCDE1234F → ABCDE****F
 *
 * @param pan - Full PAN (10 characters)
 * @returns Masked PAN
 */
export function maskPAN(pan: string): string {
  if (pan.length !== 10) {
    throw new Error('Invalid PAN length');
  }
  return `${pan.substring(0, 5)}****${pan.substring(9)}`;
}

/**
 * Hash email address using SHA256
 * Email should be normalized (lowercase) before hashing
 *
 * @param email - Normalized email
 * @returns Hash string with prefix
 */
export function hashEmail(email: string): string {
  const hash = createHash('sha256').update(email).digest('hex');
  return `h:sha256:${hash}`;
}

/**
 * Mask email for display
 * Example: user@example.com → u***@example.com
 *
 * @param email - Full email
 * @returns Masked email
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;

  const maskedLocal = local.length > 1 ? `${local[0]}***` : local;
  return `${maskedLocal}@${domain}`;
}

/**
 * Mask phone number for display
 * Example: +919876543210 → +91987XXXXX10
 *
 * @param phone - E.164 phone number
 * @returns Masked phone
 */
export function maskPhone(phone: string): string {
  if (!phone.startsWith('+91') || phone.length !== 13) {
    return phone; // Return as-is if not Indian mobile
  }

  const countryCode = phone.substring(0, 3);  // +91
  const start = phone.substring(3, 6);        // First 3 digits
  const end = phone.substring(11);            // Last 2 digits

  return `${countryCode}${start}XXXXX${end}`;
}

/**
 * Generic hash function for identifiers
 * Used for creating stable IDs
 *
 * @param value - Value to hash
 * @param type - Type of identifier (for prefix)
 * @returns Hash string with prefix
 */
export function hashIdentifier(value: string, type: 'PAN' | 'EMAIL' | 'PHONE' | 'GENERIC'): string {
  const hash = createHash('sha256').update(value).digest('hex');
  return `h:sha256:${hash}`;
}

/**
 * Create a short hash for donor ID generation
 * Returns first 12 characters of SHA256 hash
 *
 * @param value - Input value to hash
 * @returns Short hash (12 chars)
 */
export function shortHash(value: string): string {
  const hash = createHash('sha256').update(value).digest('hex');
  return hash.substring(0, 12);
}

/**
 * Sanitize sensitive data from logs
 * Replaces PAN, email, phone patterns with masked versions
 *
 * @param data - Object or string to sanitize
 * @returns Sanitized data
 */
export function sanitizeForLogs(data: unknown): unknown {
  if (typeof data === 'string') {
    // Mask PAN patterns: ABCDE1234F
    let sanitized = data.replace(/\b[A-Z]{5}\d{4}[A-Z]\b/g, 'XXXXX****X');

    // Mask email patterns
    sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, 'x***@xxx.com');

    // Mask phone patterns: +91XXXXXXXXXX or 10 digit numbers
    sanitized = sanitized.replace(/\+91\d{10}/g, '+91XXXXXXXXXX');
    sanitized = sanitized.replace(/\b\d{10}\b/g, 'XXXXXXXXXX');

    return sanitized;
  }

  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) {
      return data.map(item => sanitizeForLogs(item));
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      // Mask specific fields
      if (key === 'pan' && typeof value === 'string') {
        sanitized[key] = value.length === 10 ? maskPAN(value) : 'XXXXX****X';
      } else if (key === 'email' && typeof value === 'string') {
        sanitized[key] = maskEmail(value);
      } else if ((key === 'mobile' || key === 'phone') && typeof value === 'string') {
        sanitized[key] = maskPhone(value);
      } else {
        sanitized[key] = sanitizeForLogs(value);
      }
    }
    return sanitized;
  }

  return data;
}
