"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const types_1 = require("../common/types");
const range_utils_1 = require("../common/range-utils");
// Organization ID (hardcoded for now, will come from auth context later)
const ORG_ID = 'DATTA-SAKHARAPA';
const TABLE_NAME = process.env.TABLE_NAME || 'FoundationStack-DonationsTable';
// Initialize DynamoDB client
const client = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
/**
 * Helper to create JSON response
 */
function json(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(body),
    };
}
/**
 * List ranges with optional filters
 * GET /ranges?status=active&year=2025
 */
async function listRanges(queryParams) {
    const { status, year } = queryParams;
    const params = {
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
            ':pk': types_1.Keys.PK.org(ORG_ID),
            ':sk': 'RANGE#',
        },
    };
    const result = await docClient.send(new lib_dynamodb_1.QueryCommand(params));
    let ranges = (result.Items || []);
    // Apply filters
    if (status) {
        ranges = ranges.filter((r) => r.status === status);
    }
    if (year) {
        const yearNum = parseInt(year, 10);
        ranges = ranges.filter((r) => r.year === yearNum);
    }
    // Add computed fields
    const enrichedRanges = ranges.map((range) => ({
        ...range,
        remaining: (0, range_utils_1.getRemainingCount)(range),
    }));
    // Sort by year (desc) then alias
    enrichedRanges.sort((a, b) => {
        if (a.year !== b.year) {
            return b.year - a.year; // Newest first
        }
        return a.alias.localeCompare(b.alias);
    });
    return json(200, {
        success: true,
        ranges: enrichedRanges,
        count: enrichedRanges.length,
    });
}
/**
 * Get single range by ID
 * GET /ranges/{rangeId}
 */
async function getRange(rangeId) {
    if (!(0, range_utils_1.validateRangeId)(rangeId)) {
        return json(400, {
            success: false,
            error: 'Invalid range ID format (expected: YYYY-X)',
        });
    }
    const params = {
        TableName: TABLE_NAME,
        Key: {
            PK: types_1.Keys.PK.org(ORG_ID),
            SK: types_1.Keys.SK.range(rangeId),
        },
    };
    const result = await docClient.send(new lib_dynamodb_1.GetCommand(params));
    if (!result.Item) {
        return json(404, {
            success: false,
            error: `Range ${rangeId} not found`,
        });
    }
    const range = result.Item;
    return json(200, {
        success: true,
        range: {
            ...range,
            remaining: (0, range_utils_1.getRemainingCount)(range),
        },
    });
}
/**
 * Check if a new range overlaps with any existing ranges for the same year
 */
async function checkRangeOverlap(year, start, end) {
    // Get all ranges for this year (excluding archived)
    const params = {
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
            ':pk': types_1.Keys.PK.org(ORG_ID),
            ':sk': 'RANGE#',
        },
    };
    const result = await docClient.send(new lib_dynamodb_1.QueryCommand(params));
    const ranges = (result.Items || []);
    // Filter to same year and non-archived
    const yearRanges = ranges.filter((r) => r.year === year && r.status !== types_1.RangeStatus.ARCHIVED);
    // Check for overlaps
    for (const existing of yearRanges) {
        // Overlap occurs if:
        // - new range starts within existing range: start <= new.start <= end
        // - new range ends within existing range: start <= new.end <= end
        // - new range completely contains existing range: new.start <= start AND new.end >= end
        const hasOverlap = (start >= existing.start && start <= existing.end) || // New start overlaps
            (end >= existing.start && end <= existing.end) || // New end overlaps
            (start <= existing.start && end >= existing.end); // New contains existing
        if (hasOverlap) {
            return existing;
        }
    }
    return null;
}
/**
 * Check if there's already an active range for the given year
 */
async function getActiveRange(year) {
    const params = {
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
            ':pk': types_1.Keys.PK.org(ORG_ID),
            ':sk': 'RANGE#',
        },
    };
    const result = await docClient.send(new lib_dynamodb_1.QueryCommand(params));
    const ranges = (result.Items || []);
    // Find active range for this year
    const activeRange = ranges.find((r) => r.year === year && r.status === types_1.RangeStatus.ACTIVE);
    return activeRange || null;
}
/**
 * Create new range
 * POST /ranges
 */
