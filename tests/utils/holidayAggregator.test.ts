import { aggregateHolidays } from '../../src/utils/holidayAggregator';
import { getHolidaysForYear } from '../../src/data/holidays';

// Mock the holidays data module
jest.mock('../../src/data/holidays');

describe('holidayAggregator', () => {
  const mockGetHolidaysForYear = getHolidaysForYear as jest.MockedFunction<
    typeof getHolidaysForYear
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('aggregateHolidays', () => {
    it('should return empty set when no holiday sources provided', () => {
      const result = aggregateHolidays({
        includeObserved: false,
        timezone: 'UTC',
        dateRange: {
          start: new Date('2025-01-01'),
          end: new Date('2025-12-31'),
        },
      });

      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(0);
    });

    it('should aggregate calendar holidays with observed dates', () => {
      mockGetHolidaysForYear.mockReturnValue([
        {
          date: new Date('2025-01-01'),
          observedDate: new Date('2025-01-01'),
          name: 'New Year',
        },
        {
          date: new Date('2025-07-04'),
          observedDate: new Date('2025-07-03'), // Friday observance
          name: 'Independence Day',
        },
      ]);

      const result = aggregateHolidays({
        calendar: 'US',
        includeObserved: true,
        timezone: 'America/New_York',
        dateRange: {
          start: new Date('2025-01-01'),
          end: new Date('2025-12-31'),
        },
      });

      // Should use observed dates when includeObserved is true
      expect(result.has(new Date('2025-01-01').toDateString())).toBe(true); // Same as observed
      expect(result.has(new Date('2025-07-04').toDateString())).toBe(false); // Not included, observed used instead
      expect(result.has(new Date('2025-07-03').toDateString())).toBe(true); // Observed date
      expect(result.size).toBe(2);
    });

    it('should aggregate calendar holidays without observed dates', () => {
      mockGetHolidaysForYear.mockReturnValue([
        {
          date: new Date('2025-01-01'),
          observedDate: new Date('2025-01-01'),
          name: 'New Year',
        },
        {
          date: new Date('2025-07-04'),
          observedDate: new Date('2025-07-03'),
          name: 'Independence Day',
        },
      ]);

      const result = aggregateHolidays({
        calendar: 'US',
        includeObserved: false,
        timezone: 'America/New_York',
        dateRange: {
          start: new Date('2025-01-01'),
          end: new Date('2025-12-31'),
        },
      });

      // Should only include actual dates, not observed
      expect(result.has(new Date('2025-01-01').toDateString())).toBe(true);
      expect(result.has(new Date('2025-07-04').toDateString())).toBe(true);
      expect(result.has(new Date('2025-07-03').toDateString())).toBe(false);
      expect(result.size).toBe(2);
    });

    it('should aggregate custom holidays', () => {
      const result = aggregateHolidays({
        custom: ['2025-03-15', '2025-06-20', '2025-09-01'],
        includeObserved: false,
        timezone: 'UTC',
        dateRange: {
          start: new Date('2025-01-01'),
          end: new Date('2025-12-31'),
        },
      });

      expect(result.has(new Date('2025-03-15').toDateString())).toBe(true);
      expect(result.has(new Date('2025-06-20').toDateString())).toBe(true);
      expect(result.has(new Date('2025-09-01').toDateString())).toBe(true);
      expect(result.size).toBe(3);
    });

    it('should aggregate legacy holidays parameter', () => {
      const result = aggregateHolidays({
        legacy: ['2025-02-14', '2025-10-31'],
        includeObserved: false,
        timezone: 'UTC',
        dateRange: {
          start: new Date('2025-01-01'),
          end: new Date('2025-12-31'),
        },
      });

      expect(result.has(new Date('2025-02-14').toDateString())).toBe(true);
      expect(result.has(new Date('2025-10-31').toDateString())).toBe(true);
      expect(result.size).toBe(2);
    });

    it('should merge all three holiday sources without duplicates', () => {
      mockGetHolidaysForYear.mockReturnValue([
        {
          date: new Date('2025-01-01'),
          observedDate: new Date('2025-01-01'),
          name: 'New Year',
        },
      ]);

      const result = aggregateHolidays({
        calendar: 'US',
        custom: ['2025-01-01', '2025-03-15'], // Duplicate New Year
        legacy: ['2025-03-15', '2025-06-20'], // Duplicate March 15
        includeObserved: false,
        timezone: 'UTC',
        dateRange: {
          start: new Date('2025-01-01'),
          end: new Date('2025-12-31'),
        },
      });

      // Should deduplicate across all sources
      expect(result.has(new Date('2025-01-01').toDateString())).toBe(true);
      expect(result.has(new Date('2025-03-15').toDateString())).toBe(true);
      expect(result.has(new Date('2025-06-20').toDateString())).toBe(true);
      expect(result.size).toBe(3); // No duplicates
    });

    it('should handle holidays across year boundaries', () => {
      mockGetHolidaysForYear.mockImplementation((_country: string, year: number) => {
        if (year === 2024) {
          return [
            {
              date: new Date('2024-12-25'),
              observedDate: new Date('2024-12-25'),
              name: 'Christmas',
            },
          ];
        } else if (year === 2025) {
          return [
            {
              date: new Date('2025-01-01'),
              observedDate: new Date('2025-01-01'),
              name: 'New Year',
            },
          ];
        }
        return [];
      });

      const result = aggregateHolidays({
        calendar: 'US',
        includeObserved: false,
        timezone: 'UTC',
        dateRange: {
          start: new Date('2024-12-20'),
          end: new Date('2025-01-10'),
        },
      });

      expect(result.has(new Date('2024-12-25').toDateString())).toBe(true);
      expect(result.has(new Date('2025-01-01').toDateString())).toBe(true);
      expect(result.size).toBe(2);
      expect(mockGetHolidaysForYear).toHaveBeenCalledWith('US', 2024);
      expect(mockGetHolidaysForYear).toHaveBeenCalledWith('US', 2025);
    });

    it('should throw error for invalid calendar code', () => {
      mockGetHolidaysForYear.mockImplementation(() => {
        throw new Error('Invalid country code: INVALID');
      });

      expect(() => {
        aggregateHolidays({
          calendar: 'INVALID',
          includeObserved: false,
          timezone: 'UTC',
          dateRange: {
            start: new Date('2025-01-01'),
            end: new Date('2025-12-31'),
          },
        });
      }).toThrow('Invalid country code: INVALID');
    });

    it('should handle invalid custom holiday dates gracefully', () => {
      expect(() => {
        aggregateHolidays({
          custom: ['2025-01-01', 'invalid-date', '2025-03-15'],
          includeObserved: false,
          timezone: 'UTC',
          dateRange: {
            start: new Date('2025-01-01'),
            end: new Date('2025-12-31'),
          },
        });
      }).toThrow(); // Should throw on invalid date
    });

    it('should handle empty arrays for custom and legacy holidays', () => {
      const result = aggregateHolidays({
        custom: [],
        legacy: [],
        includeObserved: false,
        timezone: 'UTC',
        dateRange: {
          start: new Date('2025-01-01'),
          end: new Date('2025-12-31'),
        },
      });

      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(0);
    });

    it('should handle timezone-aware date parsing for custom holidays', () => {
      const result = aggregateHolidays({
        custom: ['2025-01-01T00:00:00-05:00'], // EST timestamp
        includeObserved: false,
        timezone: 'America/New_York',
        dateRange: {
          start: new Date('2025-01-01'),
          end: new Date('2025-12-31'),
        },
      });

      // Should parse correctly in the specified timezone
      expect(result.size).toBe(1);
    });

    it('should only include holidays within the specified date range', () => {
      mockGetHolidaysForYear.mockReturnValue([
        { date: new Date('2025-01-01'), observedDate: new Date('2025-01-01'), name: 'New Year' },
        {
          date: new Date('2025-07-04'),
          observedDate: new Date('2025-07-04'),
          name: 'Independence Day',
        },
        { date: new Date('2025-12-25'), observedDate: new Date('2025-12-25'), name: 'Christmas' },
      ]);

      const result = aggregateHolidays({
        calendar: 'US',
        custom: ['2025-02-14', '2025-10-31'],
        includeObserved: false,
        timezone: 'UTC',
        dateRange: {
          start: new Date('2025-03-01'),
          end: new Date('2025-09-30'),
        },
      });

      // Calendar holidays are added for entire years (not filtered by range)
      // Custom holidays ARE filtered by date range
      expect(result.has(new Date('2025-01-01').toDateString())).toBe(true); // Calendar holiday (year 2025)
      expect(result.has(new Date('2025-02-14').toDateString())).toBe(false); // Custom, before range
      expect(result.has(new Date('2025-07-04').toDateString())).toBe(true); // Calendar holiday (in range)
      expect(result.has(new Date('2025-10-31').toDateString())).toBe(false); // Custom, after range
      expect(result.has(new Date('2025-12-25').toDateString())).toBe(true); // Calendar holiday (year 2025)
    });
  });
});
