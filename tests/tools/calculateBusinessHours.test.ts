import { calculateBusinessHours } from '../../src/tools/calculateBusinessHours';
import { getConfig } from '../../src/utils/config';
import { cache } from '../../src/cache/timeCache';
import type { CalculateBusinessHoursParams, CalculateBusinessHoursResult } from '../../src/types';

// Mock dependencies
jest.mock('../../src/utils/config');
jest.mock('../../src/cache/timeCache');

describe('calculateBusinessHours', () => {
  const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>;
  const mockCache = cache as jest.Mocked<typeof cache>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetConfig.mockReturnValue({ defaultTimezone: 'America/Indianapolis' });
    mockCache.get.mockReturnValue(undefined);
    mockCache.set.mockImplementation(() => true);
  });

  describe('Basic functionality', () => {
    it('should calculate business hours for a single day within business hours', () => {
      const params: CalculateBusinessHoursParams = {
        start_time: '2025-01-20T10:00:00',
        end_time: '2025-01-20T15:00:00',
      };

      const result = calculateBusinessHours(params);

      expect(result.total_business_minutes).toBe(300); // 5 hours
      expect(result.total_business_hours).toBe(5);
      expect(result.breakdown).toHaveLength(1);
      expect(result.breakdown[0]).toMatchObject({
        date: '2025-01-20',
        day_of_week: 'Monday',
        business_minutes: 300,
        is_weekend: false,
        is_holiday: false,
      });
    });

    it('should use default business hours (9 AM - 5 PM) when not specified', () => {
      const params: CalculateBusinessHoursParams = {
        start_time: '2025-01-20T08:00:00', // Before business hours
        end_time: '2025-01-20T18:00:00', // After business hours
      };

      const result = calculateBusinessHours(params);

      expect(result.total_business_minutes).toBe(480); // 8 hours (9 AM - 5 PM)
      expect(result.total_business_hours).toBe(8);
    });

    it('should handle multi-day calculations', () => {
      const params: CalculateBusinessHoursParams = {
        start_time: '2025-01-20T14:00:00', // Monday 2 PM
        end_time: '2025-01-22T11:00:00', // Wednesday 11 AM
      };

      const result = calculateBusinessHours(params);

      // Monday: 3 hours (2 PM - 5 PM)
      // Tuesday: 8 hours (9 AM - 5 PM)
      // Wednesday: 2 hours (9 AM - 11 AM)
      expect(result.total_business_minutes).toBe(780); // 13 hours
      expect(result.total_business_hours).toBe(13);
      expect(result.breakdown).toHaveLength(3);
    });
  });

  describe('Weekend handling', () => {
    it('should exclude weekends by default', () => {
      const params: CalculateBusinessHoursParams = {
        start_time: '2025-01-24T10:00:00', // Friday
        end_time: '2025-01-27T10:00:00', // Monday
      };

      const result = calculateBusinessHours(params);

      // Friday: 7 hours (10 AM - 5 PM)
      // Saturday: 0 (weekend)
      // Sunday: 0 (weekend)
      // Monday: 1 hour (9 AM - 10 AM)
      expect(result.total_business_hours).toBe(8);
      expect(result.breakdown.filter((d) => d.is_weekend)).toHaveLength(2);
    });

    it('should include weekends when include_weekends is true', () => {
      const params: CalculateBusinessHoursParams = {
        start_time: '2025-01-25T10:00:00', // Saturday
        end_time: '2025-01-25T14:00:00', // Saturday
        include_weekends: true,
      };

      const result = calculateBusinessHours(params);

      expect(result.total_business_hours).toBe(4);
      expect(result.breakdown[0].is_weekend).toBe(true);
      expect(result.breakdown[0].business_minutes).toBe(240);
    });
  });

  describe('Custom business hours', () => {
    it('should use custom business hours when provided', () => {
      const params: CalculateBusinessHoursParams = {
        start_time: '2025-01-20T07:00:00',
        end_time: '2025-01-20T20:00:00',
        business_hours: {
          start: { hour: 8, minute: 30 },
          end: { hour: 18, minute: 30 },
        },
      };

      const result = calculateBusinessHours(params);

      expect(result.total_business_minutes).toBe(600); // 10 hours
      expect(result.total_business_hours).toBe(10);
    });

    it('should support different hours per day of week', () => {
      const params: CalculateBusinessHoursParams = {
        start_time: '2025-01-20T09:00:00', // Monday
        end_time: '2025-01-24T14:00:00', // Friday
        business_hours: {
          0: null, // Sunday - closed
          1: { start: { hour: 9, minute: 0 }, end: { hour: 17, minute: 0 } }, // Monday
          2: { start: { hour: 9, minute: 0 }, end: { hour: 17, minute: 0 } }, // Tuesday
          3: { start: { hour: 9, minute: 0 }, end: { hour: 17, minute: 0 } }, // Wednesday
          4: { start: { hour: 9, minute: 0 }, end: { hour: 17, minute: 0 } }, // Thursday
          5: { start: { hour: 9, minute: 0 }, end: { hour: 13, minute: 0 } }, // Friday - half day
          6: null, // Saturday - closed
        },
      };

      const result = calculateBusinessHours(params);

      // Monday-Thursday: 8 hours each = 32 hours
      // Friday: 4 hours
      expect(result.total_business_hours).toBe(36);
    });
  });

  describe('Holiday handling', () => {
    it('should exclude holidays from business hours', () => {
      const params: CalculateBusinessHoursParams = {
        start_time: '2025-01-20T09:00:00',
        end_time: '2025-01-22T17:00:00',
        holidays: ['2025-01-21'], // Tuesday is a holiday
      };

      const result = calculateBusinessHours(params);

      // Monday: 8 hours
      // Tuesday: 0 (holiday)
      // Wednesday: 8 hours
      expect(result.total_business_hours).toBe(16);
      expect(result.breakdown[1].is_holiday).toBe(true);
      expect(result.breakdown[1].business_minutes).toBe(0);
    });

    it('should handle holidays on weekends correctly', () => {
      const params: CalculateBusinessHoursParams = {
        start_time: '2025-01-24T09:00:00', // Friday
        end_time: '2025-01-27T17:00:00', // Monday
        holidays: ['2025-01-25'], // Saturday holiday
      };

      const result = calculateBusinessHours(params);

      // Friday: 8 hours
      // Saturday: 0 (weekend + holiday)
      // Sunday: 0 (weekend)
      // Monday: 8 hours
      expect(result.total_business_hours).toBe(16);
      const saturday = result.breakdown.find((d) => d.date === '2025-01-25');
      expect(saturday?.is_weekend).toBe(true);
      expect(saturday?.is_holiday).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle start time exactly at business start', () => {
      const params: CalculateBusinessHoursParams = {
        start_time: '2025-01-20T09:00:00',
        end_time: '2025-01-20T10:00:00',
      };

      const result = calculateBusinessHours(params);
      expect(result.total_business_hours).toBe(1);
    });

    it('should handle end time exactly at business end', () => {
      const params: CalculateBusinessHoursParams = {
        start_time: '2025-01-20T16:00:00',
        end_time: '2025-01-20T17:00:00',
      };

      const result = calculateBusinessHours(params);
      expect(result.total_business_hours).toBe(1);
    });

    it('should handle start after business hours', () => {
      const params: CalculateBusinessHoursParams = {
        start_time: '2025-01-20T18:00:00', // 6 PM
        end_time: '2025-01-21T10:00:00', // Next day 10 AM
      };

      const result = calculateBusinessHours(params);
      expect(result.total_business_hours).toBe(1); // Only 9-10 AM on Tuesday
    });

    it('should handle end before business hours', () => {
      const params: CalculateBusinessHoursParams = {
        start_time: '2025-01-20T16:00:00', // 4 PM
        end_time: '2025-01-21T08:00:00', // Next day 8 AM
      };

      const result = calculateBusinessHours(params);
      expect(result.total_business_hours).toBe(1); // Only 4-5 PM on Monday
    });

    it('should return 0 hours for non-business time range', () => {
      const params: CalculateBusinessHoursParams = {
        start_time: '2025-01-20T18:00:00', // After hours
        end_time: '2025-01-20T19:00:00', // Still after hours
      };

      const result = calculateBusinessHours(params);
      expect(result.total_business_hours).toBe(0);
    });

    it('should handle same start and end time', () => {
      const params: CalculateBusinessHoursParams = {
        start_time: '2025-01-20T10:00:00',
        end_time: '2025-01-20T10:00:00',
      };

      const result = calculateBusinessHours(params);
      expect(result.total_business_hours).toBe(0);
    });
  });

  describe('Timezone handling', () => {
    it('should use system timezone by default', () => {
      const params: CalculateBusinessHoursParams = {
        start_time: '2025-01-20T10:00:00',
        end_time: '2025-01-20T14:00:00',
      };

      const result = calculateBusinessHours(params);
      expect(result.total_business_hours).toBe(4);
    });

    it('should use UTC when timezone is empty string', () => {
      const params: CalculateBusinessHoursParams = {
        start_time: '2025-01-20T14:00:00',
        end_time: '2025-01-20T17:00:00',
        timezone: '',
      };

      const result = calculateBusinessHours(params);
      expect(result.total_business_hours).toBe(3); // 2 PM - 5 PM UTC
    });

    it('should calculate business hours in specified timezone', () => {
      // Business hours should be calculated in the context of the business timezone
      // For a business in Tokyo with 9 AM - 5 PM hours:
      // - Input times without timezone are interpreted as Tokyo time
      // - Business hours (9-5) are Tokyo hours, not UTC or system hours
      const params: CalculateBusinessHoursParams = {
        start_time: '2025-01-21T10:00:00', // 10 AM Tokyo time
        end_time: '2025-01-21T14:00:00', // 2 PM Tokyo time
        timezone: 'Asia/Tokyo',
      };

      const result = calculateBusinessHours(params);

      // Should calculate 4 hours (10 AM - 2 PM in Tokyo)
      expect(result.total_business_hours).toBe(4);
      expect(result.total_business_minutes).toBe(240);

      // Should have one day in breakdown with correct Tokyo date
      expect(result.breakdown).toHaveLength(1);
      expect(result.breakdown[0]).toMatchObject({
        date: '2025-01-21', // The date in Tokyo timezone
        day_of_week: 'Tuesday',
        business_minutes: 240,
        is_weekend: false,
        is_holiday: false,
      });
    });
  });

  describe('Error handling', () => {
    it('should throw error for invalid timezone', () => {
      const params: CalculateBusinessHoursParams = {
        start_time: '2025-01-20T10:00:00',
        end_time: '2025-01-20T14:00:00',
        timezone: 'Invalid/Zone',
      };

      expect(() => calculateBusinessHours(params)).toThrow();
    });

    it('should throw error for invalid start time', () => {
      const params: CalculateBusinessHoursParams = {
        start_time: 'not-a-date',
        end_time: '2025-01-20T14:00:00',
      };

      expect(() => calculateBusinessHours(params)).toThrow();
    });

    it('should throw error for invalid end time', () => {
      const params: CalculateBusinessHoursParams = {
        start_time: '2025-01-20T10:00:00',
        end_time: 'not-a-date',
      };

      expect(() => calculateBusinessHours(params)).toThrow();
    });

    it('should throw error for invalid holiday date', () => {
      const params: CalculateBusinessHoursParams = {
        start_time: '2025-01-20T10:00:00',
        end_time: '2025-01-20T14:00:00',
        holidays: ['not-a-date'],
      };

      expect(() => calculateBusinessHours(params)).toThrow();
    });

    it('should throw error for end time before start time', () => {
      const params: CalculateBusinessHoursParams = {
        start_time: '2025-01-20T14:00:00',
        end_time: '2025-01-20T10:00:00',
      };

      expect(() => calculateBusinessHours(params)).toThrow();
    });

    it('should throw error for invalid business hours', () => {
      const params: CalculateBusinessHoursParams = {
        start_time: '2025-01-20T10:00:00',
        end_time: '2025-01-20T14:00:00',
        business_hours: {
          start: { hour: 25, minute: 0 }, // Invalid hour
          end: { hour: 17, minute: 0 },
        },
      };

      expect(() => calculateBusinessHours(params)).toThrow();
    });
  });

  describe('Caching behavior', () => {
    it('should cache results', () => {
      const params: CalculateBusinessHoursParams = {
        start_time: '2025-01-20T10:00:00',
        end_time: '2025-01-20T14:00:00',
      };

      calculateBusinessHours(params);

      expect(mockCache.set).toHaveBeenCalledWith(
        expect.stringMatching(/^[a-f0-9]{64}$/),
        expect.any(Object),
        expect.any(Number)
      );
    });

    it('should return cached result when available', () => {
      const cachedResult: CalculateBusinessHoursResult = {
        total_business_minutes: 240,
        total_business_hours: 4,
        breakdown: [],
      };

      mockCache.get.mockReturnValue(cachedResult);

      const params: CalculateBusinessHoursParams = {
        start_time: '2025-01-20T10:00:00',
        end_time: '2025-01-20T14:00:00',
      };

      const result = calculateBusinessHours(params);

      expect(result).toBe(cachedResult);
      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('should use different cache keys for different parameters', () => {
      const params1: CalculateBusinessHoursParams = {
        start_time: '2025-01-20T10:00:00',
        end_time: '2025-01-20T14:00:00',
      };

      const params2: CalculateBusinessHoursParams = {
        start_time: '2025-01-20T10:00:00',
        end_time: '2025-01-20T14:00:00',
        timezone: 'Asia/Tokyo',
      };

      calculateBusinessHours(params1);
      const firstCall = mockCache.set.mock.calls[0][0];

      mockCache.get.mockReturnValue(undefined); // Force cache miss
      calculateBusinessHours(params2);
      const secondCall = mockCache.set.mock.calls[1][0];

      expect(firstCall).not.toBe(secondCall);
    });
  });
});
