import { calculateFloatingHoliday, getObservedDate, type Holiday } from '../../src/data/holidays';
import { addDays } from 'date-fns';

describe('Holidays Refactoring Tests', () => {
  describe('calculateFloatingHoliday edge cases', () => {
    it('should handle Victoria Day special case', () => {
      const victoriaDay: Holiday = {
        name: 'Victoria Day',
        type: 'floating',
        month: 5,
        weekday: 1,
        occurrence: -2, // Special marker for Victoria Day
        observe: 'always',
      };

      // Test multiple years
      const tests = [
        { year: 2025, expected: new Date(2025, 4, 19) }, // May 24 is Saturday
        { year: 2024, expected: new Date(2024, 4, 20) }, // May 24 is Friday
        { year: 2023, expected: new Date(2023, 4, 22) }, // May 24 is Wednesday
      ];

      tests.forEach(({ year, expected }) => {
        const result = calculateFloatingHoliday(victoriaDay, year);
        expect(result).toEqual(expected);
      });
    });

    it('should handle last occurrence correctly', () => {
      const memorialDay: Holiday = {
        name: 'Memorial Day',
        type: 'floating',
        month: 5,
        weekday: 1, // Monday
        occurrence: -1, // Last
        observe: 'always',
      };

      const result = calculateFloatingHoliday(memorialDay, 2025);
      expect(result).toEqual(new Date(2025, 4, 26)); // Last Monday in May
    });

    it('should handle nth occurrence that exceeds month', () => {
      const invalid: Holiday = {
        name: 'Invalid',
        type: 'floating',
        month: 2, // February
        weekday: 1, // Monday
        occurrence: 5, // 5th Monday (doesn't exist in Feb)
        observe: 'always',
      };

      const result = calculateFloatingHoliday(invalid, 2025);
      expect(result).toBeNull();
    });

    it('should return null for invalid holiday type', () => {
      const invalid: Holiday = {
        name: 'Invalid',
        type: 'fixed', // Wrong type
        month: 5,
        weekday: 1,
        occurrence: 1,
        observe: 'always',
      };

      const result = calculateFloatingHoliday(invalid, 2025);
      expect(result).toBeNull();
    });
  });

  describe('getObservedDate behavior', () => {
    // Test dates: Fri, Sat, Sun, Mon, Tue, Wed, Thu
    const testDates = [
      { date: new Date(2025, 6, 4), day: 'Friday' }, // July 4
      { date: new Date(2025, 6, 5), day: 'Saturday' }, // July 5
      { date: new Date(2025, 6, 6), day: 'Sunday' }, // July 6
      { date: new Date(2025, 6, 7), day: 'Monday' }, // July 7
      { date: new Date(2025, 6, 1), day: 'Tuesday' }, // July 1
      { date: new Date(2025, 6, 2), day: 'Wednesday' }, // July 2
      { date: new Date(2025, 6, 3), day: 'Thursday' }, // July 3
    ];

    describe('us_federal rule', () => {
      it('should move Saturday to Friday and Sunday to Monday', () => {
        const saturday = testDates[1].date;
        const sunday = testDates[2].date;

        expect(getObservedDate(saturday, 'us_federal')).toEqual(addDays(saturday, -1));
        expect(getObservedDate(sunday, 'us_federal')).toEqual(addDays(sunday, 1));
      });

      it('should not move weekdays', () => {
        [0, 3, 4, 5, 6].forEach((i) => {
          const date = testDates[i].date;
          expect(getObservedDate(date, 'us_federal')).toEqual(date);
        });
      });
    });

    describe('uk_bank rule', () => {
      it('should move both Saturday and Sunday to Monday', () => {
        const saturday = testDates[1].date;
        const sunday = testDates[2].date;

        expect(getObservedDate(saturday, 'uk_bank')).toEqual(addDays(saturday, 2));
        expect(getObservedDate(sunday, 'uk_bank')).toEqual(addDays(sunday, 1));
      });
    });

    describe('au_public rule', () => {
      it('should move Sunday to Monday but keep Saturday', () => {
        const saturday = testDates[1].date;
        const sunday = testDates[2].date;

        expect(getObservedDate(saturday, 'au_public')).toEqual(saturday);
        expect(getObservedDate(sunday, 'au_public')).toEqual(addDays(sunday, 1));
      });
    });

    describe('cl_monday rule', () => {
      it('should move Tue/Wed/Thu to previous Monday', () => {
        const tuesday = testDates[4].date;
        const wednesday = testDates[5].date;
        const thursday = testDates[6].date;
        const previousMonday = new Date(2025, 5, 30); // June 30

        expect(getObservedDate(tuesday, 'cl_monday')).toEqual(previousMonday);
        expect(getObservedDate(wednesday, 'cl_monday')).toEqual(previousMonday);
        expect(getObservedDate(thursday, 'cl_monday')).toEqual(previousMonday);
      });

      it('should move Sat/Sun to next Monday', () => {
        const saturday = testDates[1].date;
        const sunday = testDates[2].date;
        const nextMonday = testDates[3].date;

        expect(getObservedDate(saturday, 'cl_monday')).toEqual(nextMonday);
        expect(getObservedDate(sunday, 'cl_monday')).toEqual(nextMonday);
      });

      it('should not move Monday or Friday', () => {
        const monday = testDates[3].date;
        const friday = testDates[0].date;

        expect(getObservedDate(monday, 'cl_monday')).toEqual(monday);
        expect(getObservedDate(friday, 'cl_monday')).toEqual(friday);
      });
    });

    describe('never and always rules', () => {
      it('should return original date', () => {
        testDates.forEach(({ date }) => {
          expect(getObservedDate(date, 'never')).toEqual(date);
          expect(getObservedDate(date, 'always')).toEqual(date);
        });
      });
    });

    describe('unknown rule', () => {
      it('should return original date for unknown rule', () => {
        const date = testDates[0].date;
        expect(getObservedDate(date, 'unknown_rule')).toEqual(date);
      });
    });
  });
});
