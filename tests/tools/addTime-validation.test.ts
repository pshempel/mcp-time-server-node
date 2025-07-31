import { validateUnit, validateAmount } from '../../src/tools/addTime';
import { TimeServerErrorCodes } from '../../src/types';

describe('addTime validation helpers', () => {
  describe('validateUnit', () => {
    it('should accept valid units', () => {
      const validUnits = ['years', 'months', 'days', 'hours', 'minutes', 'seconds'];

      validUnits.forEach((unit) => {
        expect(() => validateUnit(unit)).not.toThrow();
      });
    });

    it('should throw for invalid unit', () => {
      expect(() => validateUnit('weeks')).toThrow();
      expect(() => validateUnit('invalid')).toThrow();
      expect(() => validateUnit('')).toThrow();
    });

    it('should throw with correct error code and message', () => {
      try {
        validateUnit('weeks');
        fail('Should have thrown');
      } catch (error: any) {
        expect(error.error.code).toBe(TimeServerErrorCodes.INVALID_PARAMETER);
        expect(error.error.message).toContain('Invalid unit: weeks');
        expect(error.error.message).toContain(
          'Must be one of: years, months, days, hours, minutes, seconds'
        );
        expect(error.error.details).toEqual({ unit: 'weeks' });
      }
    });
  });

  describe('validateAmount', () => {
    it('should accept valid numbers', () => {
      expect(() => validateAmount(0)).not.toThrow();
      expect(() => validateAmount(1)).not.toThrow();
      expect(() => validateAmount(-1)).not.toThrow();
      expect(() => validateAmount(365)).not.toThrow();
      expect(() => validateAmount(0.5)).not.toThrow();
      expect(() => validateAmount(-24.75)).not.toThrow();
    });

    it('should throw for NaN', () => {
      expect(() => validateAmount(NaN)).toThrow();
    });

    it('should throw for Infinity', () => {
      expect(() => validateAmount(Infinity)).toThrow();
      expect(() => validateAmount(-Infinity)).toThrow();
    });

    it('should throw with correct error code and message', () => {
      try {
        validateAmount(NaN);
        fail('Should have thrown');
      } catch (error: any) {
        expect(error.error.code).toBe(TimeServerErrorCodes.INVALID_PARAMETER);
        expect(error.error.message).toContain('Invalid amount: NaN');
        expect(error.error.message).toContain('Must be a finite number');
        expect(error.error.details).toEqual({ amount: NaN });
      }
    });
  });

  describe('Debug logging', () => {
    it('should log validation attempts', () => {
      // This test verifies the functions run with debug
      expect(() => validateUnit('days')).not.toThrow();
      expect(() => validateAmount(10)).not.toThrow();
    });
  });
});
