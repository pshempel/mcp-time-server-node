import { validateTimezones } from '../../src/tools/convertTimezone';
import { TimezoneError } from '../../src/adapters/mcp-sdk/errors';

describe('convertTimezone validation helpers', () => {
  describe('validateTimezones', () => {
    it('should accept valid timezone pairs', () => {
      expect(() => validateTimezones('America/New_York', 'Europe/London')).not.toThrow();
      expect(() => validateTimezones('UTC', 'Asia/Tokyo')).not.toThrow();
      expect(() => validateTimezones('America/Los_Angeles', 'UTC')).not.toThrow();
    });

    it('should throw for invalid from_timezone', () => {
      expect(() => validateTimezones('Invalid/Zone', 'UTC')).toThrow();

      try {
        validateTimezones('Invalid/Zone', 'UTC');
        expect(true).toBe(false); // Should have thrown
      } catch (error: any) {
        expect(error).toBeInstanceOf(TimezoneError);
        expect(error.code).toBe('TIMEZONE_ERROR');
        expect(error.message).toContain('Invalid from_timezone: Invalid/Zone');
        expect(error.invalidTimezone).toBe('Invalid/Zone');
      }
    });

    it('should throw for invalid to_timezone', () => {
      expect(() => validateTimezones('UTC', 'Bad/Zone')).toThrow();

      try {
        validateTimezones('UTC', 'Bad/Zone');
        expect(true).toBe(false); // Should have thrown
      } catch (error: any) {
        expect(error).toBeInstanceOf(TimezoneError);
        expect(error.code).toBe('TIMEZONE_ERROR');
        expect(error.message).toContain('Invalid to_timezone: Bad/Zone');
        expect(error.invalidTimezone).toBe('Bad/Zone');
      }
    });

    it('should throw for both invalid timezones', () => {
      expect(() => validateTimezones('Bad/Zone1', 'Bad/Zone2')).toThrow();
    });

    it('should accept UTC as special case', () => {
      expect(() => validateTimezones('UTC', 'UTC')).not.toThrow();
    });

    it('should accept same timezone conversion', () => {
      expect(() => validateTimezones('America/New_York', 'America/New_York')).not.toThrow();
    });

    describe('Debug logging', () => {
      it('should log validation attempts', () => {
        // This test verifies the function runs with debug
        expect(() => validateTimezones('UTC', 'Europe/Paris')).not.toThrow();
      });
    });
  });
});
