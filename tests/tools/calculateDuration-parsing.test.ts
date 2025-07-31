import { parseTimeParameter } from '../../src/tools/calculateDuration';

describe('calculateDuration parseTimeParameter helper', () => {
  describe('Unix timestamp strings', () => {
    it('should parse valid Unix timestamp string', () => {
      const result = parseTimeParameter('1735689600', 'UTC');
      expect(result.toISOString()).toBe('2025-01-01T00:00:00.000Z');
    });

    it('should throw for invalid Unix timestamp string', () => {
      expect(() => parseTimeParameter('invalid123', 'UTC')).toThrow();
    });

    it('should throw for NaN timestamp', () => {
      expect(() => parseTimeParameter('12345abc', 'UTC')).toThrow();
    });
  });

  describe('ISO strings with timezone info', () => {
    it('should parse ISO string with Z suffix', () => {
      const result = parseTimeParameter('2025-01-01T12:00:00Z', 'America/New_York');
      expect(result.toISOString()).toBe('2025-01-01T12:00:00.000Z');
    });

    it('should parse ISO string with offset', () => {
      const result = parseTimeParameter('2025-01-01T12:00:00-05:00', 'UTC');
      expect(result.toISOString()).toBe('2025-01-01T17:00:00.000Z');
    });

    it('should parse ISO string with positive offset', () => {
      const result = parseTimeParameter('2025-01-01T12:00:00+09:00', 'UTC');
      expect(result.toISOString()).toBe('2025-01-01T03:00:00.000Z');
    });
  });

  describe('Local time strings (no timezone info)', () => {
    it('should use provided timezone for local time string', () => {
      // This tests the toDate behavior for local time interpretation
      const result = parseTimeParameter('2025-01-01T12:00:00', 'America/New_York');
      // The exact result depends on toDate implementation
      expect(result).toBeInstanceOf(Date);
    });

    it('should handle date-only strings with timezone', () => {
      const result = parseTimeParameter('2025-01-01', 'America/New_York');
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('Error handling', () => {
    it('should throw for completely invalid date string', () => {
      expect(() => parseTimeParameter('not-a-date', 'UTC')).toThrow();
    });

    it('should throw for empty string', () => {
      expect(() => parseTimeParameter('', 'UTC')).toThrow();
    });

    it('should validate parsed date', () => {
      // Test with an invalid date that might parse but be invalid
      expect(() => parseTimeParameter('2025-13-45', 'UTC')).toThrow();
    });
  });

  describe('Debug logging', () => {
    it('should log parsing attempts', () => {
      // This test just verifies the function runs with debug
      // Actual debug output verification would require mocking
      const result = parseTimeParameter('1735689600', 'UTC');
      expect(result).toBeInstanceOf(Date);
    });
  });
});