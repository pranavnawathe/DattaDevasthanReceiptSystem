"use strict";
/**
 * ID generation utilities
 * Generates stable donor IDs and receipt numbers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDonorId = generateDonorId;
exports.generateReceiptNo = generateReceiptNo;
exports.parseReceiptNo = parseReceiptNo;
exports.generateCorrelationId = generateCorrelationId;
const crypto_1 = require("crypto");
const crypto_2 = require("./crypto");
const normalizers_1 = require("./normalizers");
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
function generateDonorId(pan, phone, email, orgId) {
    // Normalize all inputs
    const normalizedPAN = (0, normalizers_1.normalizePAN)(pan);
    const normalizedPhone = (0, normalizers_1.normalizePhone)(phone);
    const normalizedEmail = (0, normalizers_1.normalizeEmail)(email);
    // Priority: PAN (most stable) > Phone > Email
    let seed;
    if (normalizedPAN) {
        seed = `${orgId}:PAN:${normalizedPAN}`;
    }
    else if (normalizedPhone) {
        seed = `${orgId}:PHONE:${normalizedPhone}`;
    }
    else if (normalizedEmail) {
        seed = `${orgId}:EMAIL:${normalizedEmail}`;
    }
    else {
        // No stable identifier - use UUID
        return `D_${(0, crypto_1.randomUUID)().replace(/-/g, '').substring(0, 12)}`;
    }
    // Generate hash-based ID
    const hash = (0, crypto_2.shortHash)(seed);
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
function generateReceiptNo(year, sequence) {
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
function parseReceiptNo(receiptNo) {
    const match = receiptNo.match(/^(\d{4})-(\d{5})$/);
    if (!match)
        return null;
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
function generateCorrelationId() {
    return `req_${Date.now()}_${(0, crypto_1.randomUUID)().substring(0, 8)}`;
}