async function createRange(body) {
    const payload = JSON.parse(body);
    const { alias, year, start, end, suffix } = payload;
    // Validate required fields
    if (!alias || !year || start === undefined || end === undefined) {
        return json(400, {
            success: false,
            error: 'Missing required fields: alias, year, start, end',
        });
    }
    // Generate range ID (or use provided suffix)
    const rangeId = suffix ? (0, range_utils_1.generateRangeId)(year, suffix) : (0, range_utils_1.generateRangeId)(year, 'A');
    // Check if range already exists
    const existingRange = await docClient.send(new lib_dynamodb_1.GetCommand({
        TableName: TABLE_NAME,
        Key: {
            PK: types_1.Keys.PK.org(ORG_ID),
            SK: types_1.Keys.SK.range(rangeId),
        },
    }));
    if (existingRange.Item) {
        return json(409, {
            success: false,
            error: `Range ${rangeId} already exists`,
            code: 'RANGE_EXISTS',
        });
    }
    // Check for overlapping ranges
    const overlappingRange = await checkRangeOverlap(year, start, end);
    if (overlappingRange) {
        return json(409, {
            success: false,
            error: `Range ${start}-${end} overlaps with existing range ${overlappingRange.rangeId} (${overlappingRange.start}-${overlappingRange.end})`,
            code: 'RANGE_OVERLAP',
            conflictingRange: {
                rangeId: overlappingRange.rangeId,
                alias: overlappingRange.alias,
                start: overlappingRange.start,
                end: overlappingRange.end,
            },
        });
    }
    // Create range item
    const now = new Date().toISOString();
    const newRange = {
        PK: types_1.Keys.PK.org(ORG_ID),
        SK: types_1.Keys.SK.range(rangeId),
        type: 'range',
        rangeId,
        alias,
        year,
        start,
        end,
        next: start, // Start from beginning
        status: types_1.RangeStatus.DRAFT,
        version: 1,
        createdBy: payload.createdBy || 'system',
        createdAt: now,
    };
    // Validate
    try {
        (0, range_utils_1.validateRange)(newRange);
    }
    catch (error) {
        if (error instanceof range_utils_1.RangeValidationError) {
            return json(400, {
                success: false,
                error: error.message,
                code: error.code,
            });
        }
        throw error;
    }
    // Save to DynamoDB
    await docClient.send(new lib_dynamodb_1.PutCommand({
        TableName: TABLE_NAME,
        Item: newRange,
        ConditionExpression: 'attribute_not_exists(PK)',
    }));
    console.log(`✅ Range created: ${rangeId}`);
    return json(201, {
        success: true,
        range: {
            ...newRange,
            remaining: (0, range_utils_1.getRemainingCount)(newRange),
        },
        message: `Range ${rangeId} created successfully`,
    });
}
/**
 * Update range status
 * PUT /ranges/{rangeId}/status
 */
