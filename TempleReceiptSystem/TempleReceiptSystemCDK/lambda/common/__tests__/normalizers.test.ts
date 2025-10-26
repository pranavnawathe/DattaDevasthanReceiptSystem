/**
 * Unit tests for normalizers
 */

import {
  normalizePhone,
  normalizeEmail,
  normalizePAN,
  normalizeDate,
  getTodayISO,
  normalizeAmount,
  normalizeName,
} from '../utils/normalizers';

describe('normalizePhone', () => {
  it('should normalize 10-digit Indian mobile', () => {
    expect(normalizePhone('9876543210')).toBe('+919876543210');
  });

  it('should normalize phone with spaces', () => {
    expect(normalizePhone('98765 43210')).toBe('+919876543210');
  });

  it('should normalize phone with +91 prefix', () => {
    expect(normalizePhone('+91 9876543210')).toBe('+919876543210');
  });

  it('should normalize phone with 0 prefix', () => {
    expect(normalizePhone('09876543210')).toBe('+919876543210');
  });

  it('should normalize phone with dashes', () => {
    expect(normalizePhone('091-9876-543210')).toBe('+919876543210');
  });

  it('should return null for invalid phone', () => {
    expect(normalizePhone('123')).toBeNull();
    expect(normalizePhone('abcdefghij')).toBeNull();
    expect(normalizePhone('')).toBeNull();
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone(undefined)).toBeNull();
  });
});

describe('normalizeEmail', () => {
  it('should normalize email to lowercase', () => {
    expect(normalizeEmail('User@Example.COM')).toBe('user@example.com');
  });

  it('should trim whitespace', () => {
    expect(normalizeEmail('  user@example.com  ')).toBe('user@example.com');
  });

  it('should return null for invalid email', () => {
    expect(normalizeEmail('notanemail')).toBeNull();
    expect(normalizeEmail('missing@domain')).toBeNull();
    expect(normalizeEmail('@nodomain.com')).toBeNull();
    expect(normalizeEmail('')).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
  });

  it('should handle valid email formats', () => {
    expect(normalizeEmail('test.user+tag@example.co.in')).toBe('test.user+tag@example.co.in');
  });
});

describe('normalizePAN', () => {
  it('should normalize PAN to uppercase', () => {
    expect(normalizePAN('abcde1234f')).toBe('ABCDE1234F');
  });

  it('should trim whitespace', () => {
    expect(normalizePAN('  ABCDE1234F  ')).toBe('ABCDE1234F');
  });

  it('should return null for invalid PAN', () => {
    expect(normalizePAN('ABC1234')).toBeNull(); // Too short
    expect(normalizePAN('ABCDE12345')).toBeNull(); // Wrong format
    expect(normalizePAN('12345ABCDE')).toBeNull(); // Wrong pattern
    expect(normalizePAN('')).toBeNull();
    expect(normalizePAN(null)).toBeNull();
  });

  it('should validate correct PAN format', () => {
    expect(normalizePAN('AAAPL1234C')).toBe('AAAPL1234C');
    expect(normalizePAN('BBBPL5678D')).toBe('BBBPL5678D');
  });
});

describe('normalizeDate', () => {
  it('should normalize ISO date string', () => {
    const result = normalizeDate('2025-10-18');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should normalize Date object', () => {
    const date = new Date('2025-10-18T12:00:00Z');
    const result = normalizeDate(date);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should return null for invalid date', () => {
    expect(normalizeDate('invalid')).toBeNull();
    expect(normalizeDate('')).toBeNull();
    expect(normalizeDate(null)).toBeNull();
  });
});

describe('getTodayISO', () => {
  it('should return date in yyyy-mm-dd format', () => {
    const today = getTodayISO();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('normalizeAmount', () => {
  it('should normalize number amounts', () => {
    expect(normalizeAmount(100)).toBe(100);
    expect(normalizeAmount(100.5)).toBe(100.5);
  });

  it('should normalize string amounts', () => {
    expect(normalizeAmount('100')).toBe(100);
    expect(normalizeAmount('100.50')).toBe(100.5);
  });

  it('should round to 2 decimal places', () => {
    expect(normalizeAmount(100.456)).toBe(100.46);
    expect(normalizeAmount(100.123)).toBe(100.12);
  });

  it('should return null for invalid amounts', () => {
    expect(normalizeAmount(-100)).toBeNull();
    expect(normalizeAmount('abc')).toBeNull();
    expect(normalizeAmount(null)).toBeNull();
  });
});

describe('normalizeName', () => {
  it('should trim whitespace', () => {
    expect(normalizeName('  राम शिंदे  ')).toBe('राम शिंदे');
    expect(normalizeName('  John Doe  ')).toBe('John Doe');
  });

  it('should return null for empty string', () => {
    expect(normalizeName('')).toBeNull();
    expect(normalizeName('   ')).toBeNull();
    expect(normalizeName(null)).toBeNull();
  });
});
