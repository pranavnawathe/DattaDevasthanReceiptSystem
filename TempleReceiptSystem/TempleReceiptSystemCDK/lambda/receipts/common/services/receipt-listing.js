"use strict";
/**
 * Receipt listing and search service
 * Provides multiple query patterns for finding receipts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.listReceiptsByDate = listReceiptsByDate;
exports.listReceiptsByDateRange = listReceiptsByDateRange;
exports.listReceiptsByDonor = listReceiptsByDonor;
exports.listReceiptsByRange = listReceiptsByRange;
exports.getReceiptByNumber = getReceiptByNumber;
exports.searchDonorByIdentifier = searchDonorByIdentifier;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dynamo_client_1 = require("../db/dynamo-client");
const types_1 = require("../types");
const normalizers_1 = require("../utils/normalizers");
const crypto_1 = require("../utils/crypto");
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
async function listReceiptsByDate(orgId, date, params, includeVoided = false) {
    const limit = Math.min(params?.limit || 50, 100);
    const queryParams = {
        TableName: (0, dynamo_client_1.getTableName)(),
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :gsi2pk',
        ExpressionAttributeValues: {
            ':gsi2pk': types_1.Keys.GSI2.date(date),
        },
        Limit: limit,
        ScanIndexForward: false, // Sort descending (newest first)
    };
    if (params?.lastEvaluatedKey) {
        queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(params.lastEvaluatedKey, 'base64').toString());
    }
    const result = await dynamo_client_1.docClient.send(new lib_dynamodb_1.QueryCommand(queryParams));
    let items = (result.Items || []);
    // Filter voided receipts if needed
    if (!includeVoided) {
        items = items.filter((item) => !item.updatedAt || item.pdfKey); // Simple heuristic, better to check status field
    }
    const nextToken = result.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
        : undefined;
    return {
        items,
        nextToken,
        count: items.length,
    };
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
async function listReceiptsByDateRange(orgId, startDate, endDate, params, includeVoided = false) {
    const limit = Math.min(params?.limit || 50, 100);
    // Generate array of dates between start and end
    const dates = generateDateRange(startDate, endDate);
    if (dates.length > 31) {
        throw new Error('Date range too large (max 31 days)');
    }
    // Query each date and collect results
    const allItems = [];
    for (const date of dates) {
        const queryParams = {
            TableName: (0, dynamo_client_1.getTableName)(),
            IndexName: 'GSI2',
            KeyConditionExpression: 'GSI2PK = :gsi2pk',
            ExpressionAttributeValues: {
                ':gsi2pk': types_1.Keys.GSI2.date(date),
            },
            ScanIndexForward: false,
        };
        const result = await dynamo_client_1.docClient.send(new lib_dynamodb_1.QueryCommand(queryParams));
        const items = (result.Items || []);
        allItems.push(...items);
        // Stop if we have enough results
        if (allItems.length >= limit) {
            break;
        }
    }
    // Filter voided if needed
    let filteredItems = allItems;
    if (!includeVoided) {
        filteredItems = allItems.filter((item) => !item.updatedAt || item.pdfKey);
    }
    // Sort by date desc, then receipt number desc
    filteredItems.sort((a, b) => {
        if (a.date !== b.date) {
            return b.date.localeCompare(a.date);
        }
        return b.receiptNo.localeCompare(a.receiptNo);
    });
    // Apply pagination
    const paginatedItems = filteredItems.slice(0, limit);
    return {
        items: paginatedItems,
        nextToken: undefined, // Simplified - not implementing multi-query pagination
        count: paginatedItems.length,
    };
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
async function listReceiptsByDonor(orgId, donorId, params, includeVoided = false) {
    const limit = Math.min(params?.limit || 50, 100);
    const queryParams = {
        TableName: (0, dynamo_client_1.getTableName)(),
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :gsi1pk',
        ExpressionAttributeValues: {
            ':gsi1pk': types_1.Keys.GSI1.donor(donorId),
        },
        Limit: limit,
        ScanIndexForward: false, // Sort descending (newest first)
    };
    if (params?.lastEvaluatedKey) {
        queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(params.lastEvaluatedKey, 'base64').toString());
    }
    const result = await dynamo_client_1.docClient.send(new lib_dynamodb_1.QueryCommand(queryParams));
    let items = (result.Items || []);
    // Filter voided if needed
    if (!includeVoided) {
        items = items.filter((item) => !item.updatedAt || item.pdfKey);
    }
    const nextToken = result.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
        : undefined;
    return {
        items,
        nextToken,
        count: items.length,
    };
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
async function listReceiptsByRange(orgId, rangeId, params, includeVoided = false) {
    const limit = Math.min(params?.limit || 50, 100);
    const queryParams = {
        TableName: (0, dynamo_client_1.getTableName)(),
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
            ':pk': types_1.Keys.PK.org(orgId),
            ':sk': 'RCPT#',
        },
        ScanIndexForward: false, // Sort descending
    };
    if (params?.lastEvaluatedKey) {
        queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(params.lastEvaluatedKey, 'base64').toString());
    }
    const result = await dynamo_client_1.docClient.send(new lib_dynamodb_1.QueryCommand(queryParams));
    let items = (result.Items || []);
    // Filter by rangeId
    items = items.filter((item) => item.rangeId === rangeId);
    // Filter voided if needed
    if (!includeVoided) {
        items = items.filter((item) => !item.updatedAt || item.pdfKey);
    }
    // Apply limit
    const paginatedItems = items.slice(0, limit);
    return {
        items: paginatedItems,
        nextToken: undefined, // Simplified
        count: paginatedItems.length,
    };
}
/**
 * Get a single receipt by receipt number
 *
 * @param orgId - Organization ID
 * @param receiptNo - Receipt number (e.g., "2025-20001")
 * @returns Receipt or null
 */
