"use strict";
/**
 * DynamoDB client configuration
 * Shared instance for all Lambda functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.docClient = void 0;
exports.getTableName = getTableName;
exports.getReceiptsBucketName = getReceiptsBucketName;
exports.getExportsBucketName = getExportsBucketName;
var client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
var lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
/**
 * Base DynamoDB client
 */
var dynamoClient = new client_dynamodb_1.DynamoDBClient({
    region: process.env.AWS_REGION || 'ap-south-1',
});
/**
 * DynamoDB Document Client with marshalling
 * Use this for all DynamoDB operations
 */
exports.docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient, {
    marshallOptions: {
        // Convert empty strings to null (required for DynamoDB)
        convertEmptyValues: false,
        // Remove undefined values
        removeUndefinedValues: true,
        // Convert class instances to maps
        convertClassInstanceToMap: false,
    },
    unmarshallOptions: {
        // Return numbers as JavaScript numbers (not strings)
        wrapNumbers: false,
    },
});
/**
 * Get table name from environment variable
 * @returns DynamoDB table name
 */
function getTableName() {
    var tableName = process.env.DONATIONS_TABLE_NAME;
    if (!tableName) {
        throw new Error('DONATIONS_TABLE_NAME environment variable not set');
    }
    return tableName;
}
/**
 * Get receipts bucket name from environment variable
 * @returns S3 bucket name for receipts
 */
function getReceiptsBucketName() {
    var bucketName = process.env.RECEIPTS_BUCKET_NAME;
    if (!bucketName) {
        throw new Error('RECEIPTS_BUCKET_NAME environment variable not set');
    }
    return bucketName;
}
/**
 * Get exports bucket name from environment variable
 * @returns S3 bucket name for exports
 */
function getExportsBucketName() {
    var bucketName = process.env.EXPORTS_BUCKET_NAME;
    if (!bucketName) {
        throw new Error('EXPORTS_BUCKET_NAME environment variable not set');
    }
    return bucketName;
}
