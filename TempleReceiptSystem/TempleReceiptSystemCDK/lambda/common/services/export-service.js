"use strict";
/**
 * Export Service
 *
 * Generates CSV/Excel exports for Tally integration
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateExport = generateExport;
var receipt_listing_1 = require("./receipt-listing");
/**
 * Tally CSV column mapping
 * Based on standard Tally voucher import format
 */
var TALLY_CSV_HEADERS = [
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
function generateExport(orgId, options) {
    return __awaiter(this, void 0, void 0, function () {
        var receipts, start, end, daysDiff, nextToken, result, currentStart, chunkEnd, chunkEndDate, chunkStartDate, nextToken, result, filteredReceipts, csvContent, fileName;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Validate dates
                    validateDateRange(options.startDate, options.endDate);
                    receipts = [];
                    start = new Date(options.startDate);
                    end = new Date(options.endDate);
                    daysDiff = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
                    if (!(daysDiff <= 31)) return [3 /*break*/, 5];
                    nextToken = void 0;
                    _a.label = 1;
                case 1: return [4 /*yield*/, (0, receipt_listing_1.listReceiptsByDateRange)(orgId, options.startDate, options.endDate, { limit: 100, lastEvaluatedKey: nextToken }, options.includeVoided || false)];
                case 2:
                    result = _a.sent();
                    receipts.push.apply(receipts, result.items);
                    nextToken = result.nextToken;
                    _a.label = 3;
                case 3:
                    if (nextToken) return [3 /*break*/, 1];
                    _a.label = 4;
                case 4: return [3 /*break*/, 11];
                case 5:
                    currentStart = new Date(options.startDate);
                    _a.label = 6;
                case 6:
                    if (!(currentStart <= end)) return [3 /*break*/, 11];
                    chunkEnd = new Date(currentStart);
                    chunkEnd.setDate(chunkEnd.getDate() + 30);
                    chunkEndDate = chunkEnd > end ? options.endDate : chunkEnd.toISOString().split('T')[0];
                    chunkStartDate = currentStart.toISOString().split('T')[0];
                    nextToken = void 0;
                    _a.label = 7;
                case 7: return [4 /*yield*/, (0, receipt_listing_1.listReceiptsByDateRange)(orgId, chunkStartDate, chunkEndDate, { limit: 100, lastEvaluatedKey: nextToken }, options.includeVoided || false)];
                case 8:
                    result = _a.sent();
                    receipts.push.apply(receipts, result.items);
                    nextToken = result.nextToken;
                    _a.label = 9;
                case 9:
                    if (nextToken) return [3 /*break*/, 7];
                    _a.label = 10;
                case 10:
                    currentStart.setDate(currentStart.getDate() + 31);
                    return [3 /*break*/, 6];
                case 11:
                    filteredReceipts = options.rangeId
                        ? receipts.filter(function (r) { return r.rangeId === options.rangeId; })
                        : receipts;
                    // Generate CSV
                    if (options.format === 'csv') {
                        csvContent = generateCSV(filteredReceipts);
                        fileName = generateFileName(options, 'csv');
                        return [2 /*return*/, {
                                success: true,
                                format: 'csv',
                                fileName: fileName,
                                content: csvContent,
                                recordCount: filteredReceipts.length,
                                dateRange: {
                                    start: options.startDate,
                                    end: options.endDate,
                                },
                            }];
                    }
                    // Excel format not yet implemented
                    throw new Error('Excel format not yet supported. Please use CSV format.');
            }
        });
    });
}
/**
 * Generate CSV content from receipts
 */
function generateCSV(receipts) {
    var rows = [];
    // Add header row
    rows.push(TALLY_CSV_HEADERS.map(escapeCSVField).join(','));
    // Add data rows
    for (var _i = 0, receipts_1 = receipts; _i < receipts_1.length; _i++) {
        var receipt = receipts_1[_i];
        var row = [
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
    var purposes = Object.keys(receipt.breakup).join(', ');
    return "Receipt ".concat(receipt.receiptNo, " - ").concat(receipt.donor.name, " - ").concat(purposes);
}
/**
 * Format date for Tally (DD-MM-YYYY)
 */
function formatDateForTally(isoDate) {
    var _a = isoDate.split('-'), year = _a[0], month = _a[1], day = _a[2];
    return "".concat(day, "-").concat(month, "-").concat(year);
}
/**
 * Escape CSV field (handle quotes, commas, newlines)
 */
function escapeCSVField(field) {
    var stringField = String(field);
    // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return "\"".concat(stringField.replace(/"/g, '""'), "\"");
    }
    return stringField;
}
/**
 * Generate file name based on export options
 */
function generateFileName(options, extension) {
    var startDate = options.startDate, endDate = options.endDate, rangeId = options.rangeId;
    var dateStr = startDate === endDate
        ? startDate
        : "".concat(startDate, "_to_").concat(endDate);
    var rangeStr = rangeId ? "_".concat(rangeId) : '';
    return "receipts_export_".concat(dateStr).concat(rangeStr, ".").concat(extension);
}
/**
 * Validate date range
 */
function validateDateRange(startDate, endDate) {
    var dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate)) {
        throw new Error("Invalid start date format: ".concat(startDate, ". Expected yyyy-mm-dd"));
    }
    if (!dateRegex.test(endDate)) {
        throw new Error("Invalid end date format: ".concat(endDate, ". Expected yyyy-mm-dd"));
    }
    var start = new Date(startDate);
    var end = new Date(endDate);
    if (start > end) {
        throw new Error('Start date must be before or equal to end date');
    }
    // Limit to 1 year range
    var oneYearMs = 365 * 24 * 60 * 60 * 1000;
    if (end.getTime() - start.getTime() > oneYearMs) {
        throw new Error('Export range cannot exceed 1 year');
    }
}
