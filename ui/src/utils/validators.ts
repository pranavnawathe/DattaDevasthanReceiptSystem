import type { DonorInfo, PaymentInfo, FormErrors } from '../types';
import { normalizePhone, normalizePAN, normalizeEmail } from './formatters';

export function validateDonorInfo(donor: DonorInfo): FormErrors {
  const errors: FormErrors = {};

  // Name is required and must be at least 2 characters
  if (!donor.name || donor.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  // At least one identifier (mobile, PAN, or email) is required
  const hasMobile = donor.mobile && donor.mobile.trim().length > 0;
  const hasPAN = donor.pan && donor.pan.trim().length > 0;
  const hasEmail = donor.email && donor.email.trim().length > 0;

  if (!hasMobile && !hasPAN && !hasEmail) {
    errors.mobile = 'Provide at least one: mobile number, PAN, or email';
  }

  // Validate mobile if provided
  if (hasMobile) {
    const normalized = normalizePhone(donor.mobile!);
    if (!normalized) {
      errors.mobile = 'Invalid mobile number. Use 10 digits (e.g., 9876543210)';
    }
  }

  // Validate PAN if provided
  if (hasPAN) {
    const normalized = normalizePAN(donor.pan!);
    if (!normalized) {
      errors.pan = 'Invalid PAN format. Use 10 characters (e.g., ABCDE1234F)';
    }
  }

  // Validate email if provided
  if (hasEmail) {
    const normalized = normalizeEmail(donor.email!);
    if (!normalized) {
      errors.email = 'Invalid email format';
    }
  }

  return errors;
}

export function validateBreakup(breakup: Record<string, number>): string | null {
  const values = Object.values(breakup);

  if (values.length === 0) {
    return 'Add at least one donation category';
  }

  const total = values.reduce((sum, val) => sum + val, 0);

  if (total <= 0) {
    return 'Total donation must be greater than zero';
  }

  // Check for negative values
  const hasNegative = values.some(val => val < 0);
  if (hasNegative) {
    return 'Donation amounts cannot be negative';
  }

  return null;
}

export function validatePayment(payment: PaymentInfo): string | null {
  if (!payment.mode) {
    return 'Payment mode is required';
  }

  // For cheque and online, reference is recommended
  if ((payment.mode === 'CHEQUE' || payment.mode === 'ONLINE') && !payment.reference) {
    // This is a warning, not an error - we'll just return null
    return null;
  }

  return null;
}