async function getReceiptByNumber(orgId, receiptNo) {
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
 * Search for donor by identifier (phone, PAN, or email)
 * Uses alias table for lookup
 *
 * @param orgId - Organization ID
 * @param identifier - Phone number, PAN, or email
 * @param type - Type of identifier (optional, auto-detected if not provided)
 * @returns Donor item or null
 */
async function searchDonorByIdentifier(orgId, identifier, type) {
    let sk;
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
            const normalizedPhone = (0, normalizers_1.normalizePhone)(identifier);
            if (!normalizedPhone) {
                return null;
            }
            sk = types_1.Keys.SK.aliasPhone(normalizedPhone);
            break;
        case 'pan':
            const normalizedPAN = (0, normalizers_1.normalizePAN)(identifier);
            if (!normalizedPAN) {
                return null;
            }
            sk = types_1.Keys.SK.aliasPAN((0, crypto_1.hashPAN)(normalizedPAN));
            break;
        case 'email':
            const normalizedEmail = (0, normalizers_1.normalizeEmail)(identifier);
            if (!normalizedEmail) {
                return null;
            }
            sk = types_1.Keys.SK.aliasEmail((0, crypto_1.hashEmail)(normalizedEmail));
            break;
        default:
            throw new Error(`Invalid identifier type: ${type}`);
    }
    // Query alias table
    const aliasParams = {
        TableName: (0, dynamo_client_1.getTableName)(),
        Key: {
            PK: types_1.Keys.PK.org(orgId),
            SK: sk,
        },
    };
    const aliasResult = await dynamo_client_1.docClient.send(new lib_dynamodb_1.GetCommand(aliasParams));
    if (!aliasResult.Item) {
        return null;
    }
    const donorId = aliasResult.Item.donorId;
    // Get donor profile
    const donorParams = {
        TableName: (0, dynamo_client_1.getTableName)(),
        Key: {
            PK: types_1.Keys.PK.org(orgId),
            SK: types_1.Keys.SK.donor(donorId),
        },
    };
    const donorResult = await dynamo_client_1.docClient.send(new lib_dynamodb_1.GetCommand(donorParams));
    return donorResult.Item || null;
}
/**
 * Helper: Generate array of dates between start and end (inclusive)
 */
function generateDateRange(startDate, endDate) {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }
    return dates;
}
