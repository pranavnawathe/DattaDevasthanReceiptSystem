"use strict";
/**
 * Unit tests for normalizers
 */
Object.defineProperty(exports, "__esModule", { value: true });
const normalizers_1 = require("../utils/normalizers");
describe('normalizePhone', () => {
    it('should normalize 10-digit Indian mobile', () => {
        expect((0, normalizers_1.normalizePhone)('9876543210')).toBe('+919876543210');
    });
    it('should normalize phone with spaces', () => {
        expect((0, normalizers_1.normalizePhone)('98765 43210')).toBe('+919876543210');
    });
    it('should normalize phone with +91 prefix', () => {
        expect((0, normalizers_1.normalizePhone)('+91 9876543210')).toBe('+919876543210');
    });
    it('should normalize phone with 0 prefix', () => {
        expect((0, normalizers_1.normalizePhone)('09876543210')).toBe('+919876543210');
    });
    it('should normalize phone with dashes', () => {
        expect((0, normalizers_1.normalizePhone)('091-9876-543210')).toBe('+919876543210');
    });
    it('should return null for invalid phone', () => {
        expect((0, normalizers_1.normalizePhone)('123')).toBeNull();
        expect((0, normalizers_1.normalizePhone)('abcdefghij')).toBeNull();
        expect((0, normalizers_1.normalizePhone)('')).toBeNull();
        expect((0, normalizers_1.normalizePhone)(null)).toBeNull();
        expect((0, normalizers_1.normalizePhone)(undefined)).toBeNull();
    });
});
describe('normalizeEmail', () => {
    it('should normalize email to lowercase', () => {
        expect((0, normalizers_1.normalizeEmail)('User@Example.COM')).toBe('user@example.com');
    });
    it('should trim whitespace', () => {
        expect((0, normalizers_1.normalizeEmail)('  user@example.com  ')).toBe('user@example.com');
    });
    it('should return null for invalid email', () => {
        expect((0, normalizers_1.normalizeEmail)('notanemail')).toBeNull();
        expect((0, normalizers_1.normalizeEmail)('missing@domain')).toBeNull();
        expect((0, normalizers_1.normalizeEmail)('@nodomain.com')).toBeNull();
        expect((0, normalizers_1.normalizeEmail)('')).toBeNull();
        expect((0, normalizers_1.normalizeEmail)(null)).toBeNull();
    });
    it('should handle valid email formats', () => {
        expect((0, normalizers_1.normalizeEmail)('test.user+tag@example.co.in')).toBe('test.user+tag@example.co.in');
    });
});
describe('normalizePAN', () => {
    it('should normalize PAN to uppercase', () => {
        expect((0, normalizers_1.normalizePAN)('abcde1234f')).toBe('ABCDE1234F');
    });
    it('should trim whitespace', () => {
        expect((0, normalizers_1.normalizePAN)('  ABCDE1234F  ')).toBe('ABCDE1234F');
    });
    it('should return null for invalid PAN', () => {
        expect((0, normalizers_1.normalizePAN)('ABC1234')).toBeNull(); // Too short
        expect((0, normalizers_1.normalizePAN)('ABCDE12345')).toBeNull(); // Wrong format
        expect((0, normalizers_1.normalizePAN)('12345ABCDE')).toBeNull(); // Wrong pattern
        expect((0, normalizers_1.normalizePAN)('')).toBeNull();
        expect((0, normalizers_1.normalizePAN)(null)).toBeNull();
    });
    it('should validate correct PAN format', () => {
        expect((0, normalizers_1.normalizePAN)('AAAPL1234C')).toBe('AAAPL1234C');
        expect((0, normalizers_1.normalizePAN)('BBBPL5678D')).toBe('BBBPL5678D');
    });
});
describe('normalizeDate', () => {
    it('should normalize ISO date string', () => {
        const result = (0, normalizers_1.normalizeDate)('2025-10-18');
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
    it('should normalize Date object', () => {
        const date = new Date('2025-10-18T12:00:00Z');
        const result = (0, normalizers_1.normalizeDate)(date);
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
    it('should return null for invalid date', () => {
        expect((0, normalizers_1.normalizeDate)('invalid')).toBeNull();
        expect((0, normalizers_1.normalizeDate)('')).toBeNull();
        expect((0, normalizers_1.normalizeDate)(null)).toBeNull();
    });
});
describe('getTodayISO', () => {
    it('should return date in yyyy-mm-dd format', () => {
        const today = (0, normalizers_1.getTodayISO)();
        expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});
describe('normalizeAmount', () => {
    it('should normalize number amounts', () => {
        expect((0, normalizers_1.normalizeAmount)(100)).toBe(100);
        expect((0, normalizers_1.normalizeAmount)(100.5)).toBe(100.5);
    });
    it('should normalize string amounts', () => {
        expect((0, normalizers_1.normalizeAmount)('100')).toBe(100);
        expect((0, normalizers_1.normalizeAmount)('100.50')).toBe(100.5);
    });
    it('should round to 2 decimal places', () => {
        expect((0, normalizers_1.normalizeAmount)(100.456)).toBe(100.46);
        expect((0, normalizers_1.normalizeAmount)(100.123)).toBe(100.12);
    });
    it('should return null for invalid amounts', () => {
        expect((0, normalizers_1.normalizeAmount)(-100)).toBeNull();
        expect((0, normalizers_1.normalizeAmount)('abc')).toBeNull();
        expect((0, normalizers_1.normalizeAmount)(null)).toBeNull();
    });
});
describe('normalizeName', () => {
    it('should trim whitespace', () => {
        expect((0, normalizers_1.normalizeName)('  राम शिंदे  ')).toBe('राम शिंदे');
        expect((0, normalizers_1.normalizeName)('  John Doe  ')).toBe('John Doe');
    });
    it('should return null for empty string', () => {
        expect((0, normalizers_1.normalizeName)('')).toBeNull();
        expect((0, normalizers_1.normalizeName)('   ')).toBeNull();
        expect((0, normalizers_1.normalizeName)(null)).toBeNull();
    });
});
