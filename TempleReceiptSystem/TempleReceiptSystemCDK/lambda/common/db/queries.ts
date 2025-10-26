/**
 * DynamoDB query operations
 * All database read operations for the Temple Receipt System
 */

import { GetCommand, QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { docClient, getTableName } from './dynamo-client';
import { AliasItem, DonationItem, DonorItem, Keys } from '../types';

// ============================================================================
// Alias Queries
// ============================================================================

/**
 * Get donor ID by phone number (via alias lookup)
 * @param orgId - Organization ID
 * @param phone - Normalized phone (E.164)
 * @returns Donor ID or null if not found
 */
export async function getAliasByPhone(orgId: string, phone: string): Promise<string | null> {
  const params = {
    TableName: getTableName(),
    Key: {
      PK: Keys.PK.org(orgId),
      SK: Keys.SK.aliasPhone(phone),
    },
  };

  const result = await docClient.send(new GetCommand(params));
  const item = result.Item as AliasItem | undefined;

  return item?.donorId || null;
}

/**
 * Get donor ID by PAN hash (via alias lookup)
 * @param orgId - Organization ID
 * @param panHash - Hashed PAN
 * @returns Donor ID or null if not found
 */
export async function getAliasByPAN(orgId: string, panHash: string): Promise<string | null> {
  const params = {
    TableName: getTableName(),
    Key: {
      PK: Keys.PK.org(orgId),
      SK: Keys.SK.aliasPAN(panHash),
    },
  };

  const result = await docClient.send(new GetCommand(params));
  const item = result.Item as AliasItem | undefined;

  return item?.donorId || null;
}

/**
 * Get donor ID by email hash (via alias lookup)
 * @param orgId - Organization ID
 * @param emailHash - Hashed email
 * @returns Donor ID or null if not found
 */
export async function getAliasByEmail(orgId: string, emailHash: string): Promise<string | null> {
  const params = {
    TableName: getTableName(),
    Key: {
      PK: Keys.PK.org(orgId),
      SK: Keys.SK.aliasEmail(emailHash),
    },
  };

  const result = await docClient.send(new GetCommand(params));
  const item = result.Item as AliasItem | undefined;

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
export async function getDonorProfile(orgId: string, donorId: string): Promise<DonorItem | null> {
  const params = {
    TableName: getTableName(),
    Key: {
      PK: Keys.PK.org(orgId),
      SK: Keys.SK.donor(donorId),
    },
  };

  const result = await docClient.send(new GetCommand(params));
  return (result.Item as DonorItem) || null;
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
export async function getDonationByReceiptNo(
  orgId: string,
  receiptNo: string
): Promise<DonationItem | null> {
  const params = {
    TableName: getTableName(),
    Key: {
      PK: Keys.PK.org(orgId),
      SK: Keys.SK.receipt(receiptNo),
    },
  };

  const result = await docClient.send(new GetCommand(params));
  return (result.Item as DonationItem) || null;
}

/**
 * Get all donations for a donor (using GSI1)
 * @param donorId - Donor ID
 * @param limit - Max number of items to return (default: 50)
 * @returns Array of donations
 */
export async function getDonationsByDonor(
  donorId: string,
  limit: number = 50
): Promise<DonationItem[]> {
  const params: QueryCommandInput = {
    TableName: getTableName(),
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :donorPK',
    ExpressionAttributeValues: {
      ':donorPK': Keys.GSI1.donor(donorId),
    },
    Limit: limit,
    ScanIndexForward: false, // Most recent first
  };

  const result = await docClient.send(new QueryCommand(params));
  return (result.Items as DonationItem[]) || [];
}

/**
 * Get donations within a date range (using GSI2)
 * @param orgId - Organization ID
 * @param startDate - Start date (yyyy-mm-dd)
 * @param endDate - End date (yyyy-mm-dd)
 * @param limit - Max number of items to return (default: 100)
 * @returns Array of donations
 */
export async function getDonationsByDateRange(
  orgId: string,
  startDate: string,
  endDate: string,
  limit: number = 100
): Promise<DonationItem[]> {
  // For date range query, we need to query each date
  // This is a simplified version - in production, consider pagination
  const donations: DonationItem[] = [];

  // Generate all dates in range
  const dates = generateDateRange(startDate, endDate);

  for (const date of dates) {
    const params: QueryCommandInput = {
      TableName: getTableName(),
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :datePK',
      ExpressionAttributeValues: {
        ':datePK': Keys.GSI2.date(date),
      },
      ScanIndexForward: true, // Oldest first within date
    };

    const result = await docClient.send(new QueryCommand(params));
    if (result.Items && result.Items.length > 0) {
      donations.push(...(result.Items as DonationItem[]));
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
export async function getDonationsByDate(orgId: string, date: string): Promise<DonationItem[]> {
  const params: QueryCommandInput = {
    TableName: getTableName(),
    IndexName: 'GSI2',
    KeyConditionExpression: 'GSI2PK = :datePK',
    ExpressionAttributeValues: {
      ':datePK': Keys.GSI2.date(date),
    },
    ScanIndexForward: true, // Oldest first
  };

  const result = await docClient.send(new QueryCommand(params));
  return (result.Items as DonationItem[]) || [];
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
function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
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
