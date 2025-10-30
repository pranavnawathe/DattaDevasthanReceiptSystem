"use strict";
/**
 * Donation service - orchestrates the full donation creation flow
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDonation = createDonation;
var lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
var dynamo_client_1 = require("../db/dynamo-client");
var range_allocator_1 = require("./range-allocator");
var donor_resolver_1 = require("./donor-resolver");
var types_1 = require("../types");
var normalizers_1 = require("../utils/normalizers");
var crypto_1 = require("../utils/crypto");
/**
 * Create a new donation and receipt
 * This is the main orchestration function that:
 * 1. Validates input
 * 2. Resolves/creates donor
 * 3. Gets next receipt number
 * 4. Creates donation record
 * 5. Upserts donor profile
 * 6. Creates alias records
 *
 * @param orgId - Organization ID
 * @param request - Create receipt request
 * @returns Create receipt response with receipt number and details
 */
function createDonation(orgId, request) {
    return __awaiter(this, void 0, void 0, function () {
        var startTime, normalizedPhone, normalizedPAN, normalizedEmail, total, donorResolution, donorId, isNew, existingProfile, donationDate, currentYear, allocation, error_1, receiptNo, rangeId, donationItem, lifetimeTotal, donationCount, donorItem, aliasItems, transactItems, error_2, response;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    startTime = Date.now();
                    // 1. Validate input
                    (0, donor_resolver_1.validateDonorInfo)(request.donor);
                    validateBreakup(request.breakup);
                    validatePayment(request.payment);
                    normalizedPhone = (0, normalizers_1.normalizePhone)(request.donor.mobile);
                    normalizedPAN = (0, normalizers_1.normalizePAN)(request.donor.pan);
                    normalizedEmail = (0, normalizers_1.normalizeEmail)(request.donor.email);
                    total = Object.values(request.breakup).reduce(function (sum, amount) {
                        var normalized = (0, normalizers_1.normalizeAmount)(amount);
                        if (normalized === null) {
                            throw new Error("Invalid amount: ".concat(amount));
                        }
                        return sum + normalized;
                    }, 0);
                    if (total <= 0) {
                        throw new Error('Total donation amount must be greater than zero');
                    }
                    return [4 /*yield*/, (0, donor_resolver_1.resolveDonor)(orgId, request.donor)];
                case 1:
                    donorResolution = _b.sent();
                    donorId = donorResolution.donorId, isNew = donorResolution.isNew, existingProfile = donorResolution.existingProfile;
                    donationDate = (0, normalizers_1.normalizeDate)(request.date) || (0, normalizers_1.getTodayISO)();
                    currentYear = new Date().getFullYear();
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, (0, range_allocator_1.allocateFromRange)(orgId, currentYear, donationDate, request.flexibleMode || false)];
                case 3:
                    allocation = _b.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _b.sent();
                    if (error_1 instanceof range_allocator_1.RangeAllocationError) {
                        throw new Error("Receipt allocation failed: ".concat(error_1.message, " (").concat(error_1.code, ")"));
                    }
                    throw error_1;
                case 5:
                    receiptNo = allocation.receiptNo;
                    rangeId = allocation.rangeId;
                    console.log("Creating donation: ".concat(receiptNo, " from range ").concat(rangeId, " for donor: ").concat(donorId, " (isNew: ").concat(isNew, ")"));
                    donationItem = {
                        PK: types_1.Keys.PK.org(orgId),
                        SK: types_1.Keys.SK.receipt(receiptNo),
                        GSI1PK: types_1.Keys.GSI1.donor(donorId),
                        GSI1SK: types_1.Keys.GSI1.donorReceipt(donationDate, receiptNo),
                        GSI2PK: types_1.Keys.GSI2.date(donationDate),
                        GSI2SK: types_1.Keys.GSI2.receipt(receiptNo),
                        orgId: orgId,
                        receiptNo: receiptNo,
                        rangeId: rangeId,
                        date: donationDate,
                        donorId: donorId,
                        donor: {
                            name: request.donor.name,
                            mobile: normalizedPhone || undefined,
                            email: normalizedEmail || undefined,
                            pan: normalizedPAN ? (0, crypto_1.maskPAN)(normalizedPAN) : undefined,
                            address: request.donor.address,
                        },
                        breakup: request.breakup,
                        payment: request.payment,
                        eligible80G: (_a = request.eligible80G) !== null && _a !== void 0 ? _a : true,
                        total: total,
                        createdAt: startTime,
                    };
                    lifetimeTotal = isNew ? total : ((existingProfile === null || existingProfile === void 0 ? void 0 : existingProfile.stats.lifetimeTotal) || 0) + total;
                    donationCount = isNew ? 1 : ((existingProfile === null || existingProfile === void 0 ? void 0 : existingProfile.stats.count) || 0) + 1;
                    donorItem = {
                        PK: types_1.Keys.PK.org(orgId),
                        SK: types_1.Keys.SK.donor(donorId),
                        donorId: donorId,
                        primary: {
                            name: request.donor.name,
                            mobile: normalizedPhone || undefined,
                            email: normalizedEmail || undefined,
                            pan: normalizedPAN ? (0, crypto_1.maskPAN)(normalizedPAN) : undefined,
                        },
                        ids: {
                            panHash: normalizedPAN ? (0, crypto_1.hashPAN)(normalizedPAN) : undefined,
                            emailHash: normalizedEmail ? (0, crypto_1.hashEmail)(normalizedEmail) : undefined,
                            phoneE164: normalizedPhone || undefined,
                        },
                        stats: {
                            lifetimeTotal: lifetimeTotal,
                            lastDonationDate: donationDate,
                            count: donationCount,
                        },
                        address: request.donor.address,
                        meta: {
                            createdAt: (existingProfile === null || existingProfile === void 0 ? void 0 : existingProfile.meta.createdAt) || startTime,
                            updatedAt: startTime,
                        },
                    };
                    aliasItems = [];
                    if (isNew) {
                        // Create all alias items for new donor
                        if (normalizedPhone) {
                            aliasItems.push({
                                PK: types_1.Keys.PK.org(orgId),
                                SK: types_1.Keys.SK.aliasPhone(normalizedPhone),
                                donorId: donorId,
                                createdAt: startTime,
                            });
                        }
                        if (normalizedPAN) {
                            aliasItems.push({
                                PK: types_1.Keys.PK.org(orgId),
                                SK: types_1.Keys.SK.aliasPAN((0, crypto_1.hashPAN)(normalizedPAN)),
                                donorId: donorId,
                                createdAt: startTime,
                            });
                        }
                        if (normalizedEmail) {
                            aliasItems.push({
                                PK: types_1.Keys.PK.org(orgId),
                                SK: types_1.Keys.SK.aliasEmail((0, crypto_1.hashEmail)(normalizedEmail)),
                                donorId: donorId,
                                createdAt: startTime,
                            });
                        }
                    }
                    _b.label = 6;
                case 6:
                    _b.trys.push([6, 8, , 9]);
                    transactItems = __spreadArray([
                        // Always write donation item
                        {
                            Put: {
                                TableName: (0, dynamo_client_1.getTableName)(),
                                Item: donationItem,
                            },
                        },
                        // Always upsert donor profile
                        {
                            Put: {
                                TableName: (0, dynamo_client_1.getTableName)(),
                                Item: donorItem,
                            },
                        }
                    ], aliasItems.map(function (alias) { return ({
                        Put: {
                            TableName: (0, dynamo_client_1.getTableName)(),
                            Item: alias,
                            ConditionExpression: 'attribute_not_exists(PK)', // Prevent overwriting existing aliases
                        },
                    }); }), true);
                    return [4 /*yield*/, dynamo_client_1.docClient.send(new lib_dynamodb_1.TransactWriteCommand({
                            TransactItems: transactItems,
                        }))];
                case 7:
                    _b.sent();
                    console.log("\u2705 Donation created successfully: ".concat(receiptNo));
                    return [3 /*break*/, 9];
                case 8:
                    error_2 = _b.sent();
                    console.error('❌ Failed to create donation:', error_2);
                    throw new Error("Failed to create donation: ".concat(error_2.message));
                case 9:
                    response = {
                        success: true,
                        receiptNo: receiptNo,
                        donorId: donorId,
                        total: total,
                        createdAt: startTime,
                    };
                    return [2 /*return*/, response];
            }
        });
    });
}
/**
 * Validate donation breakup
 */
function validateBreakup(breakup) {
    if (!breakup || Object.keys(breakup).length === 0) {
        throw new Error('At least one donation purpose is required');
    }
    for (var _i = 0, _a = Object.entries(breakup); _i < _a.length; _i++) {
        var _b = _a[_i], purpose = _b[0], amount = _b[1];
        var normalized = (0, normalizers_1.normalizeAmount)(amount);
        if (normalized === null || normalized <= 0) {
            throw new Error("Invalid amount for ".concat(purpose, ": ").concat(amount));
        }
    }
}
/**
 * Validate payment information
 */
function validatePayment(payment) {
    if (!payment || !payment.mode) {
        throw new Error('Payment mode is required');
    }
    var validModes = ['CASH', 'UPI', 'CHEQUE', 'NEFT', 'RTGS', 'CARD', 'ONLINE'];
    if (!validModes.includes(payment.mode.toUpperCase())) {
        throw new Error("Invalid payment mode. Must be one of: ".concat(validModes.join(', ')));
    }
}
