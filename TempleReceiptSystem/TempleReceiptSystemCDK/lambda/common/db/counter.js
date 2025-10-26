"use strict";
/**
 * Receipt counter management using DynamoDB atomic operations
 * Ensures unique sequential receipt numbers per year
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextReceiptNumber = getNextReceiptNumber;
exports.getCurrentCounter = getCurrentCounter;
exports.resetCounter = resetCounter;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dynamo_client_1 = require("./dynamo-client");
const types_1 = require("../types");
const id_generator_1 = require("../utils/id-generator");
/**
 * Get the next receipt number for the given year
 * Uses DynamoDB atomic counter to ensure uniqueness
 *
 * Item structure:
 * - PK: ORG#<orgId>
 * - SK: COUNTER#RECEIPT#<year>
 * - year: <year>
 * - currentSeq: <current sequence number>
 * - updatedAt: <timestamp>
 *
 * @param orgId - Organization ID
 * @param year - Receipt year (e.g., 2025)
 * @returns Next receipt number (e.g., "2025-00071")
 */
async function getNextReceiptNumber(orgId, year) {
    const params = {
        TableName: (0, dynamo_client_1.getTableName)(),
        Key: {
            PK: types_1.Keys.PK.org(orgId),
            SK: types_1.Keys.SK.counter(year),
        },
        UpdateExpression: 'SET currentSeq = if_not_exists(currentSeq, :zero) + :inc, updatedAt = :now, #year = if_not_exists(#year, :year)',
        ExpressionAttributeNames: {
            '#year': 'year',
        },
        ExpressionAttributeValues: {
            ':zero': 0,
            ':inc': 1,
            ':now': Date.now(),
            ':year': year,
        },
        ReturnValues: 'UPDATED_NEW',
    };
    const result = await dynamo_client_1.docClient.send(new lib_dynamodb_1.UpdateCommand(params));
    // Get the new sequence number
    const newSeq = result.Attributes?.currentSeq;
    if (!newSeq) {
        throw new Error('Failed to get next receipt number');
    }
    // Format as receipt number
    return (0, id_generator_1.generateReceiptNo)(year, newSeq);
}
/**
 * Get current receipt counter value (without incrementing)
 * Useful for reporting/debugging
 *
 * @param orgId - Organization ID
 * @param year - Receipt year
 * @returns Current sequence number (0 if not initialized)
 */
async function getCurrentCounter(orgId, year) {
    const { GetCommand } = await Promise.resolve().then(() => __importStar(require('@aws-sdk/lib-dynamodb')));
    const params = {
        TableName: (0, dynamo_client_1.getTableName)(),
        Key: {
            PK: types_1.Keys.PK.org(orgId),
            SK: types_1.Keys.SK.counter(year),
        },
    };
    const result = await dynamo_client_1.docClient.send(new GetCommand(params));
    return result.Item?.currentSeq || 0;
}
/**
 * Reset counter for a year (USE WITH CAUTION)
 * This should only be used in testing or very special circumstances
 *
 * @param orgId - Organization ID
 * @param year - Receipt year
 * @param newValue - New counter value (default: 0)
 */
async function resetCounter(orgId, year, newValue = 0) {
    const { PutCommand } = await Promise.resolve().then(() => __importStar(require('@aws-sdk/lib-dynamodb')));
    const params = {
        TableName: (0, dynamo_client_1.getTableName)(),
        Item: {
            PK: types_1.Keys.PK.org(orgId),
            SK: types_1.Keys.SK.counter(year),
            year,
            currentSeq: newValue,
            updatedAt: Date.now(),
        },
    };
    await dynamo_client_1.docClient.send(new PutCommand(params));
}
//# sourceMappingURL=counter.js.map