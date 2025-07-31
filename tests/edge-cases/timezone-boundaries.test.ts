import { daysUntil } from '../../src/tools/daysUntil';
import { getBusinessDays } from '../../src/tools/getBusinessDays';
import { addDays, format } from 'date-fns';

describe('Timezone Boundary Edge Cases', () => {
  describe('when local date differs from UTC date', () => {
    beforeEach(() => {
      // Simulate late evening in Eastern time (already next day in UTC)
      // July 28 at 11 PM EDT = July 29 at 3 AM UTC
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-07-28T23:00:00-04:00'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('daysUntil should use consistent timezone for date math', () => {
      const futureDate = addDays(new Date(), 7);

      // Using toISOString() would give us the UTC date (wrong!)
      const wrongDateString = futureDate.toISOString().split('T')[0]; // '2025-08-05'

      // Using format() gives us the local date (correct!)
      const correctDateString = format(futureDate, 'yyyy-MM-dd'); // '2025-08-04'

      // The bug: using ISO string causes off-by-one error
      expect(daysUntil({ target_date: wrongDateString })).toBe(8); // Bug!
      expect(daysUntil({ target_date: correctDateString })).toBe(7); // Correct!
    });

    it('should handle "today" correctly across timezone boundary', () => {
      const localToday = format(new Date(), 'yyyy-MM-dd'); // '2025-07-28'
      const utcToday = new Date().toISOString().split('T')[0]; // '2025-07-29'

      expect(daysUntil({ target_date: localToday })).toBe(0); // Today (correct)
      expect(daysUntil({ target_date: utcToday })).toBe(1); // Tomorrow (wrong!)
    });

    it('business days calculation should handle timezone boundaries', () => {
      const start = format(new Date(), 'yyyy-MM-dd');
      const end = format(addDays(new Date(), 5), 'yyyy-MM-dd');

      const result = getBusinessDays({
        start_date: start,
        end_date: end,
        exclude_weekends: true,
      });

      // Should get consistent results regardless of time of day
      expect(result.business_days).toBeGreaterThan(0);
    });
  });

  describe('DST transition edge cases', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should handle spring forward correctly', () => {
      // March 9, 2025 at 2 AM EST -> 3 AM EDT (lose an hour)
      jest.setSystemTime(new Date('2025-03-09T01:59:59-05:00'));

      const beforeDST = format(new Date(), 'yyyy-MM-dd');

      // Jump to after DST transition
      jest.setSystemTime(new Date('2025-03-09T03:00:01-04:00'));

      // Should still be the same day
      expect(daysUntil({ target_date: beforeDST })).toBe(0);
    });

    it('should handle fall back correctly', () => {
      // November 2, 2025 at 2 AM EDT -> 1 AM EST (gain an hour)
      jest.setSystemTime(new Date('2025-11-02T01:59:59-04:00'));

      const beforeDST = format(new Date(), 'yyyy-MM-dd');

      // Jump to after DST transition
      jest.setSystemTime(new Date('2025-11-02T01:00:01-05:00'));

      const afterDST = format(new Date(), 'yyyy-MM-dd');

      // Should still be the same day
      expect(beforeDST).toBe(afterDST);
    });
  });

  describe('Year and month boundaries', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should handle year transition correctly', () => {
      // December 31, 2026 at 11:59 PM
      jest.setSystemTime(new Date('2026-12-31T23:59:59'));

      const todayResult = daysUntil({ target_date: '2026-12-31' });
      const tomorrowResult = daysUntil({ target_date: '2027-01-01' });

      expect(todayResult).toBe(0);
      expect(tomorrowResult).toBe(1);
    });

    it('should handle leap year correctly', () => {
      // February 28, 2028 (leap year)
      jest.setSystemTime(new Date('2028-02-28T12:00:00'));

      const feb29Result = daysUntil({ target_date: '2028-02-29' });
      const mar1Result = daysUntil({ target_date: '2028-03-01' });

      expect(feb29Result).toBe(1);
      expect(mar1Result).toBe(2);
    });
  });
});
