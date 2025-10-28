import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import Random from '../../lib/random';

describe('Random', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('stringWithNumber', () => {
    it('should generate string with correct length', () => {
      const result = Random.stringWithNumber(5);
      expect(result).toHaveLength(5);
    });

    it('should generate string with uppercase letters and numbers only', () => {
      const result = Random.stringWithNumber(10);
      expect(result).toMatch(/^[A-Z0-9]+$/);
    });

    it('should generate different strings on multiple calls', () => {
      const results = new Set();
      for (let i = 0; i < 100; i++) {
        results.add(Random.stringWithNumber(10));
      }
      // Should have at least 90 unique values out of 100 (accounting for rare collisions)
      expect(results.size).toBeGreaterThan(90);
    });

    it('should handle length 0', () => {
      const result = Random.stringWithNumber(0);
      expect(result).toBe('');
    });

    it('should handle length 1', () => {
      const result = Random.stringWithNumber(1);
      expect(result).toHaveLength(1);
      expect(result).toMatch(/^[A-Z0-9]$/);
    });

    it('should handle large length', () => {
      const result = Random.stringWithNumber(100);
      expect(result).toHaveLength(100);
      expect(result).toMatch(/^[A-Z0-9]+$/);
    });

    it('should use characters from A-Z and 0-9', () => {
      // Generate many strings and check they only contain valid characters
      for (let i = 0; i < 10; i++) {
        const result = Random.stringWithNumber(20);
        for (const char of result) {
          expect('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789').toContain(char);
        }
      }
    });
  });

  describe('stringOnly', () => {
    it('should generate string with correct length', () => {
      const result = Random.stringOnly(5);
      expect(result).toHaveLength(5);
    });

    it('should generate string with uppercase letters only (no numbers)', () => {
      const result = Random.stringOnly(10);
      expect(result).toMatch(/^[A-Z]+$/);
      expect(result).not.toMatch(/[0-9]/);
    });

    it('should generate different strings on multiple calls', () => {
      const results = new Set();
      for (let i = 0; i < 100; i++) {
        results.add(Random.stringOnly(10));
      }
      expect(results.size).toBeGreaterThan(90);
    });

    it('should handle length 0', () => {
      const result = Random.stringOnly(0);
      expect(result).toBe('');
    });

    it('should only use A-Z characters', () => {
      for (let i = 0; i < 10; i++) {
        const result = Random.stringOnly(20);
        for (const char of result) {
          expect('ABCDEFGHIJKLMNOPQRSTUVWXYZ').toContain(char);
          expect('0123456789').not.toContain(char);
        }
      }
    });
  });

  describe('numberOnly', () => {
    it('should generate string with correct length', () => {
      const result = Random.numberOnly(5);
      expect(result).toHaveLength(5);
    });

    it('should generate string with numbers only', () => {
      const result = Random.numberOnly(10);
      expect(result).toMatch(/^[0-9]+$/);
      expect(result).not.toMatch(/[A-Z]/);
    });

    it('should return a string, not a number', () => {
      const result = Random.numberOnly(5);
      expect(typeof result).toBe('string');
    });

    it('should generate different strings on multiple calls', () => {
      const results = new Set();
      for (let i = 0; i < 100; i++) {
        results.add(Random.numberOnly(10));
      }
      expect(results.size).toBeGreaterThan(90);
    });

    it('should handle length 0', () => {
      const result = Random.numberOnly(0);
      expect(result).toBe('');
    });

    it('should only use 0-9 characters', () => {
      for (let i = 0; i < 10; i++) {
        const result = Random.numberOnly(20);
        for (const char of result) {
          expect('0123456789').toContain(char);
          expect('ABCDEFGHIJKLMNOPQRSTUVWXYZ').not.toContain(char);
        }
      }
    });

    it('should allow leading zeros', () => {
      // Run multiple times to potentially get a leading zero
      let hasLeadingZero = false;
      for (let i = 0; i < 100; i++) {
        const result = Random.numberOnly(5);
        if (result.startsWith('0')) {
          hasLeadingZero = true;
          break;
        }
      }
      // This is probabilistic, but very likely to succeed
      expect(hasLeadingZero).toBe(true);
    });
  });

  describe('intOnly', () => {
    it('should generate number with approximately correct number of digits', () => {
      const result = Random.intOnly(5);
      expect(typeof result).toBe('number');
      // Should be between 10000 (5 digits) and 99999 (5 digits)
      expect(result).toBeGreaterThanOrEqual(10000);
      expect(result).toBeLessThanOrEqual(99999);
    });

    it('should return a number, not a string', () => {
      const result = Random.intOnly(5);
      expect(typeof result).toBe('number');
    });

    it('should generate different numbers on multiple calls', () => {
      const results = new Set();
      for (let i = 0; i < 100; i++) {
        results.add(Random.intOnly(5));
      }
      expect(results.size).toBeGreaterThan(90);
    });

    it('should handle length 1', () => {
      const result = Random.intOnly(1);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(9);
    });

    it('should handle length 2', () => {
      const result = Random.intOnly(2);
      expect(result).toBeGreaterThanOrEqual(10);
      expect(result).toBeLessThanOrEqual(99);
    });

    it('should handle length 3', () => {
      const result = Random.intOnly(3);
      expect(result).toBeGreaterThanOrEqual(100);
      expect(result).toBeLessThanOrEqual(999);
    });

    it('should not start with 0 (uses 1-9 for first digit)', () => {
      // Test multiple times
      for (let i = 0; i < 20; i++) {
        const result = Random.intOnly(5);
        const firstDigit = Math.floor(result / 10000);
        expect(firstDigit).toBeGreaterThanOrEqual(1);
        expect(firstDigit).toBeLessThanOrEqual(9);
      }
    });

    it('should use 1-9 characters (not 0)', () => {
      // Generate and check the range is correct
      for (let i = 0; i < 10; i++) {
        const result = Random.intOnly(5);
        expect(result).toBeGreaterThanOrEqual(11111); // Minimum (all 1s)
        expect(result).toBeLessThanOrEqual(99999);    // Maximum (all 9s)
      }
    });
  });
});
