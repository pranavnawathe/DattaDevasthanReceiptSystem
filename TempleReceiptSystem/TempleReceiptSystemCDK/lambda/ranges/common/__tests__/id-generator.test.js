"use strict";
/**
 * Unit tests for ID generation
 */
Object.defineProperty(exports, "__esModule", { value: true });
const id_generator_1 = require("../utils/id-generator");
describe('generateDonorId', () => {
    const orgId = 'DATTA-SAKHARAPA';
    it('should generate consistent ID from PAN', () => {
        const id1 = (0, id_generator_1.generateDonorId)('ABCDE1234F', null, null, orgId);
        const id2 = (0, id_generator_1.generateDonorId)('ABCDE1234F', null, null, orgId);
        expect(id1).toBe(id2);
        expect(id1).toMatch(/^D_[a-f0-9]{12}$/);
    });
    it('should prioritize PAN over phone', () => {
        const idWithPAN = (0, id_generator_1.generateDonorId)('ABCDE1234F', '+919876543210', null, orgId);
        const idWithoutPAN = (0, id_generator_1.generateDonorId)(null, '+919876543210', null, orgId);
        expect(idWithPAN).not.toBe(idWithoutPAN);
    });
    it('should prioritize phone over email', () => {
        const idWithPhone = (0, id_generator_1.generateDonorId)(null, '+919876543210', 'test@example.com', orgId);
        const idWithoutPhone = (0, id_generator_1.generateDonorId)(null, null, 'test@example.com', orgId);
        expect(idWithPhone).not.toBe(idWithoutPhone);
    });
    it('should generate UUID-based ID when no identifiers provided', () => {
        const id = (0, id_generator_1.generateDonorId)(null, null, null, orgId);
        expect(id).toMatch(/^D_[a-f0-9]{12}$/);
    });
    it('should generate different IDs for different orgs with same PAN', () => {
        const id1 = (0, id_generator_1.generateDonorId)('ABCDE1234F', null, null, 'ORG1');
        const id2 = (0, id_generator_1.generateDonorId)('ABCDE1234F', null, null, 'ORG2');
        expect(id1).not.toBe(id2);
    });
    it('should handle invalid inputs gracefully', () => {
        const id = (0, id_generator_1.generateDonorId)('invalid-pan', 'invalid-phone', 'invalid-email', orgId);
        expect(id).toMatch(/^D_[a-f0-9]{12}$/); // Falls back to UUID
    });
});
describe('generateReceiptNo', () => {
    it('should format receipt number with padding', () => {
        expect((0, id_generator_1.generateReceiptNo)(2025, 1)).toBe('2025-00001');
        expect((0, id_generator_1.generateReceiptNo)(2025, 71)).toBe('2025-00071');
        expect((0, id_generator_1.generateReceiptNo)(2025, 12345)).toBe('2025-12345');
    });
    it('should handle large sequence numbers', () => {
        expect((0, id_generator_1.generateReceiptNo)(2025, 99999)).toBe('2025-99999');
    });
});
describe('parseReceiptNo', () => {
    it('should parse valid receipt number', () => {
        expect((0, id_generator_1.parseReceiptNo)('2025-00071')).toEqual({ year: 2025, sequence: 71 });
        expect((0, id_generator_1.parseReceiptNo)('2024-00001')).toEqual({ year: 2024, sequence: 1 });
    });
    it('should return null for invalid format', () => {
        expect((0, id_generator_1.parseReceiptNo)('2025-71')).toBeNull();
        expect((0, id_generator_1.parseReceiptNo)('invalid')).toBeNull();
        expect((0, id_generator_1.parseReceiptNo)('202500071')).toBeNull();
    });
    it('should handle edge cases', () => {
        expect((0, id_generator_1.parseReceiptNo)('2025-00000')).toEqual({ year: 2025, sequence: 0 });
        expect((0, id_generator_1.parseReceiptNo)('2025-99999')).toEqual({ year: 2025, sequence: 99999 });
    });
});
