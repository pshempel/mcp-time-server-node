import { calculateBusinessHours } from '../../src/tools/calculateBusinessHours';
import { getConfig } from '../../src/utils/config';
import { cache } from '../../src/cache/timeCache';
import type { CalculateBusinessHoursParams } from '../../src/types';

// Mock dependencies
jest.mock('../../src/utils/config');
jest.mock('../../src/cache/timeCache');

describe('calculateBusinessHours - Timezone Edge Cases', () => {
  const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>;
  const mockCache = cache as jest.Mocked<typeof cache>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetConfig.mockReturnValue({ defaultTimezone: 'America/Indianapolis' });
    mockCache.get.mockReturnValue(null);
    mockCache.set.mockImplementation(() => true);
  });

  it('should handle times in different timezone contexts correctly', () => {
    const params: CalculateBusinessHoursParams = {
      start_time: '2025-01-21T10:00:00', // 10 AM Tokyo time
      end_time: '2025-01-21T14:00:00', // 2 PM Tokyo time
      timezone: 'Asia/Tokyo',
    };

    const result = calculateBusinessHours(params);

    // Should calculate 4 hours in Tokyo business hours
    expect(result.total_business_hours).toBe(4);
    expect(result.total_business_minutes).toBe(240);

    // Should only have one day in the breakdown
    expect(result.breakdown).toHaveLength(1);
    expect(result.breakdown[0].date).toBe('2025-01-21');
    expect(result.breakdown[0].day_of_week).toBe('Tuesday');
  });

  it('should handle UTC times converted to business timezone', () => {
    const params: CalculateBusinessHoursParams = {
      start_time: '2025-01-21T01:00:00Z', // 10 AM Tokyo = 1 AM UTC
      end_time: '2025-01-21T05:00:00Z', // 2 PM Tokyo = 5 AM UTC
      timezone: 'Asia/Tokyo',
    };

    const result = calculateBusinessHours(params);

    // These UTC times represent 10 AM - 2 PM in Tokyo
    expect(result.total_business_hours).toBe(4);
    expect(result.breakdown[0].date).toBe('2025-01-21');
  });

  it('should handle times with explicit timezone offsets', () => {
    const params: CalculateBusinessHoursParams = {
      start_time: '2025-01-21T10:00:00+09:00', // 10 AM Tokyo with offset
      end_time: '2025-01-21T14:00:00+09:00', // 2 PM Tokyo with offset
      timezone: 'Asia/Tokyo',
    };

    const result = calculateBusinessHours(params);

    // Explicit offsets should work the same way
    expect(result.total_business_hours).toBe(4);
    expect(result.breakdown[0].date).toBe('2025-01-21');
  });

  it('should handle cross-day business hours in different timezones', () => {
    // When it's late evening in US, it's next day morning in Tokyo
    const params: CalculateBusinessHoursParams = {
      start_time: '2025-01-20T20:00:00-05:00', // 8 PM EST = 10 AM next day Tokyo
      end_time: '2025-01-21T00:00:00-05:00', // Midnight EST = 2 PM Tokyo
      timezone: 'Asia/Tokyo',
    };

    const result = calculateBusinessHours(params);

    // Should calculate business hours in Tokyo timezone
    expect(result.total_business_hours).toBe(4);
    expect(result.breakdown[0].date).toBe('2025-01-21'); // Tokyo date
  });
});
