"use strict";
/**
 * Export Service
 *
 * Generates CSV/Excel exports for Tally integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateExport = generateExport;
const receipt_listing_1 = require("./receipt-listing");
/**
 * Tally CSV column mapping
 * Based on standard Tally voucher import format
 */
const TALLY_CSV_HEADERS = [
    'Date', // Receipt date (DD-MM-YYYY format for Tally)
    'Receipt No', // Receipt number (2025-00001)
    'Donor Name', // Donor name
    'Mobile', // Donor mobile
    'PAN', // Donor PAN (optional)
    'Amount', // Total amount
    'Payment Mode', // CASH, UPI, CHEQUE, etc.
    'Payment Ref', // UPI ID, Cheque No, etc.
    'Purpose Breakup', // JSON string of breakup
    'Eligible 80G', // Yes/No
    'Narration', // Auto-generated description
];
/**
 * Generate export for given date range
 */
async function generateExport(orgId, options) {
    // Validate dates
    validateDateRange(options.startDate, options.endDate);
    // Fetch all receipts in date range
    const receipts = [];
    let nextToken;
    do {
        const result = await (0, receipt_listing_1.listReceiptsByDateRange)(orgId, options.startDate, options.endDate, { limit: 100, lastEvaluatedKey: nextToken }, options.includeVoided || false);
        receipts.push(...result.items);
        nextToken = result.nextToken;
    } while (nextToken);
    // Filter by range if specified
    const filteredReceipts = options.rangeId
        ? receipts.filter((r) => r.rangeId === options.rangeId)
        : receipts;
    // Generate CSV
    if (options.format === 'csv') {
        const csvContent = generateCSV(filteredReceipts);
        const fileName = generateFileName(options, 'csv');
        return {
            success: true,
            format: 'csv',
            fileName,
            content: csvContent,
            recordCount: filteredReceipts.length,
            dateRange: {
                start: options.startDate,
                end: options.endDate,
            },
        };
    }
    // Excel format not yet implemented
    throw new Error('Excel format not yet supported. Please use CSV format.');
}
/**
 * Generate CSV content from receipts
 */
function generateCSV(receipts) {
    const rows = [];
    // Add header row
    rows.push(TALLY_CSV_HEADERS.map(escapeCSVField).join(','));
    // Add data rows
    for (const receipt of receipts) {
        const row = [
            formatDateForTally(receipt.date), // Date (DD-MM-YYYY)
            receipt.receiptNo, // Receipt No
            receipt.donor.name, // Donor Name
            receipt.donor.mobile || '', // Mobile
            receipt.donor.pan || '', // PAN
            receipt.total.toFixed(2), // Amount
            receipt.payment.mode, // Payment Mode
            receipt.payment.ref || '', // Payment Ref
            JSON.stringify(receipt.breakup), // Purpose Breakup (JSON)
            receipt.eligible80G ? 'Yes' : 'No', // Eligible 80G
            generateNarration(receipt), // Narration
        ];
        rows.push(row.map(escapeCSVField).join(','));
    }
    return rows.join('\n');
}
/**
 * Generate narration/description for Tally
 */
function generateNarration(receipt) {
    const purposes = Object.keys(receipt.breakup).join(', ');
    return `Receipt ${receipt.receiptNo} - ${receipt.donor.name} - ${purposes}`;
}
/**
 * Format date for Tally (DD-MM-YYYY)
 */
function formatDateForTally(isoDate) {
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
}
/**
 * Escape CSV field (handle quotes, commas, newlines)
 */
function escapeCSVField(field) {
    const stringField = String(field);
    // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
}
/**
 * Generate file name based on export options
 */
function generateFileName(options, extension) {
    const { startDate, endDate, rangeId } = options;
    const dateStr = startDate === endDate
        ? startDate
        : `${startDate}_to_${endDate}`;
    const rangeStr = rangeId ? `_${rangeId}` : '';
    return `receipts_export_${dateStr}${rangeStr}.${extension}`;
}
/**
 * Validate date range
 */
function validateDateRange(startDate, endDate) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate)) {
        throw new Error(`Invalid start date format: ${startDate}. Expected yyyy-mm-dd`);
    }
    if (!dateRegex.test(endDate)) {
        throw new Error(`Invalid end date format: ${endDate}. Expected yyyy-mm-dd`);
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
        throw new Error('Start date must be before or equal to end date');
    }
    // Limit to 1 year range
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
    if (end.getTime() - start.getTime() > oneYearMs) {
        throw new Error('Export range cannot exceed 1 year');
    }
}
