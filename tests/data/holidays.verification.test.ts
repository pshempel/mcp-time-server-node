import { getHolidaysForYear } from '../../src/data/holidays';

/**
 * Automated holiday verification tests
 *
 * These tests verify our holiday data against known correct dates.
 * The expected data should be updated annually from official sources.
 *
 * Official Sources:
 * - US: https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/
 * - UK: https://www.gov.uk/bank-holidays
 * - CA: https://www.canada.ca/en/revenue-agency/services/tax/public-holidays.html
 * - AU: https://www.australia.gov.au/about-australia/special-dates-and-events/public-holidays
 */

interface ExpectedHoliday {
  name: string;
  date: string;
  type: 'fixed' | 'nthWeekday' | 'lastWeekday' | 'easter' | 'special';
  alternateNames?: string[]; // For handling naming variations
}

// Expected holidays for verification - 2025
const expectedHolidays2025: Record<string, ExpectedHoliday[]> = {
  US: [
    { name: "New Year's Day", date: '2025-01-01', type: 'fixed' },
    { name: 'Martin Luther King Jr. Day', date: '2025-01-20', type: 'nthWeekday' },
    { name: 'Presidents Day', date: '2025-02-17', type: 'nthWeekday' },
    { name: 'Memorial Day', date: '2025-05-26', type: 'lastWeekday' },
    {
      name: 'Juneteenth',
      date: '2025-06-19',
      type: 'fixed',
      alternateNames: ['Juneteenth National Independence Day'],
    },
    { name: 'Independence Day', date: '2025-07-04', type: 'fixed' },
    { name: 'Labor Day', date: '2025-09-01', type: 'nthWeekday' },
    { name: 'Columbus Day', date: '2025-10-13', type: 'nthWeekday' },
    { name: 'Veterans Day', date: '2025-11-11', type: 'fixed' },
    { name: 'Thanksgiving', date: '2025-11-27', type: 'nthWeekday' },
    { name: 'Christmas Day', date: '2025-12-25', type: 'fixed' },
  ],
  UK: [
    { name: "New Year's Day", date: '2025-01-01', type: 'fixed' },
    { name: 'Good Friday', date: '2025-04-18', type: 'easter' },
    { name: 'Easter Monday', date: '2025-04-21', type: 'easter' },
    { name: 'Early May Bank Holiday', date: '2025-05-05', type: 'nthWeekday' },
    { name: 'Spring Bank Holiday', date: '2025-05-26', type: 'lastWeekday' },
    { name: 'Summer Bank Holiday', date: '2025-08-25', type: 'lastWeekday' },
    { name: 'Christmas Day', date: '2025-12-25', type: 'fixed' },
    { name: 'Boxing Day', date: '2025-12-26', type: 'fixed' },
  ],
  CA: [
    { name: "New Year's Day", date: '2025-01-01', type: 'fixed' },
    { name: 'Good Friday', date: '2025-04-18', type: 'easter' },
    { name: 'Victoria Day', date: '2025-05-19', type: 'special' },
    { name: 'Canada Day', date: '2025-07-01', type: 'fixed' },
    { name: 'Labour Day', date: '2025-09-01', type: 'nthWeekday' },
    {
      name: 'Thanksgiving',
      date: '2025-10-13',
      type: 'nthWeekday',
      alternateNames: ['Thanksgiving Day'],
    },
    { name: 'Remembrance Day', date: '2025-11-11', type: 'fixed' },
    { name: 'Christmas Day', date: '2025-12-25', type: 'fixed' },
    { name: 'Boxing Day', date: '2025-12-26', type: 'fixed' },
  ],
  AU: [
    { name: "New Year's Day", date: '2025-01-01', type: 'fixed' },
    { name: 'Australia Day', date: '2025-01-26', type: 'fixed' },
    { name: 'Good Friday', date: '2025-04-18', type: 'easter' },
    { name: 'Easter Saturday', date: '2025-04-19', type: 'easter' },
    { name: 'Easter Monday', date: '2025-04-21', type: 'easter' },
    { name: 'Anzac Day', date: '2025-04-25', type: 'fixed' },
    { name: "Queen's Birthday", date: '2025-06-09', type: 'nthWeekday' },
    { name: 'Christmas Day', date: '2025-12-25', type: 'fixed' },
    { name: 'Boxing Day', date: '2025-12-26', type: 'fixed' },
  ],
};

// Expected holidays for 2026 (to test year variations)
const expectedHolidays2026: Record<string, ExpectedHoliday[]> = {
  US: [
    { name: "New Year's Day", date: '2026-01-01', type: 'fixed' },
    { name: 'Martin Luther King Jr. Day', date: '2026-01-19', type: 'nthWeekday' },
    { name: 'Presidents Day', date: '2026-02-16', type: 'nthWeekday' },
    { name: 'Memorial Day', date: '2026-05-25', type: 'lastWeekday' },
    {
      name: 'Juneteenth',
      date: '2026-06-19',
      type: 'fixed',
      alternateNames: ['Juneteenth National Independence Day'],
    },
    { name: 'Independence Day', date: '2026-07-04', type: 'fixed' },
    { name: 'Labor Day', date: '2026-09-07', type: 'nthWeekday' },
    { name: 'Columbus Day', date: '2026-10-12', type: 'nthWeekday' },
    { name: 'Veterans Day', date: '2026-11-11', type: 'fixed' },
    { name: 'Thanksgiving', date: '2026-11-26', type: 'nthWeekday' },
    { name: 'Christmas Day', date: '2026-12-25', type: 'fixed' },
  ],
};

