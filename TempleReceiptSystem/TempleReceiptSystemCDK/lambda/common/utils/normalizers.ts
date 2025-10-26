/**
 * Normalization utilities for donor data
 * Ensures consistent format for phone, email, PAN, etc.
 */

/**
 * Normalize phone number to E.164 format
 * Handles Indian phone numbers (+91)
 *
 * Examples:
 * - "9876543210" → "+919876543210"
 * - "+91 98765 43210" → "+919876543210"
 * - "091-9876543210" → "+919876543210"
 *
 * @param phone - Phone number in any format
 * @returns E.164 formatted phone or null if invalid
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Handle different formats
  let normalized: string;

  if (digits.length === 10) {
    // 10 digits: assume Indian mobile (add +91)
    normalized = `+91${digits}`;
  } else if (digits.length === 12 && digits.startsWith('91')) {
    // 12 digits starting with 91: add +
    normalized = `+${digits}`;
  } else if (digits.length === 11 && digits.startsWith('0')) {
    // 11 digits starting with 0: replace 0 with +91
    normalized = `+91${digits.slice(1)}`;
  } else if (digits.length === 13 && digits.startsWith('091')) {
    // 13 digits starting with 091: replace 091 with +91
    normalized = `+91${digits.slice(3)}`;
  } else {
    // Invalid format
    return null;
  }

  // Validate: must be +91 followed by 10 digits
  if (/^\+91\d{10}$/.test(normalized)) {
    return normalized;
  }

  return null;
}

/**
 * Normalize email to lowercase and trimmed
 *
 * @param email - Email address
 * @returns Normalized email or null if invalid
 */
export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;

  const normalized = email.trim().toLowerCase();

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(normalized)) {
    return normalized;
  }

  return null;
}

/**
 * Normalize PAN to uppercase and trimmed
 * PAN format: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)
 *
 * @param pan - PAN card number
 * @returns Normalized PAN or null if invalid
 */
export function normalizePAN(pan: string | null | undefined): string | null {
  if (!pan) return null;

  const normalized = pan.trim().toUpperCase();

  // Validate PAN format: ABCDE1234F
  const panRegex = /^[A-Z]{5}\d{4}[A-Z]$/;
  if (panRegex.test(normalized)) {
    return normalized;
  }

  return null;
}

/**
 * Normalize date to ISO format (yyyy-mm-dd)
 * Handles various input formats
 *
 * @param date - Date string or Date object
 * @returns ISO date string (yyyy-mm-dd) or null if invalid
 */
export function normalizeDate(date: string | Date | null | undefined): string | null {
  if (!date) return null;

  let dateObj: Date;

  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }

  // Check if valid date
  if (isNaN(dateObj.getTime())) {
    return null;
  }

  // Format to yyyy-mm-dd (India timezone aware)
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Get today's date in ISO format (yyyy-mm-dd) in India timezone
 *
 * @returns Today's date as yyyy-mm-dd
 */
export function getTodayISO(): string {
  const now = new Date();

  // Convert to India timezone (IST: UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in ms
  const istTime = new Date(now.getTime() + istOffset);

  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istTime.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Normalize organization ID to uppercase
 *
 * @param orgId - Organization identifier
 * @returns Normalized org ID
 */
export function normalizeOrgId(orgId: string | null | undefined): string | null {
  if (!orgId) return null;
  return orgId.trim().toUpperCase();
}

/**
 * Normalize name - trim and capitalize properly
 * Handles both English and Marathi names
 *
 * @param name - Person's name
 * @returns Trimmed name or null if empty
 */
export function normalizeName(name: string | null | undefined): string | null {
  if (!name) return null;

  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Validate and normalize amount to 2 decimal places
 *
 * @param amount - Amount value
 * @returns Normalized amount or null if invalid
 */
export function normalizeAmount(amount: number | string | null | undefined): number | null {
  if (amount === null || amount === undefined) return null;

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num) || num < 0) {
    return null;
  }

  // Round to 2 decimal places
  return Math.round(num * 100) / 100;
}
