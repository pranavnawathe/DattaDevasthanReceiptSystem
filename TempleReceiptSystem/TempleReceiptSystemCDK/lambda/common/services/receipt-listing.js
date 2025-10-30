"use strict";
/**
 * Receipt listing and search service
 * Provides multiple query patterns for finding receipts
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
exports.listReceiptsByDate = listReceiptsByDate;
exports.listReceiptsByDateRange = listReceiptsByDateRange;
exports.listReceiptsByDonor = listReceiptsByDonor;
exports.listReceiptsByRange = listReceiptsByRange;
exports.getReceiptByNumber = getReceiptByNumber;
exports.searchDonorByIdentifier = searchDonorByIdentifier;
var lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
var dynamo_client_1 = require("../db/dynamo-client");
var types_1 = require("../types");
var normalizers_1 = require("../utils/normalizers");
var crypto_1 = require("../utils/crypto");
/**
 * List receipts for a specific date using GSI2
 * GSI2PK = DATE#<date>, GSI2SK = RCPT#<receiptNo>
 *
 * @param orgId - Organization ID
 * @param date - ISO date (YYYY-MM-DD)
 * @param params - Pagination parameters
 * @param includeVoided - Include voided receipts (default: false)
 * @returns Paginated list of receipts
 */
function listReceiptsByDate(orgId_1, date_1, params_1) {
    return __awaiter(this, arguments, void 0, function (orgId, date, params, includeVoided) {
        var limit, queryParams, result, items, nextToken;
        if (includeVoided === void 0) { includeVoided = false; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    limit = Math.min((params === null || params === void 0 ? void 0 : params.limit) || 50, 100);
                    queryParams = {
                        TableName: (0, dynamo_client_1.getTableName)(),
                        IndexName: 'GSI2',
                        KeyConditionExpression: 'GSI2PK = :gsi2pk',
                        ExpressionAttributeValues: {
                            ':gsi2pk': types_1.Keys.GSI2.date(date),
                        },
                        Limit: limit,
                        ScanIndexForward: false, // Sort descending (newest first)
                    };
                    if (params === null || params === void 0 ? void 0 : params.lastEvaluatedKey) {
                        queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(params.lastEvaluatedKey, 'base64').toString());
                    }
                    return [4 /*yield*/, dynamo_client_1.docClient.send(new lib_dynamodb_1.QueryCommand(queryParams))];
                case 1:
                    result = _a.sent();
                    items = (result.Items || []);
                    // Filter voided receipts if needed
                    if (!includeVoided) {
                        items = items.filter(function (item) { return !item.updatedAt || item.pdfKey; }); // Simple heuristic, better to check status field
                    }
                    nextToken = result.LastEvaluatedKey
                        ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
                        : undefined;
                    return [2 /*return*/, {
                            items: items,
                            nextToken: nextToken,
                            count: items.length,
                        }];
            }
        });
    });
}
/**
 * List receipts between two dates using GSI2
 * Queries each date in range and merges results
 *
 * @param orgId - Organization ID
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @param params - Pagination parameters
 * @param includeVoided - Include voided receipts
 * @returns Paginated list of receipts
 */
function listReceiptsByDateRange(orgId_1, startDate_1, endDate_1, params_1) {
    return __awaiter(this, arguments, void 0, function (orgId, startDate, endDate, params, includeVoided) {
        var limit, dates, allItems, _i, dates_1, date, queryParams, result, items, filteredItems, paginatedItems;
        if (includeVoided === void 0) { includeVoided = false; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    limit = Math.min((params === null || params === void 0 ? void 0 : params.limit) || 50, 100);
                    dates = generateDateRange(startDate, endDate);
                    if (dates.length > 31) {
                        throw new Error('Date range too large (max 31 days)');
                    }
                    allItems = [];
                    _i = 0, dates_1 = dates;
                    _a.label = 1;
                case 1:
                    if (!(_i < dates_1.length)) return [3 /*break*/, 4];
                    date = dates_1[_i];
                    queryParams = {
                        TableName: (0, dynamo_client_1.getTableName)(),
                        IndexName: 'GSI2',
                        KeyConditionExpression: 'GSI2PK = :gsi2pk',
                        ExpressionAttributeValues: {
                            ':gsi2pk': types_1.Keys.GSI2.date(date),
                        },
                        ScanIndexForward: false,
                    };
                    return [4 /*yield*/, dynamo_client_1.docClient.send(new lib_dynamodb_1.QueryCommand(queryParams))];
                case 2:
                    result = _a.sent();
                    items = (result.Items || []);
                    allItems.push.apply(allItems, items);
                    // Stop if we have enough results
                    if (allItems.length >= limit) {
                        return [3 /*break*/, 4];
                    }
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    filteredItems = allItems;
                    if (!includeVoided) {
                        filteredItems = allItems.filter(function (item) { return !item.updatedAt || item.pdfKey; });
                    }
                    // Sort by date desc, then receipt number desc
                    filteredItems.sort(function (a, b) {
                        if (a.date !== b.date) {
                            return b.date.localeCompare(a.date);
                        }
                        return b.receiptNo.localeCompare(a.receiptNo);
                    });
                    paginatedItems = filteredItems.slice(0, limit);
                    return [2 /*return*/, {
                            items: paginatedItems,
                            nextToken: undefined, // Simplified - not implementing multi-query pagination
                            count: paginatedItems.length,
                        }];
            }
        });
    });
}
/**
 * List receipts for a specific donor using GSI1
 * GSI1PK = DONOR#<donorId>, GSI1SK = DATE#<date>#RCPT#<receiptNo>
 *
 * @param orgId - Organization ID
 * @param donorId - Donor ID
 * @param params - Pagination parameters
 * @param includeVoided - Include voided receipts
 * @returns Paginated list of receipts
 */
