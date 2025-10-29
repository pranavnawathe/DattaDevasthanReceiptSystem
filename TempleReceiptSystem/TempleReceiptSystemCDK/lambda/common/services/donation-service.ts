/**
 * Donation service - orchestrates the full donation creation flow
 */

import { PutCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, getTableName } from '../db/dynamo-client';
import { allocateFromRange, RangeAllocationError } from './range-allocator';
import { resolveDonor, validateDonorInfo } from './donor-resolver';
import { CreateReceiptRequest, CreateReceiptResponse, DonationItem, DonorItem, AliasItem, Keys } from '../types';
import { normalizePhone, normalizeEmail, normalizePAN, normalizeDate, getTodayISO, normalizeAmount } from '../utils/normalizers';
import { hashPAN, hashEmail, maskPAN } from '../utils/crypto';

/**
 * Create a new donation and receipt
 * This is the main orchestration function that:
 * 1. Validates input
 * 2. Resolves/creates donor
 * 3. Gets next receipt number
 * 4. Creates donation record
 * 5. Upserts donor profile
 * 6. Creates alias records
 *
 * @param orgId - Organization ID
 * @param request - Create receipt request
 * @returns Create receipt response with receipt number and details
 */
export async function createDonation(
  orgId: string,
  request: CreateReceiptRequest
): Promise<CreateReceiptResponse> {
  const startTime = Date.now();

  // 1. Validate input
  validateDonorInfo(request.donor);
  validateBreakup(request.breakup);
  validatePayment(request.payment);

  // 2. Normalize donor information
  const normalizedPhone = normalizePhone(request.donor.mobile);
  const normalizedPAN = normalizePAN(request.donor.pan);
  const normalizedEmail = normalizeEmail(request.donor.email);

  // 3. Calculate total
  const total = Object.values(request.breakup).reduce((sum, amount) => {
    const normalized = normalizeAmount(amount);
    if (normalized === null) {
      throw new Error(`Invalid amount: ${amount}`);
    }
    return sum + normalized;
  }, 0);

  if (total <= 0) {
    throw new Error('Total donation amount must be greater than zero');
  }

  // 4. Resolve donor (existing or new)
  const donorResolution = await resolveDonor(orgId, request.donor);
  const { donorId, isNew, existingProfile } = donorResolution;

  // 5. Get donation date (use provided or today)
  const donationDate = normalizeDate(request.date) || getTodayISO();

  // 6. Get current year for range lookup
  const currentYear = new Date().getFullYear();

  // 7. Allocate receipt number from active range
  let allocation;
  try {
    allocation = await allocateFromRange(orgId, currentYear, donationDate, request.flexibleMode || false);
  } catch (error) {
    if (error instanceof RangeAllocationError) {
      throw new Error(`Receipt allocation failed: ${error.message} (${error.code})`);
    }
    throw error;
  }

  const receiptNo = allocation.receiptNo;
  const rangeId = allocation.rangeId;

  console.log(`Creating donation: ${receiptNo} from range ${rangeId} for donor: ${donorId} (isNew: ${isNew})`);

  // 7. Build donation item
  const donationItem: DonationItem = {
    PK: Keys.PK.org(orgId),
    SK: Keys.SK.receipt(receiptNo),
    GSI1PK: Keys.GSI1.donor(donorId),
    GSI1SK: Keys.GSI1.donorReceipt(donationDate, receiptNo),
    GSI2PK: Keys.GSI2.date(donationDate),
    GSI2SK: Keys.GSI2.receipt(receiptNo),
    orgId,
    receiptNo,
    rangeId,
    date: donationDate,
    donorId,
    donor: {
      name: request.donor.name,
      mobile: normalizedPhone || undefined,
      email: normalizedEmail || undefined,
      pan: normalizedPAN ? maskPAN(normalizedPAN) : undefined,
      address: request.donor.address,
    },
    breakup: request.breakup,
    payment: request.payment,
    eligible80G: request.eligible80G ?? true,
    total,
    createdAt: startTime,
  };

  // 8. Build donor profile (new or updated)
  const lifetimeTotal = isNew ? total : (existingProfile?.stats.lifetimeTotal || 0) + total;
  const donationCount = isNew ? 1 : (existingProfile?.stats.count || 0) + 1;

  const donorItem: DonorItem = {
    PK: Keys.PK.org(orgId),
    SK: Keys.SK.donor(donorId),
    donorId,
    primary: {
      name: request.donor.name,
      mobile: normalizedPhone || undefined,
      email: normalizedEmail || undefined,
      pan: normalizedPAN ? maskPAN(normalizedPAN) : undefined,
    },
    ids: {
      panHash: normalizedPAN ? hashPAN(normalizedPAN) : undefined,
      emailHash: normalizedEmail ? hashEmail(normalizedEmail) : undefined,
      phoneE164: normalizedPhone || undefined,
    },
    stats: {
      lifetimeTotal,
      lastDonationDate: donationDate,
      count: donationCount,
    },
    address: request.donor.address,
    meta: {
      createdAt: existingProfile?.meta.createdAt || startTime,
      updatedAt: startTime,
    },
  };

  // 9. Build alias items (only for new donors or new identifiers)
  const aliasItems: AliasItem[] = [];

  if (isNew) {
    // Create all alias items for new donor
    if (normalizedPhone) {
      aliasItems.push({
        PK: Keys.PK.org(orgId),
        SK: Keys.SK.aliasPhone(normalizedPhone),
        donorId,
        createdAt: startTime,
      });
    }

    if (normalizedPAN) {
      aliasItems.push({
        PK: Keys.PK.org(orgId),
        SK: Keys.SK.aliasPAN(hashPAN(normalizedPAN)),
        donorId,
        createdAt: startTime,
      });
    }

    if (normalizedEmail) {
      aliasItems.push({
        PK: Keys.PK.org(orgId),
        SK: Keys.SK.aliasEmail(hashEmail(normalizedEmail)),
        donorId,
        createdAt: startTime,
      });
    }
  }

  // 10. Write to DynamoDB using transaction
  try {
    const transactItems = [
      // Always write donation item
      {
        Put: {
          TableName: getTableName(),
          Item: donationItem,
        },
      },
      // Always upsert donor profile
      {
        Put: {
          TableName: getTableName(),
          Item: donorItem,
        },
      },
      // Add alias items for new donors
      ...aliasItems.map(alias => ({
        Put: {
          TableName: getTableName(),
          Item: alias,
          ConditionExpression: 'attribute_not_exists(PK)', // Prevent overwriting existing aliases
        },
      })),
    ];

    await docClient.send(
      new TransactWriteCommand({
        TransactItems: transactItems,
      })
    );

    console.log(`✅ Donation created successfully: ${receiptNo}`);
  } catch (error) {
    console.error('❌ Failed to create donation:', error);
    throw new Error(`Failed to create donation: ${(error as Error).message}`);
  }

  // 11. Return response
  const response: CreateReceiptResponse = {
    success: true,
    receiptNo,
    donorId,
    total,
    createdAt: startTime,
  };

  return response;
}

/**
 * Validate donation breakup
 */
function validateBreakup(breakup: Record<string, number>): void {
  if (!breakup || Object.keys(breakup).length === 0) {
    throw new Error('At least one donation purpose is required');
  }

  for (const [purpose, amount] of Object.entries(breakup)) {
    const normalized = normalizeAmount(amount);
    if (normalized === null || normalized <= 0) {
      throw new Error(`Invalid amount for ${purpose}: ${amount}`);
    }
  }
}

/**
 * Validate payment information
 */
function validatePayment(payment: { mode: string; ref?: string }): void {
  if (!payment || !payment.mode) {
    throw new Error('Payment mode is required');
  }

  const validModes = ['CASH', 'UPI', 'CHEQUE', 'NEFT', 'RTGS', 'CARD', 'ONLINE'];
  if (!validModes.includes(payment.mode.toUpperCase())) {
    throw new Error(`Invalid payment mode. Must be one of: ${validModes.join(', ')}`);
  }
}
