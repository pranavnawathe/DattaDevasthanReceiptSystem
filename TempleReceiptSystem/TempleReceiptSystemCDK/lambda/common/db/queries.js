"use strict";
/**
 * DynamoDB query operations
 * All database read operations for the Temple Receipt System
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
exports.getAliasByPhone = getAliasByPhone;
exports.getAliasByPAN = getAliasByPAN;
exports.getAliasByEmail = getAliasByEmail;
exports.getDonorProfile = getDonorProfile;
exports.getDonationByReceiptNo = getDonationByReceiptNo;
exports.getDonationsByDonor = getDonationsByDonor;
exports.getDonationsByDateRange = getDonationsByDateRange;
exports.getDonationsByDate = getDonationsByDate;
var lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
var dynamo_client_1 = require("./dynamo-client");
var types_1 = require("../types");
// ============================================================================
// Alias Queries
// ============================================================================
/**
 * Get donor ID by phone number (via alias lookup)
 * @param orgId - Organization ID
 * @param phone - Normalized phone (E.164)
 * @returns Donor ID or null if not found
 */
function getAliasByPhone(orgId, phone) {
    return __awaiter(this, void 0, void 0, function () {
        var params, result, item;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    params = {
                        TableName: (0, dynamo_client_1.getTableName)(),
                        Key: {
                            PK: types_1.Keys.PK.org(orgId),
                            SK: types_1.Keys.SK.aliasPhone(phone),
                        },
                    };
                    return [4 /*yield*/, dynamo_client_1.docClient.send(new lib_dynamodb_1.GetCommand(params))];
                case 1:
                    result = _a.sent();
                    item = result.Item;
                    return [2 /*return*/, (item === null || item === void 0 ? void 0 : item.donorId) || null];
            }
        });
    });
}
/**
 * Get donor ID by PAN hash (via alias lookup)
 * @param orgId - Organization ID
 * @param panHash - Hashed PAN
 * @returns Donor ID or null if not found
 */
function getAliasByPAN(orgId, panHash) {
    return __awaiter(this, void 0, void 0, function () {
        var params, result, item;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    params = {
                        TableName: (0, dynamo_client_1.getTableName)(),
                        Key: {
                            PK: types_1.Keys.PK.org(orgId),
                            SK: types_1.Keys.SK.aliasPAN(panHash),
                        },
                    };
                    return [4 /*yield*/, dynamo_client_1.docClient.send(new lib_dynamodb_1.GetCommand(params))];
                case 1:
                    result = _a.sent();
                    item = result.Item;
                    return [2 /*return*/, (item === null || item === void 0 ? void 0 : item.donorId) || null];
            }
        });
    });
}
/**
 * Get donor ID by email hash (via alias lookup)
 * @param orgId - Organization ID
 * @param emailHash - Hashed email
 * @returns Donor ID or null if not found
 */
function getAliasByEmail(orgId, emailHash) {
    return __awaiter(this, void 0, void 0, function () {
        var params, result, item;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    params = {
                        TableName: (0, dynamo_client_1.getTableName)(),
                        Key: {
                            PK: types_1.Keys.PK.org(orgId),
                            SK: types_1.Keys.SK.aliasEmail(emailHash),
                        },
                    };
                    return [4 /*yield*/, dynamo_client_1.docClient.send(new lib_dynamodb_1.GetCommand(params))];
                case 1:
                    result = _a.sent();
                    item = result.Item;
                    return [2 /*return*/, (item === null || item === void 0 ? void 0 : item.donorId) || null];
            }
        });
    });
}
// ============================================================================
// Donor Queries
// ============================================================================
/**
 * Get donor profile by donor ID
 * @param orgId - Organization ID
 * @param donorId - Donor ID
 * @returns Donor profile or null if not found
 */
