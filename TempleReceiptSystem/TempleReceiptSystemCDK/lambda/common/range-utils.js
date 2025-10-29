"use strict";
/**
 * Utility functions for Range operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RangeValidationError = void 0;
exports.validateRange = validateRange;
exports.isRangeExhausted = isRangeExhausted;
exports.getRemainingCount = getRemainingCount;
exports.formatReceiptNumber = formatReceiptNumber;
exports.canActivateRange = canActivateRange;
exports.canLockRange = canLockRange;
exports.canUnlockRange = canUnlockRange;
exports.canIssueFromRange = canIssueFromRange;
exports.generateRangeId = generateRangeId;
exports.validateRangeId = validateRangeId;
const types_1 = require("./types");
/**
 * Validation error
 */
class RangeValidationError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'RangeValidationError';
    }
}
exports.RangeValidationError = RangeValidationError;
/**
 * Validate range data
 */
function validateRange(range) {
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
            throw new RangeValidationError('Next must be between start and end+1', 'INVALID_NEXT');
        }
    }
}
/**
 * Check if range is exhausted
 */
function isRangeExhausted(range) {
    return range.next > range.end;
}
/**
 * Calculate remaining numbers in range
 */
function getRemainingCount(range) {
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
function formatReceiptNumber(year, num) {
    const paddedNum = num.toString().padStart(5, '0');
    return `${year}-${paddedNum}`;
}
/**
 * Check if range status allows activation
 */
function canActivateRange(range) {
    return range.status === types_1.RangeStatus.DRAFT;
}
/**
 * Check if range status allows locking
 */
function canLockRange(range) {
    return range.status === types_1.RangeStatus.ACTIVE;
}
/**
 * Check if range status allows unlocking
 */
function canUnlockRange(range) {
    return range.status === types_1.RangeStatus.LOCKED;
}
/**
 * Check if range can be used for receipt issuance
 */
function canIssueFromRange(range) {
    return range.status === types_1.RangeStatus.ACTIVE && !isRangeExhausted(range);
}
/**
 * Generate unique range ID
 * Format: YYYY-X (e.g., "2025-A", "2025-B")
 */
function generateRangeId(year, suffix) {
    return `${year}-${suffix.toUpperCase()}`;
}
/**
 * Validate range ID format
 */
function validateRangeId(rangeId) {
    // Format: YYYY-X or YYYY-XX
    const pattern = /^20\d{2}-[A-Z0-9]{1,2}$/;
    return pattern.test(rangeId);
}
