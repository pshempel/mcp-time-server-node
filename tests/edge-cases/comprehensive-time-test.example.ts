/**
 * Example of comprehensive time testing that would catch timezone edge cases
 * This test would have caught our daysUntil bug automatically!
 */

import { daysUntil } from '../../src/tools/daysUntil';
import { addDays, format } from 'date-fns';
import { testAtMultipleTimes, EDGE_TIMES, isLocalUTCDateDifferent } from '../utils/time-testing';

describe('Comprehensive Time Edge Case Testing', () => {
  /**
   * This is the test that would have caught our bug!
   * It tests the same operation at different times of day
   */
  testAtMultipleTimes(
    'daysUntil calculation',
    [
      EDGE_TIMES.MIDNIGHT,
      EDGE_TIMES.NOON,
      EDGE_TIMES.LATE_EVENING, // This would catch our bug!
      EDGE_TIMES.JUST_BEFORE_MIDNIGHT,
    ],
    (currentTime) => {
      // Test adding 7 days at different times
      const futureDate = addDays(currentTime, 7);

      // The correct way (using format)
      const correctDateString = format(futureDate, 'yyyy-MM-dd');
      const correctResult = daysUntil({ target_date: correctDateString });

      // What our old tests were doing (using toISOString)
      const buggyDateString = futureDate.toISOString().split('T')[0];
      const buggyResult = daysUntil({ target_date: buggyDateString });

      // At noon, both would work
      // But at 11 PM, they'd differ!
      if (isLocalUTCDateDifferent(currentTime)) {
        console.log(`Found timezone boundary at ${currentTime}`);
        console.log(`Local date: ${format(currentTime, 'yyyy-MM-dd')}`);
        console.log(`UTC date: ${currentTime.toISOString().split('T')[0]}`);

        // The bug: these would be different
        expect(buggyResult).not.toBe(correctResult);
      } else {
        // When local and UTC are same day, both work
        expect(buggyResult).toBe(correctResult);
      }

      // The correct result should always be 7
      expect(correctResult).toBe(7);
    },
  );

  /**
   * Property-based test: For ANY time, the calculation should be consistent
   */
  it('should calculate days consistently regardless of time of day', () => {
    // Test 100 random times
    for (let i = 0; i < 100; i++) {
      const randomHour = Math.floor(Math.random() * 24);
      const randomMinute = Math.floor(Math.random() * 60);

      const testDate = new Date('2025-06-15'); // Middle of year, no DST issues
      testDate.setHours(randomHour, randomMinute, 0, 0);

      jest.setSystemTime(testDate);

      const futureDate = addDays(new Date(), 7);
      const dateString = format(futureDate, 'yyyy-MM-dd');

      const result = daysUntil({ target_date: dateString });
      expect(result).toBe(7);
    }
  });

  /**
   * Chaos test: Randomly jump time during calculation
   */
  it('should handle time changes during execution', () => {
    const startTime = new Date('2025-01-01T23:59:58'); // 2 seconds before midnight
    jest.setSystemTime(startTime);

    const futureDate = addDays(new Date(), 7);
    const dateString = format(futureDate, 'yyyy-MM-dd');

    // Start calculation
    const result1 = daysUntil({ target_date: dateString });

    // Time passes... it's now past midnight!
    jest.setSystemTime(new Date('2025-01-02T00:00:02'));

    // Same calculation should give same result
    // (because we're using the same target date string)
    const result2 = daysUntil({ target_date: dateString });

    expect(result1).toBe(7);
    expect(result2).toBe(6); // One day has passed
  });
});

/**
 * Example: How to run tests in CI at different times
 */
describe('CI Time Matrix Testing', () => {
  // This would be configured in CI to actually run at these times
  const CI_TEST_TIMES = [
    { time: '00:00', description: 'Midnight UTC' },
    { time: '04:00', description: 'US East Coast midnight' },
    { time: '08:00', description: 'US West Coast midnight' },
    { time: '12:00', description: 'Noon UTC' },
    { time: '23:59', description: 'Just before midnight UTC' },
  ];

  // In CI, we'd use a matrix strategy to run at each time
  it('documents when tests should run in CI', () => {
    console.log('Tests should run at these times in CI:');
    CI_TEST_TIMES.forEach(({ time, description }) => {
      console.log(`- ${time} UTC: ${description}`);
    });
  });
});
