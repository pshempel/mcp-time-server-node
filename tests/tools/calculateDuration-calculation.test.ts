import { calculateDurationValues, formatDurationResult } from '../../src/tools/calculateDuration';

describe('calculateDuration calculation helpers', () => {
  describe('calculateDurationValues', () => {
    it('should calculate all duration units correctly', () => {
      const start = new Date('2025-01-01T00:00:00Z');
      const end = new Date('2025-01-02T12:30:45Z');

      const result = calculateDurationValues(start, end);

      expect(result.milliseconds).toBe(131445000); // 36.5 hours + 45 seconds
      expect(result.seconds).toBe(131445);
      expect(result.minutes).toBe(2190.75);
      expect(result.hours).toBe(36.5125);
      expect(result.days).toBeCloseTo(1.5213541666666667);
      expect(result.is_negative).toBe(false);
    });

    it('should handle negative durations', () => {
      const start = new Date('2025-01-02T00:00:00Z');
      const end = new Date('2025-01-01T00:00:00Z');

      const result = calculateDurationValues(start, end);

      expect(result.milliseconds).toBe(-86400000);
      expect(result.seconds).toBe(-86400);
      expect(result.minutes).toBe(-1440);
      expect(result.hours).toBe(-24);
      expect(result.days).toBe(-1);
      expect(result.is_negative).toBe(true);
    });

    it('should handle zero duration', () => {
      const time = new Date('2025-01-01T00:00:00Z');

      const result = calculateDurationValues(time, time);

      expect(result.milliseconds).toBe(0);
      expect(result.seconds).toBe(0);
      expect(result.minutes).toBe(0);
      expect(result.hours).toBe(0);
      expect(result.days).toBe(0);
      expect(result.is_negative).toBe(false);
    });

    it('should handle millisecond precision', () => {
      const start = new Date('2025-01-01T00:00:00.123Z');
      const end = new Date('2025-01-01T00:00:00.456Z');

      const result = calculateDurationValues(start, end);

      expect(result.milliseconds).toBe(333);
      expect(result.seconds).toBe(0.333);
    });
  });

  describe('formatDurationResult', () => {
    const baseValues = {
      milliseconds: 90061000, // 1 day, 1 hour, 1 minute, 1 second
      seconds: 90061,
      minutes: 1501.0166666666667,
      hours: 25.016944444444444,
      days: 1.042372685185185,
      is_negative: false,
    };

    it('should format with auto unit', () => {
      const result = formatDurationResult(baseValues, 'auto');
      expect(result).toBe('1 day 1 hour 1 minute 1 second');
    });

    it('should format with seconds unit', () => {
      const result = formatDurationResult(baseValues, 'seconds');
      expect(result).toBe('90061 seconds');
    });

    it('should format with minutes unit', () => {
      const result = formatDurationResult(baseValues, 'minutes');
      expect(result).toBe('1501.0166666666667 minutes');
    });

    it('should format with hours unit', () => {
      const result = formatDurationResult(baseValues, 'hours');
      expect(result).toBe('25.016944444444444 hours');
    });

    it('should format with days unit', () => {
      const result = formatDurationResult(baseValues, 'days');
      expect(result).toBe('1.042372685185185 days');
    });

    it('should format negative durations with auto', () => {
      const negativeValues = { ...baseValues, is_negative: true, milliseconds: -90061000 };
      const result = formatDurationResult(negativeValues, 'auto');
      expect(result).toBe('-1 day 1 hour 1 minute 1 second');
    });

    it('should format zero duration', () => {
      const zeroValues = {
        milliseconds: 0,
        seconds: 0,
        minutes: 0,
        hours: 0,
        days: 0,
        is_negative: false,
      };
      const result = formatDurationResult(zeroValues, 'auto');
      expect(result).toBe('0 seconds');
    });

    it('should format milliseconds unit', () => {
      const result = formatDurationResult(baseValues, 'milliseconds');
      expect(result).toBe('90061000 milliseconds');
    });

    it('should handle sub-second durations with auto', () => {
      const values = {
        milliseconds: 500,
        seconds: 0.5,
        minutes: 0.008333333333333333,
        hours: 0.00013888888888888889,
        days: 0.000005787037037037037,
        is_negative: false,
      };
      const result = formatDurationResult(values, 'auto');
      expect(result).toBe('0 seconds');
    });
  });

  describe('Debug logging', () => {
    it('should log calculation values', () => {
      // This test verifies the functions run with debug
      const start = new Date('2025-01-01T00:00:00Z');
      const end = new Date('2025-01-01T01:00:00Z');

      const values = calculateDurationValues(start, end);
      expect(values).toBeDefined();

      const formatted = formatDurationResult(values, 'auto');
      expect(formatted).toBeDefined();
    });
  });
});
