"use strict";
/**
 * Donor resolution service
 * Finds existing donors or creates new donor IDs based on identifiers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveDonor = resolveDonor;
exports.validateDonorInfo = validateDonorInfo;
const normalizers_1 = require("../utils/normalizers");
const crypto_1 = require("../utils/crypto");
const id_generator_1 = require("../utils/id-generator");
const queries_1 = require("../db/queries");
/**
 * Resolve donor ID from donor information
 * Checks aliases in priority order: Phone > PAN > Email
 * If no existing donor found, generates new stable donor ID
 *
 * @param orgId - Organization ID
 * @param donorInfo - Donor information from request
 * @returns Donor resolution result with donorId and whether it's new
 */
async function resolveDonor(orgId, donorInfo) {
    // Normalize all identifiers
    const normalizedPhone = (0, normalizers_1.normalizePhone)(donorInfo.mobile);
    const normalizedPAN = (0, normalizers_1.normalizePAN)(donorInfo.pan);
    const normalizedEmail = (0, normalizers_1.normalizeEmail)(donorInfo.email);
    const normalizedName = (0, normalizers_1.normalizeName)(donorInfo.name);
    if (!normalizedName) {
        throw new Error('Donor name is required');
    }
    // Try to find existing donor by checking aliases in priority order
    let donorId = null;
    let existingProfile = null;
    // 1. Check phone alias (most reliable)
    if (normalizedPhone) {
        donorId = await (0, queries_1.getAliasByPhone)(orgId, normalizedPhone);
        if (donorId) {
            console.log(`Found existing donor by phone: ${donorId}`);
        }
    }
    // 2. Check PAN alias (if not found by phone)
    if (!donorId && normalizedPAN) {
        const panHash = (0, crypto_1.hashPAN)(normalizedPAN);
        donorId = await (0, queries_1.getAliasByPAN)(orgId, panHash);
        if (donorId) {
            console.log(`Found existing donor by PAN: ${donorId}`);
        }
    }
    // 3. Check email alias (if not found by phone or PAN)
    if (!donorId && normalizedEmail) {
        const emailHash = (0, crypto_1.hashEmail)(normalizedEmail);
        donorId = await (0, queries_1.getAliasByEmail)(orgId, emailHash);
        if (donorId) {
            console.log(`Found existing donor by email: ${donorId}`);
        }
    }
    // If found, fetch existing profile
    if (donorId) {
        existingProfile = await (0, queries_1.getDonorProfile)(orgId, donorId);
        return {
            donorId,
            isNew: false,
            existingProfile: existingProfile || undefined,
        };
    }
    // No existing donor found - generate new stable donor ID
    const newDonorId = (0, id_generator_1.generateDonorId)(normalizedPAN || undefined, normalizedPhone || undefined, normalizedEmail || undefined, orgId);
    console.log(`Creating new donor: ${newDonorId}`);
    return {
        donorId: newDonorId,
        isNew: true,
        existingProfile: undefined,
    };
}
/**
 * Validate donor information
 * Ensures all required fields are present and valid
 *
 * @param donorInfo - Donor information to validate
 * @throws Error if validation fails
 */
function validateDonorInfo(donorInfo) {
    const normalizedName = (0, normalizers_1.normalizeName)(donorInfo.name);
    if (!normalizedName) {
        throw new Error('Donor name is required');
    }
    // At least one contact method should be provided
    const hasPhone = (0, normalizers_1.normalizePhone)(donorInfo.mobile) !== null;
    const hasEmail = (0, normalizers_1.normalizeEmail)(donorInfo.email) !== null;
    const hasPAN = (0, normalizers_1.normalizePAN)(donorInfo.pan) !== null;
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
//# sourceMappingURL=donor-resolver.js.map