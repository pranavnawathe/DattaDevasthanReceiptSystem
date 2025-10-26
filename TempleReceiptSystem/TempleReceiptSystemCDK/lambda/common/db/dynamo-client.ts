/**
 * DynamoDB client configuration
 * Shared instance for all Lambda functions
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

/**
 * Base DynamoDB client
 */
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
});

/**
 * DynamoDB Document Client with marshalling
 * Use this for all DynamoDB operations
 */
export const docClient = DynamoDBDocumentClient.from(dynamoClient, {
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
export function getTableName(): string {
  const tableName = process.env.DONATIONS_TABLE_NAME;
  if (!tableName) {
    throw new Error('DONATIONS_TABLE_NAME environment variable not set');
  }
  return tableName;
}

/**
 * Get receipts bucket name from environment variable
 * @returns S3 bucket name for receipts
 */
export function getReceiptsBucketName(): string {
  const bucketName = process.env.RECEIPTS_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('RECEIPTS_BUCKET_NAME environment variable not set');
  }
  return bucketName;
}

/**
 * Get exports bucket name from environment variable
 * @returns S3 bucket name for exports
 */
export function getExportsBucketName(): string {
  const bucketName = process.env.EXPORTS_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('EXPORTS_BUCKET_NAME environment variable not set');
  }
  return bucketName;
}
