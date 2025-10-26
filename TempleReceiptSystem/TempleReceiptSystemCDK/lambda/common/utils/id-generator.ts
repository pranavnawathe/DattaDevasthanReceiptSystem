/**
 * ID generation utilities
 * Generates stable donor IDs and receipt numbers
 */

import { randomUUID } from 'crypto';
import { shortHash } from './crypto';
import { normalizePAN, normalizePhone, normalizeEmail } from './normalizers';

/**
 * Generate a stable donor ID based on available identifiers
 * Priority: PAN > Phone > Email > UUID
 *
 * The donor ID is deterministic - same identifiers always produce same ID
 * This allows merging duplicate donors
 *
 * @param pan - PAN card number (optional)
 * @param phone - Phone number (optional)
 * @param email - Email address (optional)
 * @param orgId - Organization ID (for uniqueness across orgs)
 * @returns Donor ID in format: D_<12-char-hash> or D_<uuid>
 */
export function generateDonorId(
  pan: string | null | undefined,
  phone: string | null | undefined,
  email: string | null | undefined,
  orgId: string
): string {
  // Normalize all inputs
  const normalizedPAN = normalizePAN(pan);
  const normalizedPhone = normalizePhone(phone);
  const normalizedEmail = normalizeEmail(email);

  // Priority: PAN (most stable) > Phone > Email
  let seed: string;

  if (normalizedPAN) {
    seed = `${orgId}:PAN:${normalizedPAN}`;
  } else if (normalizedPhone) {
    seed = `${orgId}:PHONE:${normalizedPhone}`;
  } else if (normalizedEmail) {
    seed = `${orgId}:EMAIL:${normalizedEmail}`;
  } else {
    // No stable identifier - use UUID
    return `D_${randomUUID().replace(/-/g, '').substring(0, 12)}`;
  }

  // Generate hash-based ID
  const hash = shortHash(seed);
  return `D_${hash}`;
}

/**
 * Generate receipt number in format: YYYY-NNNNN
 * Example: 2025-00071
 *
 * @param year - Receipt year
 * @param sequence - Sequence number (1, 2, 3, ...)
 * @returns Formatted receipt number
 */
export function generateReceiptNo(year: number, sequence: number): string {
  const paddedSeq = String(sequence).padStart(5, '0');
  return `${year}-${paddedSeq}`;
}

/**
 * Parse receipt number to extract year and sequence
 * Example: "2025-00071" → { year: 2025, sequence: 71 }
 *
 * @param receiptNo - Receipt number string
 * @returns Object with year and sequence, or null if invalid
 */
export function parseReceiptNo(receiptNo: string): { year: number; sequence: number } | null {
  const match = receiptNo.match(/^(\d{4})-(\d{5})$/);
  if (!match) return null;

  return {
    year: parseInt(match[1], 10),
    sequence: parseInt(match[2], 10),
  };
}

/**
 * Generate a correlation ID for request tracking
 * Used for logging and debugging
 *
 * @returns Random correlation ID
 */
export function generateCorrelationId(): string {
  return `req_${Date.now()}_${randomUUID().substring(0, 8)}`;
}
