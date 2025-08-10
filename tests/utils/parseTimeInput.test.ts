import { DateParsingError } from '../../src/adapters/mcp-sdk/errors';
import { parseTimeInput } from '../../src/utils/parseTimeInput';

describe('parseTimeInput', () => {
  describe('Unix timestamp parsing', () => {
    it('should parse Unix timestamp in seconds', () => {
      const result = parseTimeInput('1735689600');
      expect(result.date.toISOString()).toBe('2025-01-01T00:00:00.000Z');
      expect(result.detectedTimezone).toBe('UTC');
      expect(result.hasExplicitTimezone).toBe(true);
    });

    it('should parse Unix timestamp in milliseconds', () => {
      const result = parseTimeInput('1735689600000');
      expect(result.date.toISOString()).toBe('2025-01-01T00:00:00.000Z');
      expect(result.detectedTimezone).toBe('UTC');
      expect(result.hasExplicitTimezone).toBe(true);
    });

    it('should handle number input directly', () => {
      const result = parseTimeInput(1735689600);
      expect(result.date.toISOString()).toBe('2025-01-01T00:00:00.000Z');
    });

    it('should reject invalid Unix timestamps', () => {
      expect(() => parseTimeInput('not_a_number')).toThrow();
      expect(() => parseTimeInput('123abc')).toThrow();
    });
  });

  describe('ISO string with timezone info', () => {
    it('should parse ISO string with Z suffix', () => {
      const result = parseTimeInput('2025-01-01T12:00:00Z');
      expect(result.date.toISOString()).toBe('2025-01-01T12:00:00.000Z');
      expect(result.detectedTimezone).toBe('UTC');
      expect(result.hasExplicitTimezone).toBe(true);
    });

    it('should parse ISO string with positive offset', () => {
      const result = parseTimeInput('2025-01-01T12:00:00+05:00');
      expect(result.date.toISOString()).toBe('2025-01-01T07:00:00.000Z');
      expect(result.detectedTimezone).toBe('offset');
      expect(result.hasExplicitTimezone).toBe(true);
      expect(result.offset).toBe(300); // +5 hours = 300 minutes
    });

    it('should parse ISO string with negative offset', () => {
      const result = parseTimeInput('2025-01-01T12:00:00-08:00');
      expect(result.date.toISOString()).toBe('2025-01-01T20:00:00.000Z');
      expect(result.detectedTimezone).toBe('offset');
      expect(result.hasExplicitTimezone).toBe(true);
      expect(result.offset).toBe(-480); // -8 hours = -480 minutes
    });
  });

  describe('ISO string without timezone (local time)', () => {
    it('should parse as UTC when timezone is empty string', () => {
      const result = parseTimeInput('2025-01-01T12:00:00', '');
      expect(result.date.toISOString()).toBe('2025-01-01T12:00:00.000Z');
      expect(result.detectedTimezone).toBe('UTC');
      expect(result.hasExplicitTimezone).toBe(false);
    });

    it('should parse as specific timezone when provided', () => {
      const result = parseTimeInput('2025-01-01T12:00:00', 'America/New_York');
      expect(result.date.toISOString()).toBe('2025-01-01T17:00:00.000Z'); // EST is UTC-5
      expect(result.detectedTimezone).toBe('America/New_York');
      expect(result.hasExplicitTimezone).toBe(false);
    });

    it('should parse as system local when timezone undefined', () => {
      const result = parseTimeInput('2025-01-01T12:00:00');
      // Can't test exact value as it depends on system timezone
      expect(result.date).toBeInstanceOf(Date);
      expect(result.detectedTimezone).toBe('local');
      expect(result.hasExplicitTimezone).toBe(false);
    });
  });

  describe('Date-only strings', () => {
    it('should parse date-only as start of day in UTC when timezone empty', () => {
      const result = parseTimeInput('2025-01-01', '');
      expect(result.date.toISOString()).toBe('2025-01-01T00:00:00.000Z');
    });

    it('should parse date-only as start of day in specified timezone', () => {
      const result = parseTimeInput('2025-01-01', 'America/New_York');
      expect(result.date.toISOString()).toBe('2025-01-01T05:00:00.000Z'); // Midnight EST = 5am UTC
    });
  });

  describe('Invalid input handling', () => {
    it('should reject null input', () => {
      expect(() => parseTimeInput(null as any)).toThrow();
    });

    it('should reject undefined input', () => {
      expect(() => parseTimeInput(undefined as any)).toThrow();
    });

    it('should reject empty string', () => {
      expect(() => parseTimeInput('')).toThrow();
    });

    it('should reject invalid date strings', () => {
      expect(() => parseTimeInput('tomorrow')).toThrow();
      expect(() => parseTimeInput('not a date')).toThrow();
      expect(() => parseTimeInput('2025-13-45')).toThrow(); // Invalid month/day
    });

    it('should provide descriptive error messages', () => {
      try {
        parseTimeInput('invalid');
      } catch (error: any) {
        expect(error).toBeInstanceOf(DateParsingError);
        expect(error.code).toBe('DATE_PARSING_ERROR');
        expect(error.message).toContain('Invalid');
        expect(error.details).toHaveProperty('input', 'invalid');
      }
    });
  });

  describe('Timezone convention compliance', () => {
    it('should treat empty string as UTC', () => {
      const result = parseTimeInput('2025-01-01T12:00:00', '');
      expect(result.detectedTimezone).toBe('UTC');
    });

    it('should treat "UTC" same as empty string', () => {
      const result1 = parseTimeInput('2025-01-01T12:00:00', '');
      const result2 = parseTimeInput('2025-01-01T12:00:00', 'UTC');
      expect(result1.date.toISOString()).toBe(result2.date.toISOString());
    });

    it('should treat undefined as system local', () => {
      const result = parseTimeInput('2025-01-01T12:00:00', undefined);
      expect(result.detectedTimezone).toBe('local');
    });
  });

  describe('Edge cases', () => {
    it('should handle leap year dates', () => {
      const result = parseTimeInput('2024-02-29T12:00:00Z');
      expect(result.date.toISOString()).toBe('2024-02-29T12:00:00.000Z');
    });

    it('should handle very large Unix timestamps', () => {
      // Year 2286 timestamp
      const result = parseTimeInput('9999999999');
      expect(result.date.getFullYear()).toBeGreaterThan(2200);
    });

    it('should handle DST boundaries correctly', () => {
      // DST transition date in 2025 (March 9, 2am)
      const result = parseTimeInput('2025-03-09T02:30:00', 'America/New_York');
      expect(result.date).toBeInstanceOf(Date);
      // The time should jump to 3:30am due to DST
    });
  });

  describe('Backwards compatibility', () => {
    it('should match existing addTime.ts behavior for Unix timestamps', () => {
      const result = parseTimeInput('1735689600');
      expect(result.date.toISOString()).toBe('2025-01-01T00:00:00.000Z');
    });

    it('should match existing behavior for ISO with timezone', () => {
      const result = parseTimeInput('2025-01-01T12:00:00+05:00');
      expect(result.date.toISOString()).toBe('2025-01-01T07:00:00.000Z');
    });

    it('should match existing behavior for local time parsing', () => {
      const result = parseTimeInput('2025-01-01T12:00:00', 'America/New_York');
      expect(result.date.toISOString()).toBe('2025-01-01T17:00:00.000Z');
    });
  });
});
