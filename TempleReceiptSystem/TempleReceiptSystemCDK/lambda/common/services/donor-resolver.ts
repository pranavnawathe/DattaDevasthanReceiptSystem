/**
 * Donor resolution service
 * Finds existing donors or creates new donor IDs based on identifiers
 */

import { DonorInfo, DonorResolution, DonorItem } from '../types';
import { normalizePhone, normalizeEmail, normalizePAN, normalizeName } from '../utils/normalizers';
import { hashPAN, hashEmail } from '../utils/crypto';
import { generateDonorId } from '../utils/id-generator';
import { getAliasByPhone, getAliasByPAN, getAliasByEmail, getDonorProfile } from '../db/queries';

/**
 * Resolve donor ID from donor information
 * Checks aliases in priority order: Phone > PAN > Email
 * If no existing donor found, generates new stable donor ID
 *
 * @param orgId - Organization ID
 * @param donorInfo - Donor information from request
 * @returns Donor resolution result with donorId and whether it's new
 */
export async function resolveDonor(
  orgId: string,
  donorInfo: DonorInfo
): Promise<DonorResolution> {
  // Normalize all identifiers
  const normalizedPhone = normalizePhone(donorInfo.mobile);
  const normalizedPAN = normalizePAN(donorInfo.pan);
  const normalizedEmail = normalizeEmail(donorInfo.email);
  const normalizedName = normalizeName(donorInfo.name);

  if (!normalizedName) {
    throw new Error('Donor name is required');
  }

  // Try to find existing donor by checking aliases in priority order
  let donorId: string | null = null;
  let existingProfile: DonorItem | null = null;

  // 1. Check phone alias (most reliable)
  if (normalizedPhone) {
    donorId = await getAliasByPhone(orgId, normalizedPhone);
    if (donorId) {
      console.log(`Found existing donor by phone: ${donorId}`);
    }
  }

  // 2. Check PAN alias (if not found by phone)
  if (!donorId && normalizedPAN) {
    const panHash = hashPAN(normalizedPAN);
    donorId = await getAliasByPAN(orgId, panHash);
    if (donorId) {
      console.log(`Found existing donor by PAN: ${donorId}`);
    }
  }

  // 3. Check email alias (if not found by phone or PAN)
  if (!donorId && normalizedEmail) {
    const emailHash = hashEmail(normalizedEmail);
    donorId = await getAliasByEmail(orgId, emailHash);
    if (donorId) {
      console.log(`Found existing donor by email: ${donorId}`);
    }
  }

  // If found, fetch existing profile
  if (donorId) {
    existingProfile = await getDonorProfile(orgId, donorId);
    return {
      donorId,
      isNew: false,
      existingProfile: existingProfile || undefined,
    };
  }

  // No existing donor found - generate new stable donor ID
  const newDonorId = generateDonorId(
    normalizedPAN || undefined,
    normalizedPhone || undefined,
    normalizedEmail || undefined,
    orgId
  );

  console.log(`Creating new donor: ${newDonorId}`);

  return {
    donorId: newDonorId,
    isNew: true,
    existingProfile: undefined,
  };
}

/**
 * Validate donor information
 * Ensures all required fields are present and valid
 *
 * @param donorInfo - Donor information to validate
 * @throws Error if validation fails
 */
export function validateDonorInfo(donorInfo: DonorInfo): void {
  const normalizedName = normalizeName(donorInfo.name);
  if (!normalizedName) {
    throw new Error('Donor name is required');
  }

  // At least one contact method should be provided
  const hasPhone = normalizePhone(donorInfo.mobile) !== null;
  const hasEmail = normalizeEmail(donorInfo.email) !== null;
  const hasPAN = normalizePAN(donorInfo.pan) !== null;

  if (!hasPhone && !hasEmail && !hasPAN) {
    throw new Error('At least one of phone, email, or PAN must be provided');
  }

  // Validate PAN format if provided
  if (donorInfo.pan && !hasPAN) {
    throw new Error('Invalid PAN format. Expected: ABCDE1234F');
  }

  // Validate phone format if provided
  if (donorInfo.mobile && !hasPhone) {
    throw new Error('Invalid phone number. Expected: 10-digit Indian mobile');
  }

  // Validate email format if provided
  if (donorInfo.email && !hasEmail) {
    throw new Error('Invalid email format');
  }
}
