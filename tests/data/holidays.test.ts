import {
  getHolidayDefinitions,
  getHolidaysForYear,
  calculateFloatingHoliday,
  calculateFixedHoliday,
  getObservedDate,
  isHoliday,
} from '../../src/data/holidays';

describe('Holiday Data Module', () => {
  describe('getHolidayDefinitions', () => {
    it('should return holiday definitions for US', () => {
      const usHolidays = getHolidayDefinitions('US');
      expect(usHolidays).toBeDefined();
      expect(usHolidays.length).toBeGreaterThan(0);

      // Check for major US holidays
      const holidayNames = usHolidays.map((h) => h.name);
      expect(holidayNames).toContain("New Year's Day");
      expect(holidayNames).toContain('Independence Day');
      expect(holidayNames).toContain('Christmas Day');
      expect(holidayNames).toContain('Thanksgiving');
    });

    it('should return holiday definitions for UK', () => {
      const ukHolidays = getHolidayDefinitions('UK');
      expect(ukHolidays).toBeDefined();
      expect(ukHolidays.length).toBeGreaterThan(0);

      const holidayNames = ukHolidays.map((h) => h.name);
      expect(holidayNames).toContain("New Year's Day");
      expect(holidayNames).toContain('Christmas Day');
      expect(holidayNames).toContain('Boxing Day');
    });

    it('should return empty array for unknown country', () => {
      const unknownHolidays = getHolidayDefinitions('XX');
      expect(unknownHolidays).toEqual([]);
    });
  });

  describe('calculateFixedHoliday', () => {
    it('should calculate fixed holiday date for a year', () => {
      const holiday = {
        name: 'Independence Day',
        type: 'fixed' as const,
        month: 7,
        day: 4,
        observe: 'us_federal' as const,
      };

      const date = calculateFixedHoliday(holiday, 2025);
      expect(date).toEqual(new Date(2025, 6, 4)); // July 4, 2025
    });

    it('should handle leap year for Feb 29', () => {
      const holiday = {
        name: 'Leap Day',
        type: 'fixed' as const,
        month: 2,
        day: 29,
        observe: 'never' as const,
      };

      const date2024 = calculateFixedHoliday(holiday, 2024);
      expect(date2024).toEqual(new Date(2024, 1, 29));

      const date2025 = calculateFixedHoliday(holiday, 2025);
      expect(date2025).toBeNull(); // Not a leap year
    });
  });

  describe('calculateFloatingHoliday', () => {
    it('should calculate MLK Day (3rd Monday in January)', () => {
      const holiday = {
        name: 'Martin Luther King Jr. Day',
        type: 'floating' as const,
        month: 1,
        weekday: 1, // Monday
        occurrence: 3, // 3rd
        observe: 'always' as const,
      };

      const date2025 = calculateFloatingHoliday(holiday, 2025);
      expect(date2025).toEqual(new Date(2025, 0, 20)); // January 20, 2025

      const date2024 = calculateFloatingHoliday(holiday, 2024);
      expect(date2024).toEqual(new Date(2024, 0, 15)); // January 15, 2024
    });

    it('should calculate Thanksgiving (4th Thursday in November)', () => {
      const holiday = {
        name: 'Thanksgiving',
        type: 'floating' as const,
        month: 11,
        weekday: 4, // Thursday
        occurrence: 4, // 4th
        observe: 'always' as const,
      };

      const date2025 = calculateFloatingHoliday(holiday, 2025);
      expect(date2025).toEqual(new Date(2025, 10, 27)); // November 27, 2025
    });

    it('should calculate Memorial Day (last Monday in May)', () => {
      const holiday = {
        name: 'Memorial Day',
        type: 'floating' as const,
        month: 5,
        weekday: 1, // Monday
        occurrence: -1, // Last
        observe: 'always' as const,
      };

      const date2025 = calculateFloatingHoliday(holiday, 2025);
      expect(date2025).toEqual(new Date(2025, 4, 26)); // May 26, 2025
    });

    it('should return null for non-existent occurrence', () => {
      const holiday = {
        name: 'Fifth Monday',
        type: 'floating' as const,
        month: 2, // February
        weekday: 1, // Monday
        occurrence: 5, // 5th (doesn't exist in Feb)
        observe: 'always' as const,
      };

      const date = calculateFloatingHoliday(holiday, 2025);
      expect(date).toBeNull();
    });
  });

  describe('getObservedDate', () => {
    it('should apply US Federal observation rules', () => {
      // Saturday -> Friday
      const july4_2026 = new Date(2026, 6, 4); // Saturday
      const observed = getObservedDate(july4_2026, 'us_federal');
      expect(observed).toEqual(new Date(2026, 6, 3)); // Friday

      // Sunday -> Monday
      const july4_2027 = new Date(2027, 6, 4); // Sunday
      const observed2 = getObservedDate(july4_2027, 'us_federal');
      expect(observed2).toEqual(new Date(2027, 6, 5)); // Monday

      // Weekday -> Same day
      const july4_2025 = new Date(2025, 6, 4); // Friday
      const observed3 = getObservedDate(july4_2025, 'us_federal');
      expect(observed3).toEqual(july4_2025);
    });

    it('should apply UK Bank holiday rules', () => {
      // Saturday -> Monday
      const christmas2027 = new Date(2027, 11, 25); // Saturday
      const observed = getObservedDate(christmas2027, 'uk_bank');
      expect(observed).toEqual(new Date(2027, 11, 27)); // Monday

      // Sunday -> Monday
      const boxing2027 = new Date(2027, 11, 26); // Sunday
      const observed2 = getObservedDate(boxing2027, 'uk_bank');
      expect(observed2).toEqual(new Date(2027, 11, 27)); // Monday
    });

    it('should not observe when rule is "never"', () => {
      const saturday = new Date(2026, 6, 4);
      const observed = getObservedDate(saturday, 'never');
      expect(observed).toEqual(saturday);
    });

    it('should always use actual date when rule is "always"', () => {
      const weekday = new Date(2025, 6, 4); // Friday
      const observed = getObservedDate(weekday, 'always');
      expect(observed).toEqual(weekday);
    });
  });

  describe('getHolidaysForYear', () => {
    it('should return all US holidays for 2025', () => {
      const holidays = getHolidaysForYear('US', 2025);

      // Check we have the right number
      expect(holidays.length).toBeGreaterThanOrEqual(10); // Federal holidays

      // Check specific holidays
      const dates = holidays.map((h) => h.date.toISOString().split('T')[0]);
      expect(dates).toContain('2025-01-01'); // New Year's
      expect(dates).toContain('2025-01-20'); // MLK Day
      expect(dates).toContain('2025-07-04'); // Independence Day
      expect(dates).toContain('2025-11-27'); // Thanksgiving
      expect(dates).toContain('2025-12-25'); // Christmas
    });

    it('should include observed dates when different from actual', () => {
      const holidays2026 = getHolidaysForYear('US', 2026);

      // July 4, 2026 is Saturday, observed on Friday
      const july4 = holidays2026.find((h) => h.name === 'Independence Day');
      expect(july4).toBeDefined();
      expect(july4!.date.toISOString().split('T')[0]).toBe('2026-07-04');
      expect(july4!.observedDate?.toISOString().split('T')[0]).toBe('2026-07-03');
    });

    it('should return empty array for unknown country', () => {
      const holidays = getHolidaysForYear('XX', 2025);
      expect(holidays).toEqual([]);
    });
  });

  describe('isHoliday', () => {
    it('should identify US holidays', () => {
      const newYears2025 = new Date(2025, 0, 1);
      const july4_2025 = new Date(2025, 6, 4);
      const randomDay = new Date(2025, 2, 15);

      expect(isHoliday(newYears2025, 'US')).toBe(true);
      expect(isHoliday(july4_2025, 'US')).toBe(true);
      expect(isHoliday(randomDay, 'US')).toBe(false);
    });

    it('should check observed dates', () => {
      // July 3, 2026 is observed Independence Day
      const july3_2026 = new Date(2026, 6, 3);
      expect(isHoliday(july3_2026, 'US', { checkObserved: true })).toBe(true);
      expect(isHoliday(july3_2026, 'US', { checkObserved: false })).toBe(false);
    });
  });
});
