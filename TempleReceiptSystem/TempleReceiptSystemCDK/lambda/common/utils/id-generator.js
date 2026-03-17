"use strict";
/**
 * ID generation utilities
 * Generates stable donor IDs and receipt numbers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDonorId = generateDonorId;
exports.getFinancialYear = getFinancialYear;
exports.generateReceiptNo = generateReceiptNo;
exports.displayReceiptNo = displayReceiptNo;
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
 * Get the Indian financial year for a given date.
 * Financial year runs April 1 to March 31.
 * Example: Feb 2026 → { year: 2025, label: '2025-26' }
 * Example: Apr 2025 → { year: 2025, label: '2025-26' }
 * Example: Mar 2025 → { year: 2024, label: '2024-25' }
 *
 * @param date - ISO date string (yyyy-mm-dd), defaults to today
 * @returns { year: number, label: string } where year is the start year of the FY
 */
function getFinancialYear(date) {
    let calYear;
    let month;
    if (date) {
        // Parse yyyy-mm-dd directly to avoid UTC timezone shift from new Date(string)
        const parts = date.split('-');
        calYear = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
    }
    else {
        const d = new Date();
        calYear = d.getFullYear();
        month = d.getMonth() + 1;
    }
    const fyStart = month >= 4 ? calYear : calYear - 1;
    const fyEnd = (fyStart + 1) % 100;
    const label = `${fyStart}-${String(fyEnd).padStart(2, '0')}`;
    return { year: fyStart, label };
}
/**
 * Generate receipt number in format: NNNNN-YYYY-YY
 * Example: 00071-2025-26
 *
 * Stored with hyphens to avoid URL path conflicts.
 * Use displayReceiptNo() to get the display format (00071/2025-26).
 *
 * @param financialYear - Start year of the financial year (e.g. 2025 for FY 2025-26)
 * @param sequence - Sequence number (1, 2, 3, ...)
 * @returns Formatted receipt number
 */
function generateReceiptNo(financialYear, sequence) {
    const paddedSeq = String(sequence).padStart(5, '0');
    const fyEnd = String((financialYear + 1) % 100).padStart(2, '0');
    return `${paddedSeq}-${financialYear}-${fyEnd}`;
}
/**
 * Convert stored receipt number to display format for PDF/UI.
 * Example: "00071-2025-26" → "00071/2025-26"
 * Old format passthrough: "2025-00071" → "2025-00071" (unchanged)
 *
 * @param receiptNo - Stored receipt number
 * @returns Display-formatted receipt number
 */
function displayReceiptNo(receiptNo) {
    // New format: NNNNN-YYYY-YY → NNNNN/YYYY-YY
    const newMatch = receiptNo.match(/^(\d{5})-(\d{4}-\d{2})$/);
    if (newMatch) {
        return `${newMatch[1]}/${newMatch[2]}`;
    }
    // Old format: return as-is
    return receiptNo;
}
/**
 * Parse receipt number to extract financial year and sequence.
 * Supports both new format (NNNNN-YYYY-YY) and old format (YYYY-NNNNN).
 *
 * @param receiptNo - Receipt number string
 * @returns Object with year and sequence, or null if invalid
 */
function parseReceiptNo(receiptNo) {
    // New format: NNNNN-YYYY-YY
    const newMatch = receiptNo.match(/^(\d{5})-(\d{4})-\d{2}$/);
    if (newMatch) {
        return {
            year: parseInt(newMatch[2], 10),
            sequence: parseInt(newMatch[1], 10),
        };
    }
    // Old format: YYYY-NNNNN
    const oldMatch = receiptNo.match(/^(\d{4})-(\d{5})$/);
    if (oldMatch) {
        return {
            year: parseInt(oldMatch[1], 10),
            sequence: parseInt(oldMatch[2], 10),
        };
    }
    return null;
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
//# sourceMappingURL=id-generator.js.map