describe('Holiday Data Verification', () => {
  describe('2025 Holiday Verification', () => {
    Object.entries(expectedHolidays2025).forEach(([country, expectedList]) => {
      describe(`${country} holidays`, () => {
        const actualHolidays = getHolidaysForYear(country, 2025);

        it(`should have the correct number of holidays`, () => {
          expect(actualHolidays.length).toBeGreaterThanOrEqual(expectedList.length);
        });

        expectedList.forEach((expected) => {
          it(`should have ${expected.name} on ${expected.date}`, () => {
            // Find holiday by name or alternate names
            const holiday = actualHolidays.find((h) => {
              const normalizedActualName = h.name.toLowerCase();
              const normalizedExpectedName = expected.name.toLowerCase();
              const matchesMainName = normalizedActualName === normalizedExpectedName;
              const matchesAlternateName = expected.alternateNames?.some(
                (alt) => normalizedActualName === alt.toLowerCase(),
              );
              return matchesMainName || matchesAlternateName;
            });

            expect(holiday).toBeDefined();
            if (holiday) {
              const actualDateStr = holiday.date.toISOString().split('T')[0];
              expect(actualDateStr).toBe(expected.date);
            }
          });
        });
      });
    });
  });

  describe('2026 Holiday Verification (US only for now)', () => {
    const country = 'US';
    const expectedList = expectedHolidays2026[country];
    const actualHolidays = getHolidaysForYear(country, 2026);

    expectedList.forEach((expected) => {
      it(`should have ${expected.name} on ${expected.date}`, () => {
        const holiday = actualHolidays.find((h) => {
          const normalizedActualName = h.name.toLowerCase();
          const normalizedExpectedName = expected.name.toLowerCase();
          const matchesMainName = normalizedActualName === normalizedExpectedName;
          const matchesAlternateName = expected.alternateNames?.some(
            (alt) => normalizedActualName === alt.toLowerCase(),
          );
          return matchesMainName || matchesAlternateName;
        });

        expect(holiday).toBeDefined();
        if (holiday) {
          const actualDateStr = holiday.date.toISOString().split('T')[0];
          expect(actualDateStr).toBe(expected.date);
        }
      });
    });
  });

  describe('Holiday Type Verification', () => {
    it('should correctly calculate fixed date holidays', () => {
      const us2025 = getHolidaysForYear('US', 2025);
      const july4 = us2025.find((h) => h.name === 'Independence Day');
      expect(july4?.date.toISOString().split('T')[0]).toBe('2025-07-04');
    });

    it('should correctly calculate nth weekday holidays', () => {
      const us2025 = getHolidaysForYear('US', 2025);
      const mlk = us2025.find((h) => h.name === 'Martin Luther King Jr. Day');
      expect(mlk?.date.toISOString().split('T')[0]).toBe('2025-01-20');
      expect(mlk?.date.getDay()).toBe(1); // Monday
    });

    it('should correctly calculate last weekday holidays', () => {
      const us2025 = getHolidaysForYear('US', 2025);
      const memorial = us2025.find((h) => h.name === 'Memorial Day');
      expect(memorial?.date.toISOString().split('T')[0]).toBe('2025-05-26');
      expect(memorial?.date.getDay()).toBe(1); // Monday
    });

    it('should correctly calculate Easter-based holidays', () => {
      const uk2025 = getHolidaysForYear('UK', 2025);
      const goodFriday = uk2025.find((h) => h.name === 'Good Friday');
      const easterMonday = uk2025.find((h) => h.name === 'Easter Monday');

      expect(goodFriday?.date.toISOString().split('T')[0]).toBe('2025-04-18');
      expect(easterMonday?.date.toISOString().split('T')[0]).toBe('2025-04-21');
    });

    it('should correctly calculate Victoria Day (special rule)', () => {
      const ca2025 = getHolidaysForYear('CA', 2025);
      const victoria = ca2025.find((h) => h.name === 'Victoria Day');
      expect(victoria?.date.toISOString().split('T')[0]).toBe('2025-05-19');
      expect(victoria?.date.getDay()).toBe(1); // Monday
    });
  });

  describe('Multi-year Consistency', () => {
    it('should have consistent holiday counts across years', () => {
      const countries = ['US', 'UK', 'CA', 'AU'];
      countries.forEach((country) => {
        const holidays2025 = getHolidaysForYear(country, 2025);
        const holidays2026 = getHolidaysForYear(country, 2026);

        // Should have same number of holidays (unless new ones added)
        expect(Math.abs(holidays2025.length - holidays2026.length)).toBeLessThanOrEqual(1);
      });
    });

    it('should calculate weekday holidays correctly across years', () => {
      // MLK Day should always be 3rd Monday in January
      const mlk2025 = getHolidaysForYear('US', 2025).find(
        (h) => h.name === 'Martin Luther King Jr. Day',
      );
      const mlk2026 = getHolidaysForYear('US', 2026).find(
        (h) => h.name === 'Martin Luther King Jr. Day',
      );

      expect(mlk2025?.date.getDay()).toBe(1); // Monday
      expect(mlk2026?.date.getDay()).toBe(1); // Monday
      expect(mlk2025?.date.getDate()).toBeGreaterThanOrEqual(15);
      expect(mlk2025?.date.getDate()).toBeLessThanOrEqual(21);
      expect(mlk2026?.date.getDate()).toBeGreaterThanOrEqual(15);
      expect(mlk2026?.date.getDate()).toBeLessThanOrEqual(21);
    });
  });
});