function listReceiptsByDonor(orgId_1, donorId_1, params_1) {
    return __awaiter(this, arguments, void 0, function (orgId, donorId, params, includeVoided) {
        var limit, queryParams, result, items, nextToken;
        if (includeVoided === void 0) { includeVoided = false; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    limit = Math.min((params === null || params === void 0 ? void 0 : params.limit) || 50, 100);
                    queryParams = {
                        TableName: (0, dynamo_client_1.getTableName)(),
                        IndexName: 'GSI1',
                        KeyConditionExpression: 'GSI1PK = :gsi1pk',
                        ExpressionAttributeValues: {
                            ':gsi1pk': types_1.Keys.GSI1.donor(donorId),
                        },
                        Limit: limit,
                        ScanIndexForward: false, // Sort descending (newest first)
                    };
                    if (params === null || params === void 0 ? void 0 : params.lastEvaluatedKey) {
                        queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(params.lastEvaluatedKey, 'base64').toString());
                    }
                    return [4 /*yield*/, dynamo_client_1.docClient.send(new lib_dynamodb_1.QueryCommand(queryParams))];
                case 1:
                    result = _a.sent();
                    items = (result.Items || []);
                    // Filter voided if needed
                    if (!includeVoided) {
                        items = items.filter(function (item) { return !item.updatedAt || item.pdfKey; });
                    }
                    nextToken = result.LastEvaluatedKey
                        ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
                        : undefined;
                    return [2 /*return*/, {
                            items: items,
                            nextToken: nextToken,
                            count: items.length,
                        }];
            }
        });
    });
}
/**
 * List receipts from a specific range
 * Queries all receipts and filters by rangeId
 *
 * @param orgId - Organization ID
 * @param rangeId - Range ID (e.g., "2025-H")
 * @param params - Pagination parameters
 * @param includeVoided - Include voided receipts
 * @returns Paginated list of receipts
 */
function listReceiptsByRange(orgId_1, rangeId_1, params_1) {
    return __awaiter(this, arguments, void 0, function (orgId, rangeId, params, includeVoided) {
        var limit, queryParams, result, items, paginatedItems;
        if (includeVoided === void 0) { includeVoided = false; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    limit = Math.min((params === null || params === void 0 ? void 0 : params.limit) || 50, 100);
                    queryParams = {
                        TableName: (0, dynamo_client_1.getTableName)(),
                        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
                        ExpressionAttributeValues: {
                            ':pk': types_1.Keys.PK.org(orgId),
                            ':sk': 'RCPT#',
                        },
                        ScanIndexForward: false, // Sort descending
                    };
                    if (params === null || params === void 0 ? void 0 : params.lastEvaluatedKey) {
                        queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(params.lastEvaluatedKey, 'base64').toString());
                    }
                    return [4 /*yield*/, dynamo_client_1.docClient.send(new lib_dynamodb_1.QueryCommand(queryParams))];
                case 1:
                    result = _a.sent();
                    items = (result.Items || []);
                    // Filter by rangeId
                    items = items.filter(function (item) { return item.rangeId === rangeId; });
                    // Filter voided if needed
                    if (!includeVoided) {
                        items = items.filter(function (item) { return !item.updatedAt || item.pdfKey; });
                    }
                    paginatedItems = items.slice(0, limit);
                    return [2 /*return*/, {
                            items: paginatedItems,
                            nextToken: undefined, // Simplified
                            count: paginatedItems.length,
                        }];
            }
        });
    });
}
/**
 * Get a single receipt by receipt number
 *
 * @param orgId - Organization ID
 * @param receiptNo - Receipt number (e.g., "2025-20001")
 * @returns Receipt or null
 */
