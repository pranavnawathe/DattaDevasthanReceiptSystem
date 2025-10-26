/**
 * Receipt counter management using DynamoDB atomic operations
 * Ensures unique sequential receipt numbers per year
 */

import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, getTableName } from './dynamo-client';
import { Keys } from '../types';
import { generateReceiptNo } from '../utils/id-generator';

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
export async function getNextReceiptNumber(orgId: string, year: number): Promise<string> {
  const params = {
    TableName: getTableName(),
    Key: {
      PK: Keys.PK.org(orgId),
      SK: Keys.SK.counter(year),
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
    ReturnValues: 'UPDATED_NEW' as const,
  };

  const result = await docClient.send(new UpdateCommand(params));

  // Get the new sequence number
  const newSeq = result.Attributes?.currentSeq as number;

  if (!newSeq) {
    throw new Error('Failed to get next receipt number');
  }

  // Format as receipt number
  return generateReceiptNo(year, newSeq);
}

/**
 * Get current receipt counter value (without incrementing)
 * Useful for reporting/debugging
 *
 * @param orgId - Organization ID
 * @param year - Receipt year
 * @returns Current sequence number (0 if not initialized)
 */
export async function getCurrentCounter(orgId: string, year: number): Promise<number> {
  const { GetCommand } = await import('@aws-sdk/lib-dynamodb');

  const params = {
    TableName: getTableName(),
    Key: {
      PK: Keys.PK.org(orgId),
      SK: Keys.SK.counter(year),
    },
  };

  const result = await docClient.send(new GetCommand(params));

  return (result.Item?.currentSeq as number) || 0;
}

/**
 * Reset counter for a year (USE WITH CAUTION)
 * This should only be used in testing or very special circumstances
 *
 * @param orgId - Organization ID
 * @param year - Receipt year
 * @param newValue - New counter value (default: 0)
 */
export async function resetCounter(
  orgId: string,
  year: number,
  newValue: number = 0
): Promise<void> {
  const { PutCommand } = await import('@aws-sdk/lib-dynamodb');

  const params = {
    TableName: getTableName(),
    Item: {
      PK: Keys.PK.org(orgId),
      SK: Keys.SK.counter(year),
      year,
      currentSeq: newValue,
      updatedAt: Date.now(),
    },
  };

  await docClient.send(new PutCommand(params));
}
