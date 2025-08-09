import { resolveTimezone } from '../../src/utils/timezoneUtils';

describe('resolveTimezone', () => {
  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  describe('core behavior', () => {
    it('should return system timezone when undefined', () => {
      const result = resolveTimezone(undefined, systemTimezone);
      expect(result).toBe(systemTimezone);
    });

    it('should return UTC when empty string', () => {
      const result = resolveTimezone('', systemTimezone);
      expect(result).toBe('UTC');
    });

    it('should return specified timezone when provided', () => {
      const result = resolveTimezone('America/New_York', systemTimezone);
      expect(result).toBe('America/New_York');
    });

    it('should handle various IANA timezones', () => {
      const timezones = ['Europe/London', 'Asia/Tokyo', 'Australia/Sydney', 'America/Los_Angeles'];

      timezones.forEach((tz) => {
        const result = resolveTimezone(tz, systemTimezone);
        expect(result).toBe(tz);
      });
    });
  });

  describe('edge cases', () => {
    it('should use custom default timezone', () => {
      const customDefault = 'Europe/Paris';
      const result = resolveTimezone(undefined, customDefault);
      expect(result).toBe(customDefault);
    });

    it('should handle empty string consistently regardless of default', () => {
      const result1 = resolveTimezone('', 'America/New_York');
      const result2 = resolveTimezone('', 'Europe/London');
      const result3 = resolveTimezone('', systemTimezone);

      expect(result1).toBe('UTC');
      expect(result2).toBe('UTC');
      expect(result3).toBe('UTC');
    });

    it('should preserve non-empty whitespace strings', () => {
      // These would fail validation elsewhere, but resolveTimezone doesn't validate
      const result = resolveTimezone('  ', systemTimezone);
      expect(result).toBe('  ');
    });
  });

  describe('type safety', () => {
    it('should handle null as undefined (edge case)', () => {
      // This shouldn't happen in TypeScript, but verify behavior
      const result = resolveTimezone(null as any, systemTimezone);
      expect(result).toBe(systemTimezone);
    });
  });

  describe('consistency with project convention', () => {
    it('should follow documented timezone handling rules', () => {
      // From CLAUDE.md:
      // - undefined or missing timezone: Interpreted as the system's local timezone
      // - "" (empty string): Interpreted as UTC
      // - Any other string: Interpreted as that specific IANA timezone

      const testCases = [
        { input: undefined, expected: systemTimezone },
        { input: '', expected: 'UTC' },
        { input: 'America/Chicago', expected: 'America/Chicago' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = resolveTimezone(input, systemTimezone);
        expect(result).toBe(expected);
      });
    });
  });
});