async function updateRangeStatus(rangeId, body) {
    if (!(0, range_utils_1.validateRangeId)(rangeId)) {
        return json(400, {
            success: false,
            error: 'Invalid range ID format',
        });
    }
    const payload = JSON.parse(body);
    const { action, userId } = payload;
    // Get current range
    const result = await docClient.send(new lib_dynamodb_1.GetCommand({
        TableName: TABLE_NAME,
        Key: {
            PK: types_1.Keys.PK.org(ORG_ID),
            SK: types_1.Keys.SK.range(rangeId),
        },
    }));
    if (!result.Item) {
        return json(404, {
            success: false,
            error: `Range ${rangeId} not found`,
        });
    }
    const range = result.Item;
    let newStatus;
    const now = new Date().toISOString();
    // Determine new status based on action
    switch (action) {
        case 'activate':
            if (!(0, range_utils_1.canActivateRange)(range)) {
                return json(400, {
                    success: false,
                    error: `Cannot activate range with status ${range.status}`,
                    code: 'INVALID_STATUS_TRANSITION',
                });
            }
            // Check if there's already an active range for this year
            const existingActive = await getActiveRange(range.year);
            if (existingActive) {
                return json(409, {
                    success: false,
                    error: `Cannot activate ${rangeId}: Range ${existingActive.rangeId} is already active for year ${range.year}. Please lock it first.`,
                    code: 'ACTIVE_RANGE_EXISTS',
                    activeRange: {
                        rangeId: existingActive.rangeId,
                        alias: existingActive.alias,
                        start: existingActive.start,
                        end: existingActive.end,
                    },
                });
            }
            newStatus = types_1.RangeStatus.ACTIVE;
            break;
        case 'lock':
            if (!(0, range_utils_1.canLockRange)(range)) {
                return json(400, {
                    success: false,
                    error: `Cannot lock range with status ${range.status}`,
                    code: 'INVALID_STATUS_TRANSITION',
                });
            }
            newStatus = types_1.RangeStatus.LOCKED;
            break;
        case 'unlock':
            if (!(0, range_utils_1.canUnlockRange)(range)) {
                return json(400, {
                    success: false,
                    error: `Cannot unlock range with status ${range.status}`,
                    code: 'INVALID_STATUS_TRANSITION',
                });
            }
            newStatus = types_1.RangeStatus.ACTIVE;
            break;
        case 'archive':
            newStatus = types_1.RangeStatus.ARCHIVED;
            break;
        default:
            return json(400, {
                success: false,
                error: `Invalid action: ${action}. Valid actions: activate, lock, unlock, archive`,
            });
    }
    // Update range status
    const updateParams = {
        TableName: TABLE_NAME,
        Key: {
            PK: types_1.Keys.PK.org(ORG_ID),
            SK: types_1.Keys.SK.range(rangeId),
        },
        UpdateExpression: 'SET #status = :status, #updatedAt = :updatedAt, #version = #version + :inc',
        ExpressionAttributeNames: {
            '#status': 'status',
            '#updatedAt': 'updatedAt',
            '#version': 'version',
        },
        ExpressionAttributeValues: {
            ':status': newStatus,
            ':updatedAt': now,
            ':inc': 1,
            ':expectedVersion': range.version,
        },
        ConditionExpression: '#version = :expectedVersion',
        ReturnValues: 'ALL_NEW',
    };
    // Add lock metadata if locking
    if (action === 'lock' && userId) {
        updateParams.UpdateExpression += ', #lockedBy = :lockedBy, #lockedAt = :lockedAt';
        updateParams.ExpressionAttributeNames['#lockedBy'] = 'lockedBy';
        updateParams.ExpressionAttributeNames['#lockedAt'] = 'lockedAt';
        updateParams.ExpressionAttributeValues[':lockedBy'] = userId;
        updateParams.ExpressionAttributeValues[':lockedAt'] = now;
    }
    try {
        const updateResult = await docClient.send(new lib_dynamodb_1.UpdateCommand(updateParams));
        const updatedRange = updateResult.Attributes;
        console.log(`✅ Range ${rangeId} status updated: ${range.status} → ${newStatus}`);
        return json(200, {
            success: true,
            range: {
                ...updatedRange,
                remaining: (0, range_utils_1.getRemainingCount)(updatedRange),
            },
            message: `Range ${rangeId} ${action}d successfully`,
        });
    }
    catch (error) {
        if (error.name === 'ConditionalCheckFailedException') {
            return json(409, {
                success: false,
                error: 'Range was modified by another request. Please retry.',
                code: 'VERSION_CONFLICT',
            });
        }
        throw error;
    }
}
/**
 * Main Lambda handler
 */
const handler = async (event) => {
    const { method, path } = {
        method: event.requestContext.http.method,
        path: event.rawPath,
    };
    console.log(`${method} ${path}`, { queryParams: event.queryStringParameters });
    try {
        // GET /ranges - List ranges
        if (method === 'GET' && path === '/ranges') {
            return await listRanges(event.queryStringParameters || {});
        }
        // GET /ranges/{rangeId} - Get single range
        if (method === 'GET' && path.match(/^\/ranges\/[^/]+$/)) {
            const rangeId = path.split('/')[2];
            return await getRange(rangeId);
        }
        // POST /ranges - Create new range
        if (method === 'POST' && path === '/ranges') {
            if (!event.body) {
                return json(400, { success: false, error: 'Request body is required' });
            }
            return await createRange(event.body);
        }
        // PUT /ranges/{rangeId}/status - Update range status
        if (method === 'PUT' && path.match(/^\/ranges\/[^/]+\/status$/)) {
            const rangeId = path.split('/')[2];
            if (!event.body) {
                return json(400, { success: false, error: 'Request body is required' });
            }
            return await updateRangeStatus(rangeId, event.body);
        }
        // Route not found
        return json(404, { success: false, error: 'Not found' });
    }
    catch (error) {
        console.error('❌ Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return json(500, {
            success: false,
            error: errorMessage,
        });
    }
};
exports.handler = handler;
