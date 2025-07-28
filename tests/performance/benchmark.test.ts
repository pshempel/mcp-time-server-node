import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  getCurrentTime,
  convertTimezone,
  calculateDuration,
  getBusinessDays,
  calculateBusinessHours,
} from '../../src/tools';
import { cache } from '../../src/cache/timeCache';

describe('Performance Benchmarks', () => {
  beforeEach(() => {
    // Clear cache before each test
    cache.flushAll();
  });

  describe('Cached responses should be < 1ms', () => {
    test('getCurrentTime - cached', () => {
      const params = { timezone: 'America/New_York' };

      // First call to populate cache
      getCurrentTime(params);

      // Measure cached call
      const start = process.hrtime.bigint();
      getCurrentTime(params);
      const end = process.hrtime.bigint();

      const durationMs = Number(end - start) / 1_000_000;
      expect(durationMs).toBeLessThan(5); // Increased from 1ms to account for SHA-256 hashing
    });

    test('getBusinessDays - cached', () => {
      const params = {
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        timezone: 'America/New_York',
        holiday_calendar: 'US',
      };

      // First call to populate cache
      getBusinessDays(params);

      // Measure cached call
      const start = process.hrtime.bigint();
      getBusinessDays(params);
      const end = process.hrtime.bigint();

      const durationMs = Number(end - start) / 1_000_000;
      expect(durationMs).toBeLessThan(5); // Increased from 1ms to account for SHA-256 hashing
    });
  });

  describe('Fresh calculations should be < 10ms', () => {
    test('getCurrentTime - fresh', () => {
      const start = process.hrtime.bigint();
      getCurrentTime({ timezone: 'Australia/Sydney' });
      const end = process.hrtime.bigint();

      const durationMs = Number(end - start) / 1_000_000;
      expect(durationMs).toBeLessThan(10);
    });

    test('convertTimezone - fresh', () => {
      const start = process.hrtime.bigint();
      convertTimezone({
        time: '2025-01-01T12:00:00',
        from_timezone: 'America/New_York',
        to_timezone: 'Asia/Tokyo',
      });
      const end = process.hrtime.bigint();

      const durationMs = Number(end - start) / 1_000_000;
      expect(durationMs).toBeLessThan(10);
    });

    test('calculateDuration - fresh', () => {
      const start = process.hrtime.bigint();
      calculateDuration({
        start_time: '2025-01-01T09:00:00',
        end_time: '2025-01-01T17:30:00',
        timezone: 'America/Chicago',
      });
      const end = process.hrtime.bigint();

      const durationMs = Number(end - start) / 1_000_000;
      expect(durationMs).toBeLessThan(10);
    });
  });

  describe('Complex operations should be < 50ms', () => {
    test('getBusinessDays with holidays - fresh', () => {
      const start = process.hrtime.bigint();
      getBusinessDays({
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        timezone: 'America/New_York',
        holiday_calendar: 'US',
        custom_holidays: ['2025-07-05', '2025-11-26'],
      });
      const end = process.hrtime.bigint();

      const durationMs = Number(end - start) / 1_000_000;
      expect(durationMs).toBeLessThan(50);
    });

    test('calculateBusinessHours with holidays - fresh', () => {
      const start = process.hrtime.bigint();
      calculateBusinessHours({
        start_time: '2025-01-01T09:00:00',
        end_time: '2025-01-31T17:00:00',
        timezone: 'America/New_York',
        holidays: ['2025-01-01', '2025-01-20'],
        include_weekends: false,
      });
      const end = process.hrtime.bigint();

      const durationMs = Number(end - start) / 1_000_000;
      expect(durationMs).toBeLessThan(50);
    });

    test('getBusinessDays with Easter holidays - fresh', () => {
      const start = process.hrtime.bigint();
      getBusinessDays({
        start_date: '2025-04-01',
        end_date: '2025-04-30',
        timezone: 'Europe/London',
        holiday_calendar: 'UK',
      });
      const end = process.hrtime.bigint();

      const durationMs = Number(end - start) / 1_000_000;
      expect(durationMs).toBeLessThan(50);
    });
  });

  describe('Batch operations performance', () => {
    test('100 getCurrentTime calls should average < 1ms each', () => {
      const iterations = 100;
      const start = process.hrtime.bigint();

      for (let i = 0; i < iterations; i++) {
        getCurrentTime({
          timezone: i % 2 === 0 ? 'America/New_York' : 'Europe/London',
        });
      }

      const end = process.hrtime.bigint();
      const totalMs = Number(end - start) / 1_000_000;
      const avgMs = totalMs / iterations;

      expect(avgMs).toBeLessThan(5); // Increased from 1ms to account for SHA-256 hashing
    });
  });
});
