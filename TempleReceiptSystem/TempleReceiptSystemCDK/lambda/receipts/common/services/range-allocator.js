"use strict";
/**
 * Range-based receipt number allocation
 * Replaces the simple year-based counter with range-based allocation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RangeAllocationError = void 0;
exports.getActiveRange = getActiveRange;
exports.allocateFromRange = allocateFromRange;
exports.hasAvailableNumbers = hasAvailableNumbers;
exports.getRemainingInRange = getRemainingInRange;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dynamo_client_1 = require("../db/dynamo-client");
const types_1 = require("../types");
const id_generator_1 = require("../utils/id-generator");
class RangeAllocationError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'RangeAllocationError';
    }
}
exports.RangeAllocationError = RangeAllocationError;
/**
 * Get the active range for a given year
 */
async function getActiveRange(orgId, year) {
    const params = {
        TableName: (0, dynamo_client_1.getTableName)(),
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
            ':pk': types_1.Keys.PK.org(orgId),
            ':sk': 'RANGE#',
        },
    };
    const result = await dynamo_client_1.docClient.send(new lib_dynamodb_1.QueryCommand(params));
    const ranges = (result.Items || []);
    // Find active range for this year
    const activeRange = ranges.find((r) => r.year === year && r.status === types_1.RangeStatus.ACTIVE);
    return activeRange || null;
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
async function allocateFromRange(orgId, year, donationDate, flexibleMode = false) {
    // 1. Find active range for this year
    const activeRange = await getActiveRange(orgId, year);
    if (!activeRange) {
        throw new RangeAllocationError(`No active range found for year ${year}. Please activate a range first.`, 'NO_ACTIVE_RANGE', { year });
    }
    // 2. Check year mismatch (donation year vs range year)
    const donationYear = parseInt(donationDate.split('-')[0], 10);
    if (donationYear !== year) {
        if (!flexibleMode) {
            throw new RangeAllocationError(`Year mismatch: Donation date is ${donationDate} (year ${donationYear}) but active range is for year ${year}. Use flexible mode to override.`, 'YEAR_MISMATCH', { donationYear, rangeYear: year, donationDate, flexibleMode: false });
        }
        console.warn(`⚠️  Year mismatch allowed (flexible mode): donation=${donationYear}, range=${year}`);
    }
    // 3. Check if range is exhausted BEFORE attempting allocation
    if (activeRange.next > activeRange.end) {
        throw new RangeAllocationError(`Range ${activeRange.rangeId} is exhausted. All numbers (${activeRange.start}-${activeRange.end}) have been used.`, 'RANGE_EXHAUSTED', {
            rangeId: activeRange.rangeId,
            start: activeRange.start,
            end: activeRange.end,
            next: activeRange.next,
        });
    }
    // 4. Atomically allocate next number using optimistic locking
    const currentSeq = activeRange.next;
    const newNext = currentSeq + 1;
    const isNowExhausted = newNext > activeRange.end;
    try {
        const updateParams = {
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
        const result = await dynamo_client_1.docClient.send(new lib_dynamodb_1.UpdateCommand(updateParams));
        const updatedRange = result.Attributes;
        // 5. Generate receipt number
        const receiptNo = (0, id_generator_1.generateReceiptNo)(activeRange.year, currentSeq);
        console.log(`✅ Allocated ${receiptNo} from range ${activeRange.rangeId} (${currentSeq}/${activeRange.end})${isNowExhausted ? ' - RANGE EXHAUSTED' : ''}`);
        return {
            receiptNo,
            rangeId: activeRange.rangeId,
            sequenceNumber: currentSeq,
            rangeRemaining: activeRange.end - currentSeq,
        };
    }
    catch (error) {
        // Handle optimistic locking failure (concurrent allocation)
        if (error.name === 'ConditionalCheckFailedException') {
            // Retry logic: fetch fresh range and try again (recursive with limit)
            console.warn('⚠️  Concurrent allocation detected, retrying...');
            // Fetch fresh range state
            const freshRange = await dynamo_client_1.docClient.send(new lib_dynamodb_1.GetCommand({
                TableName: (0, dynamo_client_1.getTableName)(),
                Key: {
                    PK: types_1.Keys.PK.org(orgId),
                    SK: types_1.Keys.SK.range(activeRange.rangeId),
                },
            }));
            if (!freshRange.Item) {
                throw new RangeAllocationError(`Range ${activeRange.rangeId} was deleted during allocation`, 'RANGE_DELETED');
            }
            const updatedRange = freshRange.Item;
            // Check if it's still active
            if (updatedRange.status !== types_1.RangeStatus.ACTIVE) {
                throw new RangeAllocationError(`Range ${activeRange.rangeId} is no longer active (status: ${updatedRange.status})`, 'RANGE_NOT_ACTIVE', { status: updatedRange.status });
            }
            // Check if now exhausted
            if (updatedRange.next > updatedRange.end) {
                throw new RangeAllocationError(`Range ${activeRange.rangeId} became exhausted during concurrent allocation`, 'RANGE_EXHAUSTED', { next: updatedRange.next, end: updatedRange.end });
            }
            // Retry allocation with fresh data (single retry to avoid infinite loop)
            return allocateFromRangeSingleRetry(orgId, updatedRange, donationDate, donationYear, flexibleMode);
        }
        throw error;
    }
}
/**
 * Single retry helper (no further retries to prevent infinite loops)
 */
async function allocateFromRangeSingleRetry(orgId, range, donationDate, donationYear, flexibleMode) {
    const currentSeq = range.next;
    const newNext = currentSeq + 1;
    const isNowExhausted = newNext > range.end;
    const updateParams = {
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
    try {
        const result = await dynamo_client_1.docClient.send(new lib_dynamodb_1.UpdateCommand(updateParams));
        const receiptNo = (0, id_generator_1.generateReceiptNo)(range.year, currentSeq);
        console.log(`✅ Allocated ${receiptNo} from range ${range.rangeId} (retry succeeded)`);
        return {
            receiptNo,
            rangeId: range.rangeId,
            sequenceNumber: currentSeq,
            rangeRemaining: range.end - currentSeq,
        };
    }
    catch (error) {
        if (error.name === 'ConditionalCheckFailedException') {
            throw new RangeAllocationError('Failed to allocate receipt number after retry due to high concurrent load', 'ALLOCATION_CONFLICT');
        }
        throw error;
    }
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