function getReceiptByNumber(orgId, receiptNo) {
    return __awaiter(this, void 0, void 0, function () {
        var params, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    params = {
                        TableName: (0, dynamo_client_1.getTableName)(),
                        Key: {
                            PK: types_1.Keys.PK.org(orgId),
                            SK: types_1.Keys.SK.receipt(receiptNo),
                        },
                    };
                    return [4 /*yield*/, dynamo_client_1.docClient.send(new lib_dynamodb_1.GetCommand(params))];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.Item || null];
            }
        });
    });
}
/**
 * Search for donor by identifier (phone, PAN, or email)
 * Uses alias table for lookup
 *
 * @param orgId - Organization ID
 * @param identifier - Phone number, PAN, or email
 * @param type - Type of identifier (optional, auto-detected if not provided)
 * @returns Donor item or null
 */
function searchDonorByIdentifier(orgId, identifier, type) {
    return __awaiter(this, void 0, void 0, function () {
        var sk, normalizedPhone, normalizedPAN, normalizedEmail, aliasParams, aliasResult, donorId, donorParams, donorResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Auto-detect type if not provided
                    if (!type) {
                        if (identifier.match(/^[+]?[0-9]{10,15}$/)) {
                            type = 'phone';
                        }
                        else if (identifier.match(/^[A-Z]{5}[0-9]{4}[A-Z]$/i)) {
                            type = 'pan';
                        }
                        else if (identifier.includes('@')) {
                            type = 'email';
                        }
                        else {
                            throw new Error('Cannot auto-detect identifier type. Please specify type parameter.');
                        }
                    }
                    // Build SK based on type
                    switch (type) {
                        case 'phone':
                            normalizedPhone = (0, normalizers_1.normalizePhone)(identifier);
                            if (!normalizedPhone) {
                                return [2 /*return*/, null];
                            }
                            sk = types_1.Keys.SK.aliasPhone(normalizedPhone);
                            break;
                        case 'pan':
                            normalizedPAN = (0, normalizers_1.normalizePAN)(identifier);
                            if (!normalizedPAN) {
                                return [2 /*return*/, null];
                            }
                            sk = types_1.Keys.SK.aliasPAN((0, crypto_1.hashPAN)(normalizedPAN));
                            break;
                        case 'email':
                            normalizedEmail = (0, normalizers_1.normalizeEmail)(identifier);
                            if (!normalizedEmail) {
                                return [2 /*return*/, null];
                            }
                            sk = types_1.Keys.SK.aliasEmail((0, crypto_1.hashEmail)(normalizedEmail));
                            break;
                        default:
                            throw new Error("Invalid identifier type: ".concat(type));
                    }
                    aliasParams = {
                        TableName: (0, dynamo_client_1.getTableName)(),
                        Key: {
                            PK: types_1.Keys.PK.org(orgId),
                            SK: sk,
                        },
                    };
                    return [4 /*yield*/, dynamo_client_1.docClient.send(new lib_dynamodb_1.GetCommand(aliasParams))];
                case 1:
                    aliasResult = _a.sent();
                    if (!aliasResult.Item) {
                        return [2 /*return*/, null];
                    }
                    donorId = aliasResult.Item.donorId;
                    donorParams = {
                        TableName: (0, dynamo_client_1.getTableName)(),
                        Key: {
                            PK: types_1.Keys.PK.org(orgId),
                            SK: types_1.Keys.SK.donor(donorId),
                        },
                    };
                    return [4 /*yield*/, dynamo_client_1.docClient.send(new lib_dynamodb_1.GetCommand(donorParams))];
                case 2:
                    donorResult = _a.sent();
                    return [2 /*return*/, donorResult.Item || null];
            }
        });
    });
}
/**
 * Helper: Generate array of dates between start and end (inclusive)
 */
function generateDateRange(startDate, endDate) {
    var dates = [];
    var current = new Date(startDate);
    var end = new Date(endDate);
    while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }
    return dates;
}
