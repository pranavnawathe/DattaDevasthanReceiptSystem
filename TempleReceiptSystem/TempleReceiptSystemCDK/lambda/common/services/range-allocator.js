"use strict";
/**
 * Range-based receipt number allocation
 * Replaces the simple year-based counter with range-based allocation
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.RangeAllocationError = void 0;
exports.getActiveRange = getActiveRange;
exports.allocateFromRange = allocateFromRange;
exports.hasAvailableNumbers = hasAvailableNumbers;
exports.getRemainingInRange = getRemainingInRange;
var lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
var dynamo_client_1 = require("../db/dynamo-client");
var types_1 = require("../types");
var id_generator_1 = require("../utils/id-generator");
var RangeAllocationError = /** @class */ (function (_super) {
    __extends(RangeAllocationError, _super);
    function RangeAllocationError(message, code, details) {
        var _this = _super.call(this, message) || this;
        _this.code = code;
        _this.details = details;
        _this.name = 'RangeAllocationError';
        return _this;
    }
    return RangeAllocationError;
}(Error));
exports.RangeAllocationError = RangeAllocationError;
/**
 * Get the active range for a given year
 */
function getActiveRange(orgId, year) {
    return __awaiter(this, void 0, void 0, function () {
        var params, result, ranges, activeRange;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    params = {
                        TableName: (0, dynamo_client_1.getTableName)(),
                        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
                        ExpressionAttributeValues: {
                            ':pk': types_1.Keys.PK.org(orgId),
                            ':sk': 'RANGE#',
                        },
                    };
                    return [4 /*yield*/, dynamo_client_1.docClient.send(new lib_dynamodb_1.QueryCommand(params))];
                case 1:
                    result = _a.sent();
                    ranges = (result.Items || []);
                    activeRange = ranges.find(function (r) { return r.year === year && r.status === types_1.RangeStatus.ACTIVE; });
                    return [2 /*return*/, activeRange || null];
            }
        });
    });
}
/**
 * Allocate next receipt number from the active range
 * Uses atomic UpdateCommand with optimistic locking (version field)
 *
 * @param orgId - Organization ID
 * @param year - Donation year
 * @param donationDate - ISO date string (YYYY-MM-DD)
 * @param flexibleMode - Allow year mismatch (admin override)
 * @returns Allocation result with receipt number
 * @throws RangeAllocationError if no active range, exhausted, or year mismatch
 */
function allocateFromRange(orgId_1, year_1, donationDate_1) {
    return __awaiter(this, arguments, void 0, function (orgId, year, donationDate, flexibleMode) {
        var activeRange, donationYear, currentSeq, newNext, isNowExhausted, updateParams, result, updatedRange, receiptNo, error_1, freshRange, updatedRange;
        if (flexibleMode === void 0) { flexibleMode = false; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getActiveRange(orgId, year)];
                case 1:
                    activeRange = _a.sent();
                    if (!activeRange) {
                        throw new RangeAllocationError("No active range found for year ".concat(year, ". Please activate a range first."), 'NO_ACTIVE_RANGE', { year: year });
                    }
                    donationYear = parseInt(donationDate.split('-')[0], 10);
                    if (donationYear !== year) {
                        if (!flexibleMode) {
                            throw new RangeAllocationError("Year mismatch: Donation date is ".concat(donationDate, " (year ").concat(donationYear, ") but active range is for year ").concat(year, ". Use flexible mode to override."), 'YEAR_MISMATCH', { donationYear: donationYear, rangeYear: year, donationDate: donationDate, flexibleMode: false });
                        }
                        console.warn("\u26A0\uFE0F  Year mismatch allowed (flexible mode): donation=".concat(donationYear, ", range=").concat(year));
                    }
                    // 3. Check if range is exhausted BEFORE attempting allocation
                    if (activeRange.next > activeRange.end) {
                        throw new RangeAllocationError("Range ".concat(activeRange.rangeId, " is exhausted. All numbers (").concat(activeRange.start, "-").concat(activeRange.end, ") have been used."), 'RANGE_EXHAUSTED', {
                            rangeId: activeRange.rangeId,
                            start: activeRange.start,
                            end: activeRange.end,
                            next: activeRange.next,
                        });
                    }
                    currentSeq = activeRange.next;
                    newNext = currentSeq + 1;
                    isNowExhausted = newNext > activeRange.end;
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 7]);
                    updateParams = {
                        TableName: (0, dynamo_client_1.getTableName)(),
                        Key: {
                            PK: types_1.Keys.PK.org(orgId),
                            SK: types_1.Keys.SK.range(activeRange.rangeId),
                        },
                        UpdateExpression: 'SET #next = :newNext, #version = #version + :inc, #updatedAt = :now',
                        ExpressionAttributeNames: {
                            '#next': 'next',
                            '#version': 'version',
                            '#updatedAt': 'updatedAt',
                        },
                        ExpressionAttributeValues: {
                            ':newNext': newNext,
                            ':inc': 1,
                            ':now': new Date().toISOString(),
                            ':expectedVersion': activeRange.version,
                            ':currentNext': currentSeq,
                        },
                        // Optimistic locking: only update if version matches and next hasn't changed
                        ConditionExpression: '#version = :expectedVersion AND #next = :currentNext',
                        ReturnValues: 'ALL_NEW',
                    };
                    // If this allocation exhausts the range, also update status
                    if (isNowExhausted) {
                        updateParams.UpdateExpression += ', #status = :exhausted';
                        updateParams.ExpressionAttributeNames['#status'] = 'status';
                        updateParams.ExpressionAttributeValues[':exhausted'] = types_1.RangeStatus.EXHAUSTED;
                    }
                    return [4 /*yield*/, dynamo_client_1.docClient.send(new lib_dynamodb_1.UpdateCommand(updateParams))];
                case 3:
                    result = _a.sent();
                    updatedRange = result.Attributes;
                    receiptNo = (0, id_generator_1.generateReceiptNo)(activeRange.year, currentSeq);
                    console.log("\u2705 Allocated ".concat(receiptNo, " from range ").concat(activeRange.rangeId, " (").concat(currentSeq, "/").concat(activeRange.end, ")").concat(isNowExhausted ? ' - RANGE EXHAUSTED' : ''));
                    return [2 /*return*/, {
                            receiptNo: receiptNo,
                            rangeId: activeRange.rangeId,
                            sequenceNumber: currentSeq,
                            rangeRemaining: activeRange.end - currentSeq,
                        }];
                case 4:
                    error_1 = _a.sent();
                    if (!(error_1.name === 'ConditionalCheckFailedException')) return [3 /*break*/, 6];
                    // Retry logic: fetch fresh range and try again (recursive with limit)
                    console.warn('⚠️  Concurrent allocation detected, retrying...');
                    return [4 /*yield*/, dynamo_client_1.docClient.send(new lib_dynamodb_1.GetCommand({
                            TableName: (0, dynamo_client_1.getTableName)(),
                            Key: {
                                PK: types_1.Keys.PK.org(orgId),
                                SK: types_1.Keys.SK.range(activeRange.rangeId),
                            },
                        }))];
                case 5:
                    freshRange = _a.sent();
                    if (!freshRange.Item) {
                        throw new RangeAllocationError("Range ".concat(activeRange.rangeId, " was deleted during allocation"), 'RANGE_DELETED');
                    }
                    updatedRange = freshRange.Item;
                    // Check if it's still active
                    if (updatedRange.status !== types_1.RangeStatus.ACTIVE) {
                        throw new RangeAllocationError("Range ".concat(activeRange.rangeId, " is no longer active (status: ").concat(updatedRange.status, ")"), 'RANGE_NOT_ACTIVE', { status: updatedRange.status });
                    }
                    // Check if now exhausted
                    if (updatedRange.next > updatedRange.end) {
                        throw new RangeAllocationError("Range ".concat(activeRange.rangeId, " became exhausted during concurrent allocation"), 'RANGE_EXHAUSTED', { next: updatedRange.next, end: updatedRange.end });
                    }
                    // Retry allocation with fresh data (single retry to avoid infinite loop)
                    return [2 /*return*/, allocateFromRangeSingleRetry(orgId, updatedRange, donationDate, donationYear, flexibleMode)];
                case 6: throw error_1;
                case 7: return [2 /*return*/];
            }
        });
    });
}
/**
 * Single retry helper (no further retries to prevent infinite loops)
 */
