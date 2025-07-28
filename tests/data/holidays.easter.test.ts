import { describe, test, expect } from '@jest/globals';
import { calculateEaster, getEasterBasedHoliday } from '../../src/data/holidays';
import type { Holiday } from '../../src/data/holidays';

describe('Easter Calculation', () => {
  describe('calculateEaster', () => {
    test('should calculate Easter date for known years', () => {
      // Test against known Easter dates
      const knownDates = [
        { year: 2024, month: 3, day: 31 },
        { year: 2025, month: 4, day: 20 },
        { year: 2026, month: 4, day: 5 },
        { year: 2027, month: 3, day: 28 },
        { year: 2028, month: 4, day: 16 },
        { year: 2029, month: 4, day: 1 },
        { year: 2030, month: 4, day: 21 },
      ];

      knownDates.forEach(({ year, month, day }) => {
        const result = calculateEaster(year);
        expect(result).toEqual({ year, month, day });
      });
    });

    test('should handle century boundaries', () => {
      expect(calculateEaster(1900)).toEqual({ year: 1900, month: 4, day: 15 });
      expect(calculateEaster(2000)).toEqual({ year: 2000, month: 4, day: 23 });
      expect(calculateEaster(2100)).toEqual({ year: 2100, month: 3, day: 28 });
      expect(calculateEaster(2200)).toEqual({ year: 2200, month: 4, day: 6 });
    });

    test('should calculate early and late Easter dates', () => {
      // 2008 had an early Easter (March 23)
      expect(calculateEaster(2008)).toEqual({ year: 2008, month: 3, day: 23 });

      // 2038 will have a late Easter (April 25)
      expect(calculateEaster(2038)).toEqual({ year: 2038, month: 4, day: 25 });
    });
  });

  describe('getEasterBasedHoliday', () => {
    test('should calculate Good Friday (2 days before Easter)', () => {
      const holiday: Holiday = {
        name: 'Good Friday',
        type: 'easter-based',
        offset: -2,
        observe: 'always',
      };

      // 2025: Easter is April 20, Good Friday should be April 18
      const goodFriday2025 = getEasterBasedHoliday(holiday, 2025);
      expect(goodFriday2025).toEqual(new Date(2025, 3, 18)); // month is 0-indexed

      // 2024: Easter is March 31, Good Friday should be March 29
      const goodFriday2024 = getEasterBasedHoliday(holiday, 2024);
      expect(goodFriday2024).toEqual(new Date(2024, 2, 29));
    });

    test('should calculate Easter Monday (1 day after Easter)', () => {
      const holiday: Holiday = {
        name: 'Easter Monday',
        type: 'easter-based',
        offset: 1,
        observe: 'always',
      };

      // 2025: Easter is April 20, Easter Monday should be April 21
      const easterMonday2025 = getEasterBasedHoliday(holiday, 2025);
      expect(easterMonday2025).toEqual(new Date(2025, 3, 21));

      // 2024: Easter is March 31, Easter Monday should be April 1
      const easterMonday2024 = getEasterBasedHoliday(holiday, 2024);
      expect(easterMonday2024).toEqual(new Date(2024, 3, 1));
    });

    test('should calculate Easter Sunday (offset 0)', () => {
      const holiday: Holiday = {
        name: 'Easter Sunday',
        type: 'easter-based',
        offset: 0,
        observe: 'always',
      };

      const easterSunday2025 = getEasterBasedHoliday(holiday, 2025);
      expect(easterSunday2025).toEqual(new Date(2025, 3, 20));
    });

    test('should calculate Easter Saturday (1 day before Easter)', () => {
      const holiday: Holiday = {
        name: 'Easter Saturday',
        type: 'easter-based',
        offset: -1,
        observe: 'always',
      };

      const easterSaturday2025 = getEasterBasedHoliday(holiday, 2025);
      expect(easterSaturday2025).toEqual(new Date(2025, 3, 19));
    });

    test('should handle holidays with no offset (default to 0)', () => {
      const holiday: Holiday = {
        name: 'Easter Sunday',
        type: 'easter-based',
        observe: 'always',
      };

      const easter2025 = getEasterBasedHoliday(holiday, 2025);
      expect(easter2025).toEqual(new Date(2025, 3, 20));
    });

    test('should handle large offsets for other Easter-based holidays', () => {
      // Ascension Day is 39 days after Easter
      const ascension: Holiday = {
        name: 'Ascension Day',
        type: 'easter-based',
        offset: 39,
        observe: 'always',
      };

      const ascension2025 = getEasterBasedHoliday(ascension, 2025);
      expect(ascension2025).toEqual(new Date(2025, 4, 29)); // May 29

      // Pentecost is 49 days after Easter
      const pentecost: Holiday = {
        name: 'Pentecost',
        type: 'easter-based',
        offset: 49,
        observe: 'always',
      };

      const pentecost2025 = getEasterBasedHoliday(pentecost, 2025);
      expect(pentecost2025).toEqual(new Date(2025, 5, 8)); // June 8
    });
  });
});

describe('Easter-based holidays in getHolidaysForYear', () => {
  // These tests will fail until implementation is complete
  test('should include Easter-based holidays for UK', () => {
    const { getHolidaysForYear } = require('../../src/data/holidays');
    const ukHolidays2025 = getHolidaysForYear('UK', 2025);

    const goodFriday = ukHolidays2025.find((h: any) => h.name === 'Good Friday');
    const easterMonday = ukHolidays2025.find((h: any) => h.name === 'Easter Monday');

    expect(goodFriday?.date).toEqual(new Date(2025, 3, 18));
    expect(easterMonday?.date).toEqual(new Date(2025, 3, 21));
  });

  test('should include Easter-based holidays for AU', () => {
    const { getHolidaysForYear } = require('../../src/data/holidays');
    const auHolidays2025 = getHolidaysForYear('AU', 2025);

    const goodFriday = auHolidays2025.find((h: any) => h.name === 'Good Friday');
    const easterSaturday = auHolidays2025.find((h: any) => h.name === 'Easter Saturday');
    const easterMonday = auHolidays2025.find((h: any) => h.name === 'Easter Monday');

    expect(goodFriday?.date).toEqual(new Date(2025, 3, 18));
    expect(easterSaturday?.date).toEqual(new Date(2025, 3, 19));
    expect(easterMonday?.date).toEqual(new Date(2025, 3, 21));
  });

  test('should include Good Friday for CA', () => {
    const { getHolidaysForYear } = require('../../src/data/holidays');
    const caHolidays2025 = getHolidaysForYear('CA', 2025);

    const goodFriday = caHolidays2025.find((h: any) => h.name === 'Good Friday');
    expect(goodFriday?.date).toEqual(new Date(2025, 3, 18));
  });
});
