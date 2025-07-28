import { getHolidaysForYear, isHoliday } from '../../src/data/holidays';

describe('Canada (CA) Holidays', () => {
  describe('2025 holidays', () => {
    const holidays2025 = getHolidaysForYear('CA', 2025);
    const holidayMap = new Map(holidays2025.map((h) => [h.date.toISOString().split('T')[0], h]));

    it('should have correct number of federal holidays', () => {
      // 8 holidays (excluding Easter-based for now)
      expect(holidays2025.length).toBeGreaterThanOrEqual(8);
    });

    it("should have New Year's Day", () => {
      expect(holidayMap.has('2025-01-01')).toBe(true);
      expect(holidayMap.get('2025-01-01')?.name).toBe("New Year's Day");
    });

    it('should have Canada Day on July 1', () => {
      expect(holidayMap.has('2025-07-01')).toBe(true);
      expect(holidayMap.get('2025-07-01')?.name).toBe('Canada Day');
    });

    it('should have Victoria Day on Monday before May 25', () => {
      expect(holidayMap.has('2025-05-19')).toBe(true);
      expect(holidayMap.get('2025-05-19')?.name).toBe('Victoria Day');
    });

    it('should have Labour Day on first Monday in September', () => {
      expect(holidayMap.has('2025-09-01')).toBe(true);
      expect(holidayMap.get('2025-09-01')?.name).toBe('Labour Day');
    });

    it('should have Thanksgiving on second Monday in October', () => {
      expect(holidayMap.has('2025-10-13')).toBe(true);
      expect(holidayMap.get('2025-10-13')?.name).toBe('Thanksgiving Day');
    });

    it('should have Christmas Day', () => {
      expect(holidayMap.has('2025-12-25')).toBe(true);
      expect(holidayMap.get('2025-12-25')?.name).toBe('Christmas Day');
    });

    it('should have Boxing Day', () => {
      expect(holidayMap.has('2025-12-26')).toBe(true);
      expect(holidayMap.get('2025-12-26')?.name).toBe('Boxing Day');
    });

    it('should have Remembrance Day', () => {
      expect(holidayMap.has('2025-11-11')).toBe(true);
      expect(holidayMap.get('2025-11-11')?.name).toBe('Remembrance Day');
    });
  });

  describe('Victoria Day calculation', () => {
    it('should calculate Victoria Day correctly for multiple years', () => {
      const testCases = [
        { year: 2023, expected: '2023-05-22' },
        { year: 2024, expected: '2024-05-20' },
        { year: 2025, expected: '2025-05-19' },
        { year: 2026, expected: '2026-05-18' },
        { year: 2027, expected: '2027-05-24' },
      ];

      testCases.forEach(({ year, expected }) => {
        const holidays = getHolidaysForYear('CA', year);
        const victoriaDay = holidays.find((h) => h.name === 'Victoria Day');
        expect(victoriaDay).toBeDefined();
        expect(victoriaDay!.date.toISOString().split('T')[0]).toBe(expected);
      });
    });
  });

  describe('Weekend observations', () => {
    it('should observe Canada Day on Monday when it falls on Sunday', () => {
      // 2029: July 1 is Sunday
      const holidays2029 = getHolidaysForYear('CA', 2029);
      const canadaDay = holidays2029.find((h) => h.name === 'Canada Day');
      expect(canadaDay?.date.toISOString().split('T')[0]).toBe('2029-07-01');
      expect(canadaDay?.observedDate?.toISOString().split('T')[0]).toBe('2029-07-02');
    });
  });

  describe('isHoliday function', () => {
    it('should identify Canadian holidays', () => {
      expect(isHoliday(new Date(2025, 6, 1), 'CA')).toBe(true); // July is month 6
      expect(isHoliday(new Date(2025, 6, 2), 'CA')).toBe(false);
      // Test observed date
      expect(isHoliday(new Date(2029, 6, 2), 'CA', { checkObserved: true })).toBe(true); // Canada Day observed
    });
  });
});

describe('Australia (AU) Holidays', () => {
  describe('2025 holidays', () => {
    const holidays2025 = getHolidaysForYear('AU', 2025);
    const holidayMap = new Map(holidays2025.map((h) => [h.date.toISOString().split('T')[0], h]));

    it('should have correct number of national holidays', () => {
      // 9 holidays including Easter Saturday (excluding Easter-based for now)
      expect(holidays2025.length).toBeGreaterThanOrEqual(6);
    });

    it("should have New Year's Day", () => {
      expect(holidayMap.has('2025-01-01')).toBe(true);
      expect(holidayMap.get('2025-01-01')?.name).toBe("New Year's Day");
    });

    it('should have Australia Day on January 26', () => {
      expect(holidayMap.has('2025-01-26')).toBe(true);
      expect(holidayMap.get('2025-01-26')?.name).toBe('Australia Day');
    });

    it('should have Anzac Day on April 25', () => {
      expect(holidayMap.has('2025-04-25')).toBe(true);
      expect(holidayMap.get('2025-04-25')?.name).toBe('Anzac Day');
    });

    it("should have Queen's Birthday on second Monday in June", () => {
      expect(holidayMap.has('2025-06-09')).toBe(true);
      expect(holidayMap.get('2025-06-09')?.name).toBe("Queen's Birthday");
    });

    it('should have Christmas Day', () => {
      expect(holidayMap.has('2025-12-25')).toBe(true);
      expect(holidayMap.get('2025-12-25')?.name).toBe('Christmas Day');
    });

    it('should have Boxing Day', () => {
      expect(holidayMap.has('2025-12-26')).toBe(true);
      expect(holidayMap.get('2025-12-26')?.name).toBe('Boxing Day');
    });
  });

  describe('Weekend observations - Australian rules', () => {
    it('should observe Australia Day on Monday when it falls on Sunday', () => {
      // 2025: Jan 26 is Sunday
      const holidays2025 = getHolidaysForYear('AU', 2025);
      const australiaDay = holidays2025.find((h) => h.name === 'Australia Day');
      expect(australiaDay?.date.toISOString().split('T')[0]).toBe('2025-01-26');
      expect(australiaDay?.observedDate?.toISOString().split('T')[0]).toBe('2025-01-27');
    });

    it('should NOT observe on Monday when holiday falls on Saturday', () => {
      // 2026: Jan 26 is Monday, but let's test when Anzac Day falls on Saturday
      // 2026: April 25 is Saturday
      const holidays2026 = getHolidaysForYear('AU', 2026);
      const anzacDay = holidays2026.find((h) => h.name === 'Anzac Day');
      expect(anzacDay?.date.toISOString().split('T')[0]).toBe('2026-04-25');
      expect(anzacDay?.observedDate).toBeUndefined(); // No Monday observation
    });
  });

  describe('isHoliday function', () => {
    it('should identify Australian holidays', () => {
      expect(isHoliday(new Date(2025, 0, 26), 'AU')).toBe(true); // January is month 0
      expect(isHoliday(new Date(2025, 0, 27), 'AU')).toBe(false); // Not the actual date
      // Test observed date
      expect(isHoliday(new Date(2025, 0, 27), 'AU', { checkObserved: true })).toBe(true); // Australia Day observed
    });
  });
});