function allocateFromRangeSingleRetry(orgId, range, donationDate, donationYear, flexibleMode) {
    return __awaiter(this, void 0, void 0, function () {
        var currentSeq, newNext, isNowExhausted, updateParams, result, receiptNo, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    currentSeq = range.next;
                    newNext = currentSeq + 1;
                    isNowExhausted = newNext > range.end;
                    updateParams = {
                        TableName: (0, dynamo_client_1.getTableName)(),
                        Key: {
                            PK: types_1.Keys.PK.org(orgId),
                            SK: types_1.Keys.SK.range(range.rangeId),
                        },
                        UpdateExpression: 'SET #next = :newNext, #version = #version + :inc, #updatedAt = :now',
                        ExpressionAttributeNames: {
                            '#next': 'next',
                            '#version': 'version',
                            '#updatedAt': 'updatedAt',
                        },
                        ExpressionAttributeValues: {
                            ':newNext': newNext,
                            ':inc': 1,
                            ':now': new Date().toISOString(),
                            ':expectedVersion': range.version,
                            ':currentNext': currentSeq,
                        },
                        ConditionExpression: '#version = :expectedVersion AND #next = :currentNext',
                        ReturnValues: 'ALL_NEW',
                    };
                    if (isNowExhausted) {
                        updateParams.UpdateExpression += ', #status = :exhausted';
                        updateParams.ExpressionAttributeNames['#status'] = 'status';
                        updateParams.ExpressionAttributeValues[':exhausted'] = types_1.RangeStatus.EXHAUSTED;
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, dynamo_client_1.docClient.send(new lib_dynamodb_1.UpdateCommand(updateParams))];
                case 2:
                    result = _a.sent();
                    receiptNo = (0, id_generator_1.generateReceiptNo)(range.year, currentSeq);
                    console.log("\u2705 Allocated ".concat(receiptNo, " from range ").concat(range.rangeId, " (retry succeeded)"));
                    return [2 /*return*/, {
                            receiptNo: receiptNo,
                            rangeId: range.rangeId,
                            sequenceNumber: currentSeq,
                            rangeRemaining: range.end - currentSeq,
                        }];
                case 3:
                    error_2 = _a.sent();
                    if (error_2.name === 'ConditionalCheckFailedException') {
                        throw new RangeAllocationError('Failed to allocate receipt number after retry due to high concurrent load', 'ALLOCATION_CONFLICT');
                    }
                    throw error_2;
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Check if a range has available numbers
 */
function hasAvailableNumbers(range) {
    return range.next <= range.end;
}
/**
 * Get remaining count for a range
 */
function getRemainingInRange(range) {
    return Math.max(0, range.end - range.next + 1);
}
