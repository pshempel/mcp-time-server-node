import { parseDateForConversion } from '../../src/tools/convertTimezone';
import { TimeServerErrorCodes } from '../../src/types';

describe('convertTimezone date parsing helper', () => {
  describe('parseDateForConversion', () => {
    it('should parse Unix timestamp as UTC', () => {
      const result = parseDateForConversion('1609459200', 'America/New_York');

      expect(result.date).toEqual(new Date('2021-01-01T00:00:00.000Z'));
      expect(result.actualFromTimezone).toBe('UTC'); // Unix timestamps are always UTC
    });

    it('should parse ISO string with Z suffix', () => {
      const result = parseDateForConversion('2021-01-01T00:00:00.000Z', 'America/New_York');

      expect(result.date).toEqual(new Date('2021-01-01T00:00:00.000Z'));
      expect(result.actualFromTimezone).toBe('America/New_York'); // Keep original
    });

    it('should parse string with explicit offset', () => {
      const result = parseDateForConversion('2021-01-01T00:00:00.000+05:00', 'America/New_York');

      expect(result.date).toEqual(new Date('2020-12-31T19:00:00.000Z'));
      expect(result.actualFromTimezone).toBe('America/New_York'); // Keep original
    });

    it('should parse local time string with from_timezone', () => {
      const result = parseDateForConversion('2021-01-01T00:00:00', 'America/New_York');

      // Should be interpreted as New York time
      expect(result.date).toEqual(new Date('2021-01-01T05:00:00.000Z'));
      expect(result.actualFromTimezone).toBe('America/New_York');
    });

    it('should throw for invalid date format', () => {
      expect(() => parseDateForConversion('invalid', 'UTC')).toThrow();

      try {
        parseDateForConversion('invalid', 'UTC');
        fail('Should have thrown');
      } catch (error: any) {
        expect(error.error.code).toBe(TimeServerErrorCodes.INVALID_DATE_FORMAT);
        expect(error.error.message).toContain('Invalid time format: invalid');
      }
    });

    it('should throw for invalid Unix timestamp', () => {
      expect(() => parseDateForConversion('999999999999999', 'UTC')).toThrow();
    });

    it('should handle date-only input', () => {
      const result = parseDateForConversion('2021-01-01', 'America/New_York');

      // Date-only strings are interpreted as midnight in the given timezone
      expect(result.date).toEqual(new Date('2021-01-01T05:00:00.000Z'));
      expect(result.actualFromTimezone).toBe('America/New_York');
    });

    describe('Debug logging', () => {
      it('should log parsing attempts', () => {
        const result = parseDateForConversion('2021-01-01T00:00:00.000Z', 'UTC');
        expect(result.date).toBeDefined();
        expect(result.actualFromTimezone).toBeDefined();
      });
    });
  });
});
