"use strict";
/**
 * Donor resolution service
 * Finds existing donors or creates new donor IDs based on identifiers
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
exports.resolveDonor = resolveDonor;
exports.validateDonorInfo = validateDonorInfo;
var normalizers_1 = require("../utils/normalizers");
var crypto_1 = require("../utils/crypto");
var id_generator_1 = require("../utils/id-generator");
var queries_1 = require("../db/queries");
/**
 * Resolve donor ID from donor information
 * Checks aliases in priority order: Phone > PAN > Email
 * If no existing donor found, generates new stable donor ID
 *
 * @param orgId - Organization ID
 * @param donorInfo - Donor information from request
 * @returns Donor resolution result with donorId and whether it's new
 */
function resolveDonor(orgId, donorInfo) {
    return __awaiter(this, void 0, void 0, function () {
        var normalizedPhone, normalizedPAN, normalizedEmail, normalizedName, donorId, existingProfile, panHash, emailHash, newDonorId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    normalizedPhone = (0, normalizers_1.normalizePhone)(donorInfo.mobile);
                    normalizedPAN = (0, normalizers_1.normalizePAN)(donorInfo.pan);
                    normalizedEmail = (0, normalizers_1.normalizeEmail)(donorInfo.email);
                    normalizedName = (0, normalizers_1.normalizeName)(donorInfo.name);
                    if (!normalizedName) {
                        throw new Error('Donor name is required');
                    }
                    donorId = null;
                    existingProfile = null;
                    if (!normalizedPhone) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, queries_1.getAliasByPhone)(orgId, normalizedPhone)];
                case 1:
                    donorId = _a.sent();
                    if (donorId) {
                        console.log("Found existing donor by phone: ".concat(donorId));
                    }
                    _a.label = 2;
                case 2:
                    if (!(!donorId && normalizedPAN)) return [3 /*break*/, 4];
                    panHash = (0, crypto_1.hashPAN)(normalizedPAN);
                    return [4 /*yield*/, (0, queries_1.getAliasByPAN)(orgId, panHash)];
                case 3:
                    donorId = _a.sent();
                    if (donorId) {
                        console.log("Found existing donor by PAN: ".concat(donorId));
                    }
                    _a.label = 4;
                case 4:
                    if (!(!donorId && normalizedEmail)) return [3 /*break*/, 6];
                    emailHash = (0, crypto_1.hashEmail)(normalizedEmail);
                    return [4 /*yield*/, (0, queries_1.getAliasByEmail)(orgId, emailHash)];
                case 5:
                    donorId = _a.sent();
                    if (donorId) {
                        console.log("Found existing donor by email: ".concat(donorId));
                    }
                    _a.label = 6;
                case 6:
                    if (!donorId) return [3 /*break*/, 8];
                    return [4 /*yield*/, (0, queries_1.getDonorProfile)(orgId, donorId)];
                case 7:
                    existingProfile = _a.sent();
                    return [2 /*return*/, {
                            donorId: donorId,
                            isNew: false,
                            existingProfile: existingProfile || undefined,
                        }];
                case 8:
                    newDonorId = (0, id_generator_1.generateDonorId)(normalizedPAN || undefined, normalizedPhone || undefined, normalizedEmail || undefined, orgId);
                    console.log("Creating new donor: ".concat(newDonorId));
                    return [2 /*return*/, {
                            donorId: newDonorId,
                            isNew: true,
                            existingProfile: undefined,
                        }];
            }
        });
    });
}
/**
 * Validate donor information
 * Ensures all required fields are present and valid
 *
 * @param donorInfo - Donor information to validate
 * @throws Error if validation fails
 */
function validateDonorInfo(donorInfo) {
    var normalizedName = (0, normalizers_1.normalizeName)(donorInfo.name);
    if (!normalizedName) {
        throw new Error('Donor name is required');
    }
    // At least one contact method should be provided
    var hasPhone = (0, normalizers_1.normalizePhone)(donorInfo.mobile) !== null;
    var hasEmail = (0, normalizers_1.normalizeEmail)(donorInfo.email) !== null;
    var hasPAN = (0, normalizers_1.normalizePAN)(donorInfo.pan) !== null;
    if (!hasPhone && !hasEmail && !hasPAN) {
        throw new Error('At least one of phone, email, or PAN must be provided');
    }
    // Validate PAN format if provided
    if (donorInfo.pan && !hasPAN) {
        throw new Error('Invalid PAN format. Expected: ABCDE1234F');
    }
    // Validate phone format if provided
    if (donorInfo.mobile && !hasPhone) {
        throw new Error('Invalid phone number. Expected: 10-digit Indian mobile');
    }
    // Validate email format if provided
    if (donorInfo.email && !hasEmail) {
        throw new Error('Invalid email format');
    }
}
