"use strict";
/**
 * DynamoDB query operations
 * All database read operations for the Temple Receipt System
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAliasByPhone = getAliasByPhone;
exports.getAliasByPAN = getAliasByPAN;
exports.getAliasByEmail = getAliasByEmail;
exports.getDonorProfile = getDonorProfile;
exports.getDonationByReceiptNo = getDonationByReceiptNo;
exports.getDonationsByDonor = getDonationsByDonor;
exports.getDonationsByDateRange = getDonationsByDateRange;
exports.getDonationsByDate = getDonationsByDate;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dynamo_client_1 = require("./dynamo-client");
const types_1 = require("../types");
// ============================================================================
// Alias Queries
// ============================================================================
/**
 * Get donor ID by phone number (via alias lookup)
 * @param orgId - Organization ID
 * @param phone - Normalized phone (E.164)
 * @returns Donor ID or null if not found
 */
async function getAliasByPhone(orgId, phone) {
    const params = {
        TableName: (0, dynamo_client_1.getTableName)(),
        Key: {
            PK: types_1.Keys.PK.org(orgId),
            SK: types_1.Keys.SK.aliasPhone(phone),
        },
    };
    const result = await dynamo_client_1.docClient.send(new lib_dynamodb_1.GetCommand(params));
    const item = result.Item;
    return item?.donorId || null;
}
/**
 * Get donor ID by PAN hash (via alias lookup)
 * @param orgId - Organization ID
 * @param panHash - Hashed PAN
 * @returns Donor ID or null if not found
 */
async function getAliasByPAN(orgId, panHash) {
    const params = {
        TableName: (0, dynamo_client_1.getTableName)(),
        Key: {
            PK: types_1.Keys.PK.org(orgId),
            SK: types_1.Keys.SK.aliasPAN(panHash),
        },
    };
    const result = await dynamo_client_1.docClient.send(new lib_dynamodb_1.GetCommand(params));
    const item = result.Item;
    return item?.donorId || null;
}
/**
 * Get donor ID by email hash (via alias lookup)
 * @param orgId - Organization ID
 * @param emailHash - Hashed email
 * @returns Donor ID or null if not found
 */
async function getAliasByEmail(orgId, emailHash) {
    const params = {
        TableName: (0, dynamo_client_1.getTableName)(),
        Key: {
            PK: types_1.Keys.PK.org(orgId),
            SK: types_1.Keys.SK.aliasEmail(emailHash),
        },
    };
    const result = await dynamo_client_1.docClient.send(new lib_dynamodb_1.GetCommand(params));
    const item = result.Item;
    return item?.donorId || null;
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
async function getDonorProfile(orgId, donorId) {
    const params = {
        TableName: (0, dynamo_client_1.getTableName)(),
        Key: {
            PK: types_1.Keys.PK.org(orgId),
            SK: types_1.Keys.SK.donor(donorId),
        },
    };
    const result = await dynamo_client_1.docClient.send(new lib_dynamodb_1.GetCommand(params));
    return result.Item || null;
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
async function getDonationByReceiptNo(orgId, receiptNo) {
    const params = {
        TableName: (0, dynamo_client_1.getTableName)(),
        Key: {
            PK: types_1.Keys.PK.org(orgId),
            SK: types_1.Keys.SK.receipt(receiptNo),
        },
    };
    const result = await dynamo_client_1.docClient.send(new lib_dynamodb_1.GetCommand(params));
    return result.Item || null;
}
/**
 * Get all donations for a donor (using GSI1)
 * @param donorId - Donor ID
 * @param limit - Max number of items to return (default: 50)
 * @returns Array of donations
 */
async function getDonationsByDonor(donorId, limit = 50) {
    const params = {
        TableName: (0, dynamo_client_1.getTableName)(),
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :donorPK',
        ExpressionAttributeValues: {
            ':donorPK': types_1.Keys.GSI1.donor(donorId),
        },
        Limit: limit,
        ScanIndexForward: false, // Most recent first
    };
    const result = await dynamo_client_1.docClient.send(new lib_dynamodb_1.QueryCommand(params));
    return result.Items || [];
}
/**
 * Get donations within a date range (using GSI2)
 * @param orgId - Organization ID
 * @param startDate - Start date (yyyy-mm-dd)
 * @param endDate - End date (yyyy-mm-dd)
 * @param limit - Max number of items to return (default: 100)
 * @returns Array of donations
 */
async function getDonationsByDateRange(orgId, startDate, endDate, limit = 100) {
    // For date range query, we need to query each date
    // This is a simplified version - in production, consider pagination
    const donations = [];
    // Generate all dates in range
    const dates = generateDateRange(startDate, endDate);
    for (const date of dates) {
        const params = {
            TableName: (0, dynamo_client_1.getTableName)(),
            IndexName: 'GSI2',
            KeyConditionExpression: 'GSI2PK = :datePK',
            ExpressionAttributeValues: {
                ':datePK': types_1.Keys.GSI2.date(date),
            },
            ScanIndexForward: true, // Oldest first within date
        };
        const result = await dynamo_client_1.docClient.send(new lib_dynamodb_1.QueryCommand(params));
        if (result.Items && result.Items.length > 0) {
            donations.push(...result.Items);
        }
        // Stop if we've reached the limit
        if (donations.length >= limit) {
            break;
        }
    }
    return donations.slice(0, limit);
}
/**
 * Get donations for a specific date (using GSI2)
 * @param orgId - Organization ID
 * @param date - Date (yyyy-mm-dd)
 * @returns Array of donations for that date
 */
async function getDonationsByDate(orgId, date) {
    const params = {
        TableName: (0, dynamo_client_1.getTableName)(),
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :datePK',
        ExpressionAttributeValues: {
            ':datePK': types_1.Keys.GSI2.date(date),
        },
        ScanIndexForward: true, // Oldest first
    };
    const result = await dynamo_client_1.docClient.send(new lib_dynamodb_1.QueryCommand(params));
    return result.Items || [];
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
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return [];
    }
    // Generate dates
    const current = new Date(start);
    while (current <= end) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
        current.setDate(current.getDate() + 1);
    }
    return dates;
}
//# sourceMappingURL=queries.js.map