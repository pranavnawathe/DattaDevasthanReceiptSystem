/**
 * Unit tests for crypto utilities
 */

import {
  hashPAN,
  maskPAN,
  hashEmail,
  maskEmail,
  maskPhone,
  shortHash,
  sanitizeForLogs,
} from '../utils/crypto';

describe('hashPAN', () => {
  it('should generate consistent hash for same PAN', () => {
    const pan = 'ABCDE1234F';
    const hash1 = hashPAN(pan);
    const hash2 = hashPAN(pan);
    expect(hash1).toBe(hash2);
  });

  it('should generate different hashes for different PANs', () => {
    const hash1 = hashPAN('ABCDE1234F');
    const hash2 = hashPAN('XYZDE5678F');
    expect(hash1).not.toBe(hash2);
  });

  it('should include prefix', () => {
    const hash = hashPAN('ABCDE1234F');
    expect(hash).toMatch(/^h:sha256:/);
  });
});

describe('maskPAN', () => {
  it('should mask middle 4 characters', () => {
    expect(maskPAN('ABCDE1234F')).toBe('ABCDE****F');
  });

  it('should throw error for invalid PAN length', () => {
    expect(() => maskPAN('ABC')).toThrow('Invalid PAN length');
  });
});

describe('hashEmail', () => {
  it('should generate consistent hash for same email', () => {
    const email = 'test@example.com';
    const hash1 = hashEmail(email);
    const hash2 = hashEmail(email);
    expect(hash1).toBe(hash2);
  });

  it('should generate different hashes for different emails', () => {
    const hash1 = hashEmail('test1@example.com');
    const hash2 = hashEmail('test2@example.com');
    expect(hash1).not.toBe(hash2);
  });
});

describe('maskEmail', () => {
  it('should mask local part', () => {
    expect(maskEmail('user@example.com')).toBe('u***@example.com');
  });

  it('should handle short local part', () => {
    expect(maskEmail('u@example.com')).toBe('u@example.com');
  });
});

describe('maskPhone', () => {
  it('should mask middle digits', () => {
    expect(maskPhone('+919876543210')).toBe('+91987XXXXX10');
  });

  it('should return as-is for non-Indian phone', () => {
    expect(maskPhone('+15551234567')).toBe('+15551234567');
  });
});

describe('shortHash', () => {
  it('should return 12 character hash', () => {
    const hash = shortHash('test-value');
    expect(hash.length).toBe(12);
  });

  it('should be consistent', () => {
    const hash1 = shortHash('test');
    const hash2 = shortHash('test');
    expect(hash1).toBe(hash2);
  });
});

describe('sanitizeForLogs', () => {
  it('should mask PAN in strings', () => {
    const input = 'PAN is ABCDE1234F and name is John';
    const output = sanitizeForLogs(input);
    expect(output).not.toContain('ABCDE1234F');
    expect(output).toContain('XXXXX****X');
  });

  it('should mask email in strings', () => {
    const input = 'Email: test@example.com';
    const output = sanitizeForLogs(input);
    expect(output).not.toContain('test@example.com');
  });

  it('should mask phone in strings', () => {
    const input = 'Phone: +919876543210';
    const output = sanitizeForLogs(input);
    expect(output).not.toContain('+919876543210');
  });

  it('should mask PAN in objects', () => {
    const input = { donor: { pan: 'ABCDE1234F', name: 'John' } };
    const output = sanitizeForLogs(input) as any;
    expect(output.donor.pan).toBe('ABCDE****F');
    expect(output.donor.name).toBe('John');
  });

  it('should mask email in objects', () => {
    const input = { donor: { email: 'test@example.com' } };
    const output = sanitizeForLogs(input) as any;
    expect(output.donor.email).toBe('t***@example.com');
  });

  it('should mask phone in objects', () => {
    const input = { donor: { mobile: '+919876543210' } };
    const output = sanitizeForLogs(input) as any;
    expect(output.donor.mobile).toBe('+91987XXXXX10');
  });
});
