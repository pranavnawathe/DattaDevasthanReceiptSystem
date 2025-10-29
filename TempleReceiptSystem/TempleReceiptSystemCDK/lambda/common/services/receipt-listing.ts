/**
 * Receipt listing and search service
 * Provides multiple query patterns for finding receipts
 */

import { QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, getTableName } from '../db/dynamo-client';
import { DonationItem, DonorItem, Keys, PaginationParams, PaginatedResponse } from '../types';
import { normalizePhone, normalizeEmail, normalizePAN } from '../utils/normalizers';
import { hashPAN, hashEmail } from '../utils/crypto';

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
export async function listReceiptsByDate(
  orgId: string,
  date: string,
  params?: PaginationParams,
  includeVoided: boolean = false
): Promise<PaginatedResponse<DonationItem>> {
  const limit = Math.min(params?.limit || 50, 100);

  const queryParams: any = {
    TableName: getTableName(),
    IndexName: 'GSI2',
    KeyConditionExpression: 'GSI2PK = :gsi2pk',
    ExpressionAttributeValues: {
      ':gsi2pk': Keys.GSI2.date(date),
    },
    Limit: limit,
    ScanIndexForward: false, // Sort descending (newest first)
  };

  if (params?.lastEvaluatedKey) {
    queryParams.ExclusiveStartKey = JSON.parse(
      Buffer.from(params.lastEvaluatedKey, 'base64').toString()
    );
  }

  const result = await docClient.send(new QueryCommand(queryParams));
  let items = (result.Items || []) as DonationItem[];

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
export async function listReceiptsByDateRange(
  orgId: string,
  startDate: string,
  endDate: string,
  params?: PaginationParams,
  includeVoided: boolean = false
): Promise<PaginatedResponse<DonationItem>> {
  const limit = Math.min(params?.limit || 50, 100);

  // Generate array of dates between start and end
  const dates = generateDateRange(startDate, endDate);

  if (dates.length > 31) {
    throw new Error('Date range too large (max 31 days)');
  }

  // Query each date and collect results
  const allItems: DonationItem[] = [];

  for (const date of dates) {
    const queryParams: any = {
      TableName: getTableName(),
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :gsi2pk',
      ExpressionAttributeValues: {
        ':gsi2pk': Keys.GSI2.date(date),
      },
      ScanIndexForward: false,
    };

    const result = await docClient.send(new QueryCommand(queryParams));
    const items = (result.Items || []) as DonationItem[];
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
export async function listReceiptsByDonor(
  orgId: string,
  donorId: string,
  params?: PaginationParams,
  includeVoided: boolean = false
): Promise<PaginatedResponse<DonationItem>> {
  const limit = Math.min(params?.limit || 50, 100);

  const queryParams: any = {
    TableName: getTableName(),
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :gsi1pk',
    ExpressionAttributeValues: {
      ':gsi1pk': Keys.GSI1.donor(donorId),
    },
    Limit: limit,
    ScanIndexForward: false, // Sort descending (newest first)
  };

  if (params?.lastEvaluatedKey) {
    queryParams.ExclusiveStartKey = JSON.parse(
      Buffer.from(params.lastEvaluatedKey, 'base64').toString()
    );
  }

  const result = await docClient.send(new QueryCommand(queryParams));
  let items = (result.Items || []) as DonationItem[];

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
export async function listReceiptsByRange(
  orgId: string,
  rangeId: string,
  params?: PaginationParams,
  includeVoided: boolean = false
): Promise<PaginatedResponse<DonationItem>> {
  const limit = Math.min(params?.limit || 50, 100);

  const queryParams: any = {
    TableName: getTableName(),
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': Keys.PK.org(orgId),
      ':sk': 'RCPT#',
    },
    ScanIndexForward: false, // Sort descending
  };

  if (params?.lastEvaluatedKey) {
    queryParams.ExclusiveStartKey = JSON.parse(
      Buffer.from(params.lastEvaluatedKey, 'base64').toString()
    );
  }

  const result = await docClient.send(new QueryCommand(queryParams));
  let items = (result.Items || []) as DonationItem[];

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
export async function getReceiptByNumber(
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
 * Search for donor by identifier (phone, PAN, or email)
 * Uses alias table for lookup
 *
 * @param orgId - Organization ID
 * @param identifier - Phone number, PAN, or email
 * @param type - Type of identifier (optional, auto-detected if not provided)
 * @returns Donor item or null
 */
export async function searchDonorByIdentifier(
  orgId: string,
  identifier: string,
  type?: 'phone' | 'pan' | 'email'
): Promise<DonorItem | null> {
  let sk: string;

  // Auto-detect type if not provided
  if (!type) {
    if (identifier.match(/^[+]?[0-9]{10,15}$/)) {
      type = 'phone';
    } else if (identifier.match(/^[A-Z]{5}[0-9]{4}[A-Z]$/i)) {
      type = 'pan';
    } else if (identifier.includes('@')) {
      type = 'email';
    } else {
      throw new Error('Cannot auto-detect identifier type. Please specify type parameter.');
    }
  }

  // Build SK based on type
  switch (type) {
    case 'phone':
      const normalizedPhone = normalizePhone(identifier);
      if (!normalizedPhone) {
        return null;
      }
      sk = Keys.SK.aliasPhone(normalizedPhone);
      break;

    case 'pan':
      const normalizedPAN = normalizePAN(identifier);
      if (!normalizedPAN) {
        return null;
      }
      sk = Keys.SK.aliasPAN(hashPAN(normalizedPAN));
      break;

    case 'email':
      const normalizedEmail = normalizeEmail(identifier);
      if (!normalizedEmail) {
        return null;
      }
      sk = Keys.SK.aliasEmail(hashEmail(normalizedEmail));
      break;

    default:
      throw new Error(`Invalid identifier type: ${type}`);
  }

  // Query alias table
  const aliasParams = {
    TableName: getTableName(),
    Key: {
      PK: Keys.PK.org(orgId),
      SK: sk,
    },
  };

  const aliasResult = await docClient.send(new GetCommand(aliasParams));

  if (!aliasResult.Item) {
    return null;
  }

  const donorId = (aliasResult.Item as any).donorId;

  // Get donor profile
  const donorParams = {
    TableName: getTableName(),
    Key: {
      PK: Keys.PK.org(orgId),
      SK: Keys.SK.donor(donorId),
    },
  };

  const donorResult = await docClient.send(new GetCommand(donorParams));
  return (donorResult.Item as DonorItem) || null;
}

/**
 * Helper: Generate array of dates between start and end (inclusive)
 */
function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}
