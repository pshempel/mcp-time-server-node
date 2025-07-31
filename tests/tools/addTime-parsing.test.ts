import { parseDateWithTimezone } from '../../src/tools/addTime';
import { TimeServerErrorCodes } from '../../src/types';

describe('addTime date parsing helper', () => {
  describe('parseDateWithTimezone', () => {
    it('should parse Unix timestamp', () => {
      const result = parseDateWithTimezone('1609459200', 'America/New_York');
      
      expect(result.date).toEqual(new Date('2021-01-01T00:00:00.000Z'));
      expect(result.displayTimezone).toBe('UTC'); // Unix timestamps default to UTC
      expect(result.hasExplicitOffset).toBe(false);
      expect(result.explicitOffset).toBe('');
    });

    it('should parse Unix timestamp with timezone parameter', () => {
      const result = parseDateWithTimezone('1609459200', 'America/New_York', 'America/New_York');
      
      expect(result.date).toEqual(new Date('2021-01-01T00:00:00.000Z'));
      expect(result.displayTimezone).toBe('America/New_York'); // Use param timezone
      expect(result.hasExplicitOffset).toBe(false);
      expect(result.explicitOffset).toBe('');
    });

    it('should parse ISO string with Z suffix', () => {
      const result = parseDateWithTimezone('2021-01-01T00:00:00.000Z', 'America/New_York');
      
      expect(result.date).toEqual(new Date('2021-01-01T00:00:00.000Z'));
      expect(result.displayTimezone).toBe('UTC'); // Z means UTC
      expect(result.hasExplicitOffset).toBe(false);
      expect(result.explicitOffset).toBe('');
    });

    it('should parse ISO string with Z suffix and timezone parameter', () => {
      const result = parseDateWithTimezone('2021-01-01T00:00:00.000Z', 'Europe/Paris', 'Europe/Paris');
      
      expect(result.date).toEqual(new Date('2021-01-01T00:00:00.000Z'));
      expect(result.displayTimezone).toBe('Europe/Paris'); // Use param timezone
      expect(result.hasExplicitOffset).toBe(false);
      expect(result.explicitOffset).toBe('');
    });

    it('should parse string with explicit offset', () => {
      const result = parseDateWithTimezone('2021-01-01T00:00:00.000+05:00', 'America/New_York');
      
      expect(result.date).toEqual(new Date('2020-12-31T19:00:00.000Z'));
      expect(result.displayTimezone).toBe('America/New_York');
      expect(result.hasExplicitOffset).toBe(true);
      expect(result.explicitOffset).toBe('+05:00');
    });

    it('should parse local time string', () => {
      const result = parseDateWithTimezone('2021-01-01T00:00:00', 'America/New_York');
      
      // Should be interpreted as New York time
      expect(result.date).toEqual(new Date('2021-01-01T05:00:00.000Z'));
      expect(result.displayTimezone).toBe('America/New_York');
      expect(result.hasExplicitOffset).toBe(false);
      expect(result.explicitOffset).toBe('');
    });

    it('should throw for invalid date format', () => {
      expect(() => parseDateWithTimezone('invalid', 'America/New_York')).toThrow();
      
      try {
        parseDateWithTimezone('invalid', 'America/New_York');
        fail('Should have thrown');
      } catch (error: any) {
        expect(error.error.code).toBe(TimeServerErrorCodes.INVALID_DATE_FORMAT);
        expect(error.error.message).toContain('Invalid time format: invalid');
      }
    });

    it('should throw for invalid Unix timestamp', () => {
      expect(() => parseDateWithTimezone('999999999999999', 'America/New_York')).toThrow();
    });

    describe('Debug logging', () => {
      it('should log parsing attempts', () => {
        // This test verifies the function runs with debug
        const result1 = parseDateWithTimezone('2021-01-01T00:00:00.000Z', 'UTC');
        expect(result1.date).toBeDefined();
        
        const result2 = parseDateWithTimezone('1609459200', 'UTC');
        expect(result2.date).toBeDefined();
      });
    });
  });
});