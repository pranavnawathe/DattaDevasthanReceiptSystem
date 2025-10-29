/**
 * Utility functions for Range operations
 */

import { RangeItem, RangeStatus } from './types';

/**
 * Validation error
 */
export class RangeValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'RangeValidationError';
  }
}

/**
 * Validate range data
 */
export function validateRange(range: Partial<RangeItem>): void {
  // Validate alias
  if (!range.alias || range.alias.trim().length === 0) {
    throw new RangeValidationError('Range alias is required', 'INVALID_ALIAS');
  }

  // Validate year
  if (!range.year || range.year < 2000 || range.year > 2100) {
    throw new RangeValidationError('Invalid year (must be between 2000-2100)', 'INVALID_YEAR');
  }

  // Validate start
  if (range.start === undefined || range.start < 1) {
    throw new RangeValidationError('Start must be >= 1', 'INVALID_START');
  }

  // Validate end
  if (range.end === undefined || range.end < range.start) {
    throw new RangeValidationError('End must be >= start', 'INVALID_END');
  }

  // Validate range size (max 99,999 per range)
  const rangeSize = range.end - range.start + 1;
  if (rangeSize > 99999) {
    throw new RangeValidationError('Range size cannot exceed 99,999', 'RANGE_TOO_LARGE');
  }

  // Validate next
  if (range.next !== undefined) {
    if (range.next < range.start || range.next > range.end + 1) {
      throw new RangeValidationError(
        'Next must be between start and end+1',
        'INVALID_NEXT'
      );
    }
  }
}

/**
 * Check if range is exhausted
 */
export function isRangeExhausted(range: RangeItem): boolean {
  return range.next > range.end;
}

/**
 * Calculate remaining numbers in range
 */
export function getRemainingCount(range: RangeItem): number {
  if (range.next > range.end) {
    return 0;
  }
  return range.end - range.next + 1;
}

/**
 * Format receipt number with year prefix and zero-padding
 * @param year - Year (e.g., 2025)
 * @param num - Number (e.g., 154)
 * @returns Formatted receipt number (e.g., "2025-00154")
 */
export function formatReceiptNumber(year: number, num: number): string {
  const paddedNum = num.toString().padStart(5, '0');
  return `${year}-${paddedNum}`;
}

/**
 * Check if range status allows activation
 */
export function canActivateRange(range: RangeItem): boolean {
  return range.status === RangeStatus.DRAFT;
}

/**
 * Check if range status allows locking
 */
export function canLockRange(range: RangeItem): boolean {
  return range.status === RangeStatus.ACTIVE;
}

/**
 * Check if range status allows unlocking
 */
export function canUnlockRange(range: RangeItem): boolean {
  return range.status === RangeStatus.LOCKED;
}

/**
 * Check if range can be used for receipt issuance
 */
export function canIssueFromRange(range: RangeItem): boolean {
  return range.status === RangeStatus.ACTIVE && !isRangeExhausted(range);
}

/**
 * Generate unique range ID
 * Format: YYYY-X (e.g., "2025-A", "2025-B")
 */
export function generateRangeId(year: number, suffix: string): string {
  return `${year}-${suffix.toUpperCase()}`;
}

/**
 * Validate range ID format
 */
export function validateRangeId(rangeId: string): boolean {
  // Format: YYYY-X or YYYY-XX
  const pattern = /^20\d{2}-[A-Z0-9]{1,2}$/;
  return pattern.test(rangeId);
}
