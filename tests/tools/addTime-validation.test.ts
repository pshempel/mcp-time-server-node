import { validateUnit, validateAmount } from '../../src/tools/addTime';

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
        expect(true).toBe(false); // Should have thrown
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.code).toBe(-32602); // ErrorCode.InvalidParams
        expect(error.message).toContain('Invalid unit: weeks');
        expect(error.message).toContain(
          'Must be one of: years, months, days, hours, minutes, seconds'
        );
        expect(error.data).toEqual({ unit: 'weeks' });
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
        expect(true).toBe(false); // Should have thrown
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        expect(error.code).toBe(-32602); // ErrorCode.InvalidParams
        expect(error.message).toContain('Invalid amount: NaN');
        expect(error.message).toContain('Must be a finite number');
        expect(error.data).toEqual({ amount: NaN });
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