function getDonorProfile(orgId, donorId) {
    return __awaiter(this, void 0, void 0, function () {
        var params, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    params = {
                        TableName: (0, dynamo_client_1.getTableName)(),
                        Key: {
                            PK: types_1.Keys.PK.org(orgId),
                            SK: types_1.Keys.SK.donor(donorId),
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
// ============================================================================
// Donation Queries
// ============================================================================
/**
 * Get a single donation by receipt number
 * @param orgId - Organization ID
 * @param receiptNo - Receipt number (e.g., "2025-00071")
 * @returns Donation item or null if not found
 */
function getDonationByReceiptNo(orgId, receiptNo) {
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
 * Get all donations for a donor (using GSI1)
 * @param donorId - Donor ID
 * @param limit - Max number of items to return (default: 50)
 * @returns Array of donations
 */
function getDonationsByDonor(donorId_1) {
    return __awaiter(this, arguments, void 0, function (donorId, limit) {
        var params, result;
        if (limit === void 0) { limit = 50; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    params = {
                        TableName: (0, dynamo_client_1.getTableName)(),
                        IndexName: 'GSI1',
                        KeyConditionExpression: 'GSI1PK = :donorPK',
                        ExpressionAttributeValues: {
                            ':donorPK': types_1.Keys.GSI1.donor(donorId),
                        },
                        Limit: limit,
                        ScanIndexForward: false, // Most recent first
                    };
                    return [4 /*yield*/, dynamo_client_1.docClient.send(new lib_dynamodb_1.QueryCommand(params))];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.Items || []];
            }
        });
    });
}
/**
 * Get donations within a date range (using GSI2)
 * @param orgId - Organization ID
 * @param startDate - Start date (yyyy-mm-dd)
 * @param endDate - End date (yyyy-mm-dd)
 * @param limit - Max number of items to return (default: 100)
 * @returns Array of donations
 */
function getDonationsByDateRange(orgId_1, startDate_1, endDate_1) {
    return __awaiter(this, arguments, void 0, function (orgId, startDate, endDate, limit) {
        var donations, dates, _i, dates_1, date, params, result;
        if (limit === void 0) { limit = 100; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    donations = [];
                    dates = generateDateRange(startDate, endDate);
                    _i = 0, dates_1 = dates;
                    _a.label = 1;
                case 1:
                    if (!(_i < dates_1.length)) return [3 /*break*/, 4];
                    date = dates_1[_i];
                    params = {
                        TableName: (0, dynamo_client_1.getTableName)(),
                        IndexName: 'GSI2',
                        KeyConditionExpression: 'GSI2PK = :datePK',
                        ExpressionAttributeValues: {
                            ':datePK': types_1.Keys.GSI2.date(date),
                        },
                        ScanIndexForward: true, // Oldest first within date
                    };
                    return [4 /*yield*/, dynamo_client_1.docClient.send(new lib_dynamodb_1.QueryCommand(params))];
                case 2:
                    result = _a.sent();
                    if (result.Items && result.Items.length > 0) {
                        donations.push.apply(donations, result.Items);
                    }
                    // Stop if we've reached the limit
                    if (donations.length >= limit) {
                        return [3 /*break*/, 4];
                    }
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, donations.slice(0, limit)];
            }
        });
    });
}
/**
 * Get donations for a specific date (using GSI2)
 * @param orgId - Organization ID
 * @param date - Date (yyyy-mm-dd)
 * @returns Array of donations for that date
 */
function getDonationsByDate(orgId, date) {
    return __awaiter(this, void 0, void 0, function () {
        var params, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    params = {
                        TableName: (0, dynamo_client_1.getTableName)(),
                        IndexName: 'GSI2',
                        KeyConditionExpression: 'GSI2PK = :datePK',
                        ExpressionAttributeValues: {
                            ':datePK': types_1.Keys.GSI2.date(date),
                        },
                        ScanIndexForward: true, // Oldest first
                    };
                    return [4 /*yield*/, dynamo_client_1.docClient.send(new lib_dynamodb_1.QueryCommand(params))];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.Items || []];
            }
        });
    });
}
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Generate array of dates between start and end (inclusive)
 * @param startDate - Start date (yyyy-mm-dd)
 * @param endDate - End date (yyyy-mm-dd)
 * @returns Array of date strings
 */
function generateDateRange(startDate, endDate) {
    var dates = [];
    var start = new Date(startDate);
    var end = new Date(endDate);
    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return [];
    }
    // Generate dates
    var current = new Date(start);
    while (current <= end) {
        var year = current.getFullYear();
        var month = String(current.getMonth() + 1).padStart(2, '0');
        var day = String(current.getDate()).padStart(2, '0');
        dates.push("".concat(year, "-").concat(month, "-").concat(day));
        current.setDate(current.getDate() + 1);
    }
    return dates;
}
