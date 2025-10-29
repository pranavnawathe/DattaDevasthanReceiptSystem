"use strict";
/**
 * Donation service - orchestrates the full donation creation flow
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDonation = createDonation;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dynamo_client_1 = require("../db/dynamo-client");
const range_allocator_1 = require("./range-allocator");
const donor_resolver_1 = require("./donor-resolver");
const types_1 = require("../types");
const normalizers_1 = require("../utils/normalizers");
const crypto_1 = require("../utils/crypto");
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
async function createDonation(orgId, request) {
    const startTime = Date.now();
    // 1. Validate input
    (0, donor_resolver_1.validateDonorInfo)(request.donor);
    validateBreakup(request.breakup);
    validatePayment(request.payment);
    // 2. Normalize donor information
    const normalizedPhone = (0, normalizers_1.normalizePhone)(request.donor.mobile);
    const normalizedPAN = (0, normalizers_1.normalizePAN)(request.donor.pan);
    const normalizedEmail = (0, normalizers_1.normalizeEmail)(request.donor.email);
    // 3. Calculate total
    const total = Object.values(request.breakup).reduce((sum, amount) => {
        const normalized = (0, normalizers_1.normalizeAmount)(amount);
        if (normalized === null) {
            throw new Error(`Invalid amount: ${amount}`);
        }
        return sum + normalized;
    }, 0);
    if (total <= 0) {
        throw new Error('Total donation amount must be greater than zero');
    }
    // 4. Resolve donor (existing or new)
    const donorResolution = await (0, donor_resolver_1.resolveDonor)(orgId, request.donor);
    const { donorId, isNew, existingProfile } = donorResolution;
    // 5. Get donation date (use provided or today)
    const donationDate = (0, normalizers_1.normalizeDate)(request.date) || (0, normalizers_1.getTodayISO)();
    // 6. Get current year for range lookup
    const currentYear = new Date().getFullYear();
    // 7. Allocate receipt number from active range
    let allocation;
    try {
        allocation = await (0, range_allocator_1.allocateFromRange)(orgId, currentYear, donationDate, request.flexibleMode || false);
    }
    catch (error) {
        if (error instanceof range_allocator_1.RangeAllocationError) {
            throw new Error(`Receipt allocation failed: ${error.message} (${error.code})`);
        }
        throw error;
    }
    const receiptNo = allocation.receiptNo;
    const rangeId = allocation.rangeId;
    console.log(`Creating donation: ${receiptNo} from range ${rangeId} for donor: ${donorId} (isNew: ${isNew})`);
    // 7. Build donation item
    const donationItem = {
        PK: types_1.Keys.PK.org(orgId),
        SK: types_1.Keys.SK.receipt(receiptNo),
        GSI1PK: types_1.Keys.GSI1.donor(donorId),
        GSI1SK: types_1.Keys.GSI1.donorReceipt(donationDate, receiptNo),
        GSI2PK: types_1.Keys.GSI2.date(donationDate),
        GSI2SK: types_1.Keys.GSI2.receipt(receiptNo),
        orgId,
        receiptNo,
        rangeId,
        date: donationDate,
        donorId,
        donor: {
            name: request.donor.name,
            mobile: normalizedPhone || undefined,
            email: normalizedEmail || undefined,
            pan: normalizedPAN ? (0, crypto_1.maskPAN)(normalizedPAN) : undefined,
            address: request.donor.address,
        },
        breakup: request.breakup,
        payment: request.payment,
        eligible80G: request.eligible80G ?? true,
        total,
        createdAt: startTime,
    };
    // 8. Build donor profile (new or updated)
    const lifetimeTotal = isNew ? total : (existingProfile?.stats.lifetimeTotal || 0) + total;
    const donationCount = isNew ? 1 : (existingProfile?.stats.count || 0) + 1;
    const donorItem = {
        PK: types_1.Keys.PK.org(orgId),
        SK: types_1.Keys.SK.donor(donorId),
        donorId,
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
            lifetimeTotal,
            lastDonationDate: donationDate,
            count: donationCount,
        },
        address: request.donor.address,
        meta: {
            createdAt: existingProfile?.meta.createdAt || startTime,
            updatedAt: startTime,
        },
    };
    // 9. Build alias items (only for new donors or new identifiers)
    const aliasItems = [];
    if (isNew) {
        // Create all alias items for new donor
        if (normalizedPhone) {
            aliasItems.push({
                PK: types_1.Keys.PK.org(orgId),
                SK: types_1.Keys.SK.aliasPhone(normalizedPhone),
                donorId,
                createdAt: startTime,
            });
        }
        if (normalizedPAN) {
            aliasItems.push({
                PK: types_1.Keys.PK.org(orgId),
                SK: types_1.Keys.SK.aliasPAN((0, crypto_1.hashPAN)(normalizedPAN)),
                donorId,
                createdAt: startTime,
            });
        }
        if (normalizedEmail) {
            aliasItems.push({
                PK: types_1.Keys.PK.org(orgId),
                SK: types_1.Keys.SK.aliasEmail((0, crypto_1.hashEmail)(normalizedEmail)),
                donorId,
                createdAt: startTime,
            });
        }
    }
    // 10. Write to DynamoDB using transaction
    try {
        const transactItems = [
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
            },
            // Add alias items for new donors
            ...aliasItems.map(alias => ({
                Put: {
                    TableName: (0, dynamo_client_1.getTableName)(),
                    Item: alias,
                    ConditionExpression: 'attribute_not_exists(PK)', // Prevent overwriting existing aliases
                },
            })),
        ];
        await dynamo_client_1.docClient.send(new lib_dynamodb_1.TransactWriteCommand({
            TransactItems: transactItems,
        }));
        console.log(`✅ Donation created successfully: ${receiptNo}`);
    }
    catch (error) {
        console.error('❌ Failed to create donation:', error);
        throw new Error(`Failed to create donation: ${error.message}`);
    }
    // 11. Return response
    const response = {
        success: true,
        receiptNo,
        donorId,
        total,
        createdAt: startTime,
    };
    return response;
}
/**
 * Validate donation breakup
 */
function validateBreakup(breakup) {
    if (!breakup || Object.keys(breakup).length === 0) {
        throw new Error('At least one donation purpose is required');
    }
    for (const [purpose, amount] of Object.entries(breakup)) {
        const normalized = (0, normalizers_1.normalizeAmount)(amount);
        if (normalized === null || normalized <= 0) {
            throw new Error(`Invalid amount for ${purpose}: ${amount}`);
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
    const validModes = ['CASH', 'UPI', 'CHEQUE', 'NEFT', 'RTGS', 'CARD', 'ONLINE'];
    if (!validModes.includes(payment.mode.toUpperCase())) {
        throw new Error(`Invalid payment mode. Must be one of: ${validModes.join(', ')}`);
    }
}
