import { validateUnit } from '../../src/tools/calculateDuration';
import { resolveTimezone } from '../../src/utils/timezoneUtils';
import { ValidationError } from '../../src/adapters/mcp-sdk/errors';

describe('calculateDuration validation helpers', () => {
  describe('validateUnit', () => {
    it('should return "auto" when undefined', () => {
      expect(validateUnit(undefined)).toBe('auto');
    });

    it('should return the unit when valid', () => {
      expect(validateUnit('auto')).toBe('auto');
      expect(validateUnit('milliseconds')).toBe('milliseconds');
      expect(validateUnit('seconds')).toBe('seconds');
      expect(validateUnit('minutes')).toBe('minutes');
      expect(validateUnit('hours')).toBe('hours');
      expect(validateUnit('days')).toBe('days');
    });

    it('should throw for invalid unit', () => {
      expect(() => validateUnit('invalid')).toThrow();
      expect(() => validateUnit('weeks')).toThrow();
      expect(() => validateUnit('years')).toThrow();

      // Verify the error structure
      try {
        validateUnit('invalid');
      } catch (e: any) {
        expect(e).toBeInstanceOf(ValidationError);
        expect(e.code).toBe('VALIDATION_ERROR');
        expect(e.message).toContain('Invalid unit: invalid');
      }
    });
  });

  describe('resolveTimezone', () => {
    it('should return default timezone when undefined', () => {
      expect(resolveTimezone(undefined, 'America/New_York')).toBe('America/New_York');
    });

    it('should return UTC when empty string', () => {
      expect(resolveTimezone('', 'America/New_York')).toBe('UTC');
    });

    it('should return provided timezone when valid', () => {
      expect(resolveTimezone('Europe/London', 'America/New_York')).toBe('Europe/London');
      expect(resolveTimezone('Asia/Tokyo', 'America/New_York')).toBe('Asia/Tokyo');
    });
  });
});
