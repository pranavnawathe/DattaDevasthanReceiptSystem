"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.handler = void 0;
var donation_service_1 = require("../common/services/donation-service");
var receipt_artifact_1 = require("../common/services/receipt-artifact");
var queries_1 = require("../common/db/queries");
var crypto_1 = require("../common/utils/crypto");
var receipt_listing_1 = require("../common/services/receipt-listing");
var export_service_1 = require("../common/services/export-service");
// Organization ID (hardcoded for now, will come from auth context later)
var ORG_ID = 'DATTA-SAKHARAPA';
function json(statusCode, body) {
    return {
        statusCode: statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(body),
    };
}
var handler = function (event) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, method, path, payload, response, donation, pdfKey, queryParams, date, startDate, endDate, rangeId, receiptNo, donorId, includeVoided, limit, nextToken, pagination, includeVoidedFlag, receipt, result_1, result_2, result_3, targetDate, result, queryParams, donor, type, donorItem, receiptsResult, donorId, queryParams, pagination, includeVoidedFlag, result, receiptNo, downloadUrl, exportRequest, result, error_1, errorMessage;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = { method: event.requestContext.http.method, path: event.rawPath }, method = _a.method, path = _a.path;
                console.log("".concat(method, " ").concat(path), (0, crypto_1.sanitizeForLogs)({ headers: event.headers }));
                _b.label = 1;
            case 1:
                _b.trys.push([1, 25, , 26]);
                // Health endpoint
                if (method === 'GET' && path === '/health') {
                    return [2 /*return*/, json(200, { ok: true, service: 'temple-backend', ts: Date.now() })];
                }
                if (!(method === 'POST' && path === '/receipts')) return [3 /*break*/, 5];
                if (!event.body) {
                    return [2 /*return*/, json(400, { success: false, error: 'Request body is required' })];
                }
                payload = JSON.parse(event.body);
                console.log('Creating donation:', (0, crypto_1.sanitizeForLogs)(payload));
                return [4 /*yield*/, (0, donation_service_1.createDonation)(ORG_ID, payload)];
            case 2:
                response = _b.sent();
                return [4 /*yield*/, (0, queries_1.getDonationByReceiptNo)(ORG_ID, response.receiptNo)];
            case 3:
                donation = _b.sent();
                if (!donation) {
                    throw new Error('Failed to retrieve created donation');
                }
                return [4 /*yield*/, (0, receipt_artifact_1.createAndUploadReceipt)(donation)];
            case 4:
                pdfKey = _b.sent();
                console.log("\u2705 Donation created: ".concat(response.receiptNo, ", Receipt: ").concat(pdfKey));
                // Return success response
                return [2 /*return*/, json(201, __assign(__assign({}, response), { pdfKey: pdfKey, message: 'Donation receipt created successfully' }))];
            case 5:
                if (!(method === 'GET' && path === '/receipts')) return [3 /*break*/, 15];
                queryParams = event.queryStringParameters || {};
                console.log('Listing receipts with params:', queryParams);
                date = queryParams.date, startDate = queryParams.startDate, endDate = queryParams.endDate, rangeId = queryParams.rangeId, receiptNo = queryParams.receiptNo, donorId = queryParams.donorId, includeVoided = queryParams.includeVoided, limit = queryParams.limit, nextToken = queryParams.nextToken;
                pagination = {
                    limit: limit ? parseInt(limit, 10) : undefined,
                    lastEvaluatedKey: nextToken,
                };
                includeVoidedFlag = includeVoided === 'true';
                if (!receiptNo) return [3 /*break*/, 7];
                return [4 /*yield*/, (0, receipt_listing_1.getReceiptByNumber)(ORG_ID, receiptNo)];
            case 6:
                receipt = _b.sent();
                return [2 /*return*/, json(200, {
                        success: true,
                        items: receipt ? [receipt] : [],
                        count: receipt ? 1 : 0,
                    })];
            case 7:
                if (!donorId) return [3 /*break*/, 9];
                return [4 /*yield*/, (0, receipt_listing_1.listReceiptsByDonor)(ORG_ID, donorId, pagination, includeVoidedFlag)];
            case 8:
                result_1 = _b.sent();
                return [2 /*return*/, json(200, __assign({ success: true }, result_1))];
            case 9:
                if (!rangeId) return [3 /*break*/, 11];
                return [4 /*yield*/, (0, receipt_listing_1.listReceiptsByRange)(ORG_ID, rangeId, pagination, includeVoidedFlag)];
            case 10:
                result_2 = _b.sent();
                return [2 /*return*/, json(200, __assign({ success: true }, result_2))];
            case 11:
                if (!(startDate && endDate)) return [3 /*break*/, 13];
                return [4 /*yield*/, (0, receipt_listing_1.listReceiptsByDateRange)(ORG_ID, startDate, endDate, pagination, includeVoidedFlag)];
            case 12:
                result_3 = _b.sent();
                return [2 /*return*/, json(200, __assign({ success: true }, result_3))];
            case 13:
                targetDate = date || new Date().toISOString().split('T')[0];
                return [4 /*yield*/, (0, receipt_listing_1.listReceiptsByDate)(ORG_ID, targetDate, pagination, includeVoidedFlag)];
            case 14:
                result = _b.sent();
                return [2 /*return*/, json(200, __assign({ success: true }, result))];
            case 15:
                if (!(method === 'GET' && path === '/receipts/search')) return [3 /*break*/, 18];
                queryParams = event.queryStringParameters || {};
                donor = queryParams.donor, type = queryParams.type;
                if (!donor) {
                    return [2 /*return*/, json(400, { success: false, error: 'donor query parameter is required' })];
                }
                console.log("Searching donor: ".concat(donor, " (type: ").concat(type || 'auto', ")"));
                return [4 /*yield*/, (0, receipt_listing_1.searchDonorByIdentifier)(ORG_ID, donor, type)];
            case 16:
                donorItem = _b.sent();
                if (!donorItem) {
                    return [2 /*return*/, json(200, {
                            success: true,
                            found: false,
                        })];
                }
                return [4 /*yield*/, (0, receipt_listing_1.listReceiptsByDonor)(ORG_ID, donorItem.donorId, { limit: 5 })];
            case 17:
                receiptsResult = _b.sent();
                return [2 /*return*/, json(200, {
                        success: true,
                        found: true,
                        donor: donorItem,
                        recentReceipts: receiptsResult.items,
                    })];
            case 18:
                if (!(method === 'GET' && path.startsWith('/receipts/donor/'))) return [3 /*break*/, 20];
                donorId = path.split('/')[3];
                if (!donorId) {
                    return [2 /*return*/, json(400, { success: false, error: 'Donor ID is required' })];
                }
                queryParams = event.queryStringParameters || {};
                pagination = {
                    limit: queryParams.limit ? parseInt(queryParams.limit, 10) : undefined,
                    lastEvaluatedKey: queryParams.nextToken,
                };
                includeVoidedFlag = queryParams.includeVoided === 'true';
                console.log("Fetching receipts for donor: ".concat(donorId));
                return [4 /*yield*/, (0, receipt_listing_1.listReceiptsByDonor)(ORG_ID, donorId, pagination, includeVoidedFlag)];
            case 19:
                result = _b.sent();
                return [2 /*return*/, json(200, __assign({ success: true }, result))];
            case 20:
                if (!(method === 'GET' && path.startsWith('/receipts/') && path.endsWith('/download'))) return [3 /*break*/, 22];
                receiptNo = path.split('/')[2];
                if (!receiptNo || !receiptNo.match(/^\d{4}-\d{5}$/)) {
                    return [2 /*return*/, json(400, { success: false, error: 'Invalid receipt number format' })];
                }
                console.log("Generating download URL for receipt: ".concat(receiptNo));
                return [4 /*yield*/, (0, receipt_artifact_1.getReceiptDownloadUrl)(receiptNo)];
            case 21:
                downloadUrl = _b.sent();
                return [2 /*return*/, json(200, {
                        success: true,
                        receiptNo: receiptNo,
                        downloadUrl: downloadUrl,
                        expiresIn: 3600, // 1 hour
                    })];
            case 22:
                if (!(method === 'POST' && path === '/receipts/export')) return [3 /*break*/, 24];
                if (!event.body) {
                    return [2 /*return*/, json(400, { success: false, error: 'Request body is required' })];
                }
                exportRequest = JSON.parse(event.body);
                console.log('Exporting receipts:', (0, crypto_1.sanitizeForLogs)(exportRequest));
                // Validate required fields
                if (!exportRequest.startDate || !exportRequest.endDate) {
                    return [2 /*return*/, json(400, {
                            success: false,
                            error: 'startDate and endDate are required',
                        })];
                }
                if (!exportRequest.format || !['csv', 'excel'].includes(exportRequest.format)) {
                    return [2 /*return*/, json(400, {
                            success: false,
                            error: 'format must be either "csv" or "excel"',
                        })];
                }
                return [4 /*yield*/, (0, export_service_1.generateExport)(ORG_ID, {
                        format: exportRequest.format,
                        startDate: exportRequest.startDate,
                        endDate: exportRequest.endDate,
                        rangeId: exportRequest.rangeId,
                        includeVoided: exportRequest.includeVoided || false,
                    })];
            case 23:
                result = _b.sent();
                console.log("\u2705 Export generated: ".concat(result.fileName, " (").concat(result.recordCount, " records)"));
                return [2 /*return*/, json(200, result)];
            case 24: 
            // Route not found
            return [2 /*return*/, json(404, { success: false, error: 'Not found' })];
            case 25:
                error_1 = _b.sent();
                console.error('❌ Error:', error_1);
                errorMessage = error_1 instanceof Error ? error_1.message : 'Unknown error';
                return [2 /*return*/, json(500, {
                        success: false,
                        error: errorMessage,
                    })];
            case 26: return [2 /*return*/];
        }
    });
}); };
exports.handler = handler;
