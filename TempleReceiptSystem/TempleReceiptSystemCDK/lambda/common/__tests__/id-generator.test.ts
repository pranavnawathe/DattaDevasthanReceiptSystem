/**
 * Unit tests for ID generation
 */

import {
  generateDonorId,
  generateReceiptNo,
  parseReceiptNo,
  getFinancialYear,
  displayReceiptNo,
} from '../utils/id-generator';

describe('generateDonorId', () => {
  const orgId = 'DATTA-SAKHARAPA';

  it('should generate consistent ID from PAN', () => {
    const id1 = generateDonorId('ABCDE1234F', null, null, orgId);
    const id2 = generateDonorId('ABCDE1234F', null, null, orgId);
    expect(id1).toBe(id2);
    expect(id1).toMatch(/^D_[a-f0-9]{12}$/);
  });

  it('should prioritize PAN over phone', () => {
    const idWithPAN = generateDonorId('ABCDE1234F', '+919876543210', null, orgId);
    const idWithoutPAN = generateDonorId(null, '+919876543210', null, orgId);
    expect(idWithPAN).not.toBe(idWithoutPAN);
  });

  it('should prioritize phone over email', () => {
    const idWithPhone = generateDonorId(null, '+919876543210', 'test@example.com', orgId);
    const idWithoutPhone = generateDonorId(null, null, 'test@example.com', orgId);
    expect(idWithPhone).not.toBe(idWithoutPhone);
  });

  it('should generate UUID-based ID when no identifiers provided', () => {
    const id = generateDonorId(null, null, null, orgId);
    expect(id).toMatch(/^D_[a-f0-9]{12}$/);
  });

  it('should generate different IDs for different orgs with same PAN', () => {
    const id1 = generateDonorId('ABCDE1234F', null, null, 'ORG1');
    const id2 = generateDonorId('ABCDE1234F', null, null, 'ORG2');
    expect(id1).not.toBe(id2);
  });

  it('should handle invalid inputs gracefully', () => {
    const id = generateDonorId('invalid-pan', 'invalid-phone', 'invalid-email', orgId);
    expect(id).toMatch(/^D_[a-f0-9]{12}$/); // Falls back to UUID
  });
});

describe('getFinancialYear', () => {
  it('should return FY 2025-26 for dates in Apr 2025 - Mar 2026', () => {
    expect(getFinancialYear('2025-04-01')).toEqual({ year: 2025, label: '2025-26' });
    expect(getFinancialYear('2025-12-15')).toEqual({ year: 2025, label: '2025-26' });
    expect(getFinancialYear('2026-02-15')).toEqual({ year: 2025, label: '2025-26' });
    expect(getFinancialYear('2026-03-31')).toEqual({ year: 2025, label: '2025-26' });
  });

  it('should return FY 2024-25 for dates in Apr 2024 - Mar 2025', () => {
    expect(getFinancialYear('2025-03-31')).toEqual({ year: 2024, label: '2024-25' });
    expect(getFinancialYear('2024-04-01')).toEqual({ year: 2024, label: '2024-25' });
  });

  it('should return FY 2026-27 for April 2026 onwards', () => {
    expect(getFinancialYear('2026-04-01')).toEqual({ year: 2026, label: '2026-27' });
  });
});

describe('generateReceiptNo', () => {
  it('should format receipt number in new format', () => {
    expect(generateReceiptNo(2025, 1)).toBe('00001-2025-26');
    expect(generateReceiptNo(2025, 71)).toBe('00071-2025-26');
    expect(generateReceiptNo(2025, 12345)).toBe('12345-2025-26');
  });

  it('should handle large sequence numbers', () => {
    expect(generateReceiptNo(2025, 99999)).toBe('99999-2025-26');
  });
});

describe('displayReceiptNo', () => {
  it('should convert stored format to display format', () => {
    expect(displayReceiptNo('00071-2025-26')).toBe('00071/2025-26');
    expect(displayReceiptNo('00001-2025-26')).toBe('00001/2025-26');
  });

  it('should pass through old format unchanged', () => {
    expect(displayReceiptNo('2025-00071')).toBe('2025-00071');
  });
});

describe('parseReceiptNo', () => {
  it('should parse new format (NNNNN-YYYY-YY)', () => {
    expect(parseReceiptNo('00071-2025-26')).toEqual({ year: 2025, sequence: 71 });
    expect(parseReceiptNo('00001-2024-25')).toEqual({ year: 2024, sequence: 1 });
  });

  it('should parse old format (YYYY-NNNNN) for backward compatibility', () => {
    expect(parseReceiptNo('2025-00071')).toEqual({ year: 2025, sequence: 71 });
    expect(parseReceiptNo('2024-00001')).toEqual({ year: 2024, sequence: 1 });
  });

  it('should return null for invalid format', () => {
    expect(parseReceiptNo('invalid')).toBeNull();
    expect(parseReceiptNo('2025-71')).toBeNull();
    expect(parseReceiptNo('202500071')).toBeNull();
  });

  it('should handle edge cases', () => {
    expect(parseReceiptNo('99999-2025-26')).toEqual({ year: 2025, sequence: 99999 });
    expect(parseReceiptNo('2025-99999')).toEqual({ year: 2025, sequence: 99999 });
  });
});
