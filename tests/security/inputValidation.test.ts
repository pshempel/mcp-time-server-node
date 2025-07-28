import { getCurrentTime } from '../../src/tools/getCurrentTime';
import { convertTimezone } from '../../src/tools/convertTimezone';
import { getBusinessDays } from '../../src/tools/getBusinessDays';
import { daysUntil } from '../../src/tools/daysUntil';
import { TimeServerErrorCodes } from '../../src/types';

describe('Security - Input Validation', () => {
  describe('String Length Limits', () => {
    describe('Timezone validation', () => {
      it('should reject timezone strings over 100 characters', () => {
        const longTimezone = 'x'.repeat(101);

        expect(() => getCurrentTime({ timezone: longTimezone })).toThrow();
        try {
          getCurrentTime({ timezone: longTimezone });
        } catch (e: any) {
          expect(e.error.code).toBe(TimeServerErrorCodes.INVALID_PARAMETER);
          expect(e.error.message).toContain('exceeds maximum length');
        }
      });

      it('should accept timezone strings up to 100 characters', () => {
        // Even though this is invalid, it should pass length check
        const maxTimezone = 'x'.repeat(100);

        try {
          getCurrentTime({ timezone: maxTimezone });
        } catch (e: any) {
          // Should fail timezone validation, not length
          expect(e.error.code).toBe(TimeServerErrorCodes.INVALID_TIMEZONE);
        }
      });
    });

    describe('Date string validation', () => {
      it('should reject date strings over 100 characters', () => {
        const longDate = '2024-01-01' + 'x'.repeat(91);

        expect(() =>
          convertTimezone({
            time: longDate,
            from_timezone: 'UTC',
            to_timezone: 'UTC',
          }),
        ).toThrow();

        try {
          convertTimezone({
            time: longDate,
            from_timezone: 'UTC',
            to_timezone: 'UTC',
          });
        } catch (e: any) {
          expect(e.error.code).toBe(TimeServerErrorCodes.INVALID_PARAMETER);
          expect(e.error.message).toContain('exceeds maximum length');
        }
      });

      it('should accept date strings up to 100 characters', () => {
        const maxDate = '2024-01-01T00:00:00.000Z' + 'x'.repeat(76);

        try {
          convertTimezone({
            time: maxDate,
            from_timezone: 'UTC',
            to_timezone: 'UTC',
          });
        } catch (e: any) {
          // Should fail date parsing, not length
          expect(e.error.code).toBe(TimeServerErrorCodes.INVALID_DATE_FORMAT);
        }
      });
    });

    describe('Format string validation', () => {
      it('should reject format strings over 200 characters', () => {
        const longFormat = 'yyyy-MM-dd' + 'x'.repeat(191);

        expect(() => getCurrentTime({ format: longFormat })).toThrow();
        try {
          getCurrentTime({ format: longFormat });
        } catch (e: any) {
          expect(e.error.code).toBe(TimeServerErrorCodes.INVALID_PARAMETER);
          expect(e.error.message).toContain('exceeds maximum length');
        }
      });

      it('should accept format strings up to 200 characters', () => {
        // This will likely fail date-fns formatting, but should pass length
        const maxFormat = 'yyyy-MM-dd ' + 'H'.repeat(189);

        // Should not throw for length
        expect(() => getCurrentTime({ format: maxFormat })).not.toThrow(/exceeds maximum length/);
      });
    });

    describe('General string validation', () => {
      it('should reject any string parameter over 1000 characters', () => {
        const veryLongString = 'x'.repeat(1001);

        expect(() => daysUntil({ target_date: veryLongString })).toThrow();
        try {
          daysUntil({ target_date: veryLongString });
        } catch (e: any) {
          expect(e.error.code).toBe(TimeServerErrorCodes.INVALID_PARAMETER);
          expect(e.error.message).toContain('exceeds maximum length');
        }
      });
    });
  });

  describe('Array Length Limits', () => {
    it('should reject holiday arrays with more than 365 items', () => {
      const tooManyHolidays = Array(366).fill('2024-01-01');

      expect(() =>
        getBusinessDays({
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          holidays: tooManyHolidays,
        }),
      ).toThrow();

      try {
        getBusinessDays({
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          holidays: tooManyHolidays,
        });
      } catch (e: any) {
        expect(e.error.code).toBe(TimeServerErrorCodes.INVALID_PARAMETER);
        expect(e.error.message).toContain('exceeds maximum array length');
      }
    });

    it('should accept holiday arrays with up to 365 items', () => {
      const maxHolidays = Array(365).fill('2024-01-01');

      // Should not throw for array length
      const result = getBusinessDays({
        start_date: '2024-01-01',
        end_date: '2024-01-02',
        holidays: maxHolidays,
      });

      // The important test is that it doesn't throw for array length
      // The result depends on whether 2024-01-01 is a weekend
      expect(result.business_days).toBeDefined();
      expect(result.business_days).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Special Character Handling', () => {
    it('should safely handle null bytes in strings', () => {
      const nullByteString = 'America/New_York\x00malicious';

      expect(() => getCurrentTime({ timezone: nullByteString })).toThrow();
      try {
        getCurrentTime({ timezone: nullByteString });
      } catch (e: any) {
        // Could be length or validation error, but not a crash
        expect(e.error.code).toBeDefined();
      }
    });

    it('should safely handle unicode and emoji', () => {
      const emojiString = '🔥'.repeat(50);

      expect(() => getCurrentTime({ timezone: emojiString })).toThrow();
      try {
        getCurrentTime({ timezone: emojiString });
      } catch (e: any) {
        expect(e.error.code).toBeDefined();
      }
    });

    it('should safely handle RTL override characters', () => {
      const rtlString = '\u202E' + 'America/New_York';

      expect(() => getCurrentTime({ timezone: rtlString })).toThrow();
      try {
        getCurrentTime({ timezone: rtlString });
      } catch (e: any) {
        expect(e.error.code).toBe(TimeServerErrorCodes.INVALID_TIMEZONE);
      }
    });

    it('should reject path traversal attempts', () => {
      const pathTraversal = '../../../etc/passwd';

      expect(() => getCurrentTime({ timezone: pathTraversal })).toThrow();
      try {
        getCurrentTime({ timezone: pathTraversal });
      } catch (e: any) {
        expect(e.error.code).toBe(TimeServerErrorCodes.INVALID_TIMEZONE);
      }
    });
  });

  describe('Empty and Edge Cases', () => {
    it('should handle empty strings appropriately', () => {
      // Empty timezone should be UTC
      const result = getCurrentTime({ timezone: '' });
      expect(result.timezone).toBe('UTC');
    });

    it('should handle very long but valid format strings', () => {
      // A legitimately long format string
      const longValidFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSxxx '(' EEEE ',' MMMM do ')'";

      // Should work fine if under 200 chars
      expect(() => getCurrentTime({ format: longValidFormat })).not.toThrow();
    });

    it('should handle arrays with mixed valid/invalid dates', () => {
      const mixedDates = [
        '2024-01-01',
        'invalid-date',
        '2024-12-31',
        'x'.repeat(101), // This should trigger length validation
      ];

      expect(() =>
        getBusinessDays({
          start_date: '2024-01-01',
          end_date: '2024-01-02',
          holidays: mixedDates,
        }),
      ).toThrow();

      try {
        getBusinessDays({
          start_date: '2024-01-01',
          end_date: '2024-01-02',
          holidays: mixedDates,
        });
      } catch (e: any) {
        expect(e.error.code).toBe(TimeServerErrorCodes.INVALID_PARAMETER);
        expect(e.error.message).toContain('exceeds maximum length');
      }
    });
  });

  describe('Memory Exhaustion Prevention', () => {
    it('should prevent memory exhaustion via accumulated long strings', () => {
      const longString = 'x'.repeat(900); // Just under limit

      // Try multiple operations with long strings
      const operations: Array<() => any> = [];
      for (let i = 0; i < 10; i++) {
        operations.push(() =>
          getCurrentTime({
            timezone: 'UTC',
            format: longString,
          }),
        );
      }

      // All should complete without memory issues
      operations.forEach((op) => {
        expect(op).not.toThrow(/out of memory/i);
      });
    });
  });
});
