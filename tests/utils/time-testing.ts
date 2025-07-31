/**
 * Time testing utilities for catching edge cases
 */

/**
 * Run a test function at multiple times throughout the day
 */
export function testAtMultipleTimes(
  description: string,
  times: string[],
  testFn: (time: Date) => void | Promise<void>,
): void {
  describe.each(times)(`${description} at %s`, (timeStr) => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(timeStr));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should work correctly', async () => {
      await testFn(new Date(timeStr));
    });
  });
}

/**
 * Common problematic times for testing
 */
export const EDGE_TIMES = {
  MIDNIGHT: '2025-01-01T00:00:00',
  JUST_BEFORE_MIDNIGHT: '2025-01-01T23:59:59',
  NOON: '2025-01-01T12:00:00',
  EARLY_MORNING: '2025-01-01T03:00:00',
  LATE_EVENING: '2025-01-01T23:00:00',

  // DST transitions (US Eastern)
  SPRING_DST_BEFORE: '2025-03-09T01:59:59-05:00',
  SPRING_DST_AFTER: '2025-03-09T03:00:01-04:00',
  FALL_DST_BEFORE: '2025-11-02T01:59:59-04:00',
  FALL_DST_AFTER: '2025-11-02T01:00:01-05:00',

  // Year boundaries
  NEW_YEARS_EVE: '2025-12-31T23:59:59',
  NEW_YEARS_DAY: '2026-01-01T00:00:01',

  // Month boundaries
  END_OF_MONTH: '2025-01-31T23:59:59',
  START_OF_MONTH: '2025-02-01T00:00:01',

  // Leap year
  LEAP_DAY: '2024-02-29T12:00:00',
  DAY_BEFORE_LEAP: '2024-02-28T12:00:00',
};

/**
 * Test in multiple timezones
 */
export function testInTimezones(
  description: string,
  timezones: string[],
  testFn: (tz: string) => void | Promise<void>,
): void {
  // Note: Actually changing process.env.TZ is tricky and platform-dependent
  // This is more of a conceptual helper
  describe.each(timezones)(`${description} in %s timezone`, (tz) => {
    it('should work correctly', async () => {
      // In real implementation, we'd need to handle timezone switching
      // For now, this serves as a template
      console.warn(`Testing in timezone: ${tz} (actual TZ change not implemented)`);
      await testFn(tz);
    });
  });
}

/**
 * Generate dates around timezone boundaries
 */
export function generateTimezoneBoundaryDates(baseDate: Date): Date[] {
  const dates: Date[] = [];

  // Times when UTC and local might be different days
  for (let hour = 20; hour <= 23; hour++) {
    const date = new Date(baseDate);
    date.setHours(hour, 0, 0, 0);
    dates.push(date);
  }

  for (let hour = 0; hour <= 4; hour++) {
    const date = new Date(baseDate);
    date.setHours(hour, 0, 0, 0);
    dates.push(date);
  }

  return dates;
}

/**
 * Test helper to check if local and UTC dates differ
 */
export function isLocalUTCDateDifferent(date: Date): boolean {
  const localDateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
  const utcDateStr = date.toISOString().split('T')[0];
  return localDateStr !== utcDateStr;
}

/**
 * Create a test matrix for comprehensive date testing
 */
export interface TimeTestCase {
  name: string;
  date: Date;
  expectation: string;
}

export function createTimeTestMatrix(): TimeTestCase[] {
  const cases: TimeTestCase[] = [];

  // Add various edge cases
  Object.entries(EDGE_TIMES).forEach(([name, dateStr]) => {
    cases.push({
      name: name.toLowerCase().replace(/_/g, ' '),
      date: new Date(dateStr),
      expectation: `should handle ${name.toLowerCase().replace(/_/g, ' ')} correctly`,
    });
  });

  return cases;
}
