import { describe, it, expect } from '@jest/globals';
import {
  parseUnixTimestamp,
  parseISOWithTimezoneInfo,
  formatUnixTimestampResult,
  formatWithExplicitOffset,
} from '../../src/tools/addTime';

describe('addTime parsing helpers', () => {
  describe('parseUnixTimestamp', () => {
    it('should parse valid Unix timestamp', () => {
      const result = parseUnixTimestamp('1735689600');
      expect(result).toEqual(new Date('2025-01-01T00:00:00.000Z'));
    });

    it('should return null for non-numeric strings', () => {
      const result = parseUnixTimestamp('2025-01-01');
      expect(result).toBeNull();
    });

    it('should return null for invalid timestamps', () => {
      const result = parseUnixTimestamp('abc123');
      expect(result).toBeNull();
    });

    it('should handle timestamps with leading/trailing spaces', () => {
      const result = parseUnixTimestamp('  1735689600  ');
      expect(result).toBeNull(); // Only pure digits allowed
    });
  });

  describe('parseISOWithTimezoneInfo', () => {
    it('should parse ISO string with Z suffix', () => {
      const result = parseISOWithTimezoneInfo('2025-01-01T12:00:00.000Z');
      expect(result.date).toEqual(new Date('2025-01-01T12:00:00.000Z'));
      expect(result.hasZ).toBe(true);
      expect(result.hasOffset).toBe(false);
      expect(result.offset).toBe('');
    });

    it('should parse ISO string with explicit offset', () => {
      const result = parseISOWithTimezoneInfo('2025-01-01T12:00:00.000+05:30');
      expect(result.date).toEqual(new Date('2025-01-01T06:30:00.000Z'));
      expect(result.hasZ).toBe(false);
      expect(result.hasOffset).toBe(true);
      expect(result.offset).toBe('+05:30');
    });

    it('should parse ISO string without timezone info', () => {
      const result = parseISOWithTimezoneInfo('2025-01-01T12:00:00');
      expect(result.date).toEqual(new Date('2025-01-01T12:00:00'));
      expect(result.hasZ).toBe(false);
      expect(result.hasOffset).toBe(false);
      expect(result.offset).toBe('');
    });

    it('should throw for invalid date strings', () => {
      expect(() => parseISOWithTimezoneInfo('invalid-date')).toThrow();
    });
  });

  describe('formatUnixTimestampResult', () => {
    const inputDate = new Date('2025-01-01T00:00:00.000Z');
    const resultDate = new Date('2025-01-02T00:00:00.000Z');

    it('should format as UTC when no timezone specified', () => {
      const result = formatUnixTimestampResult(inputDate, resultDate);
      expect(result.original).toBe('2025-01-01T00:00:00.000Z');
      expect(result.result).toBe('2025-01-02T00:00:00.000Z');
    });

    it('should format in specified timezone', () => {
      const result = formatUnixTimestampResult(inputDate, resultDate, 'America/New_York');
      expect(result.original).toBe('2024-12-31T19:00:00.000-05:00');
      expect(result.result).toBe('2025-01-01T19:00:00.000-05:00');
    });

    it('should include Unix timestamps in result', () => {
      const result = formatUnixTimestampResult(inputDate, resultDate);
      expect(result.unix_original).toBe(1735689600);
      expect(result.unix_result).toBe(1735776000);
    });
  });

  describe('formatWithExplicitOffset', () => {
    const inputDate = new Date('2025-01-01T06:30:00.000Z');
    const resultDate = new Date('2025-01-02T06:30:00.000Z');
    const originalTime = '2025-01-01T12:00:00.000+05:30';
    const offset = '+05:30';

    it('should preserve explicit offset in formatting', () => {
      const result = formatWithExplicitOffset(inputDate, resultDate, originalTime, offset);
      expect(result.original).toBe('2025-01-01T12:00:00.000+05:30');
      expect(result.result).toBe('2025-01-02T12:00:00.000+05:30');
    });

    it('should add milliseconds if missing', () => {
      const simpleTime = '2025-01-01T12:00:00+05:30';
      const result = formatWithExplicitOffset(inputDate, resultDate, simpleTime, offset);
      expect(result.original).toBe('2025-01-01T12:00:00.000+05:30');
    });

    it('should handle negative offsets', () => {
      const negDate = new Date('2025-01-01T17:00:00.000Z');
      const negResult = new Date('2025-01-02T17:00:00.000Z');
      const negTime = '2025-01-01T12:00:00.000-05:00';
      const result = formatWithExplicitOffset(negDate, negResult, negTime, '-05:00');
      expect(result.original).toBe('2025-01-01T12:00:00.000-05:00');
      expect(result.result).toBe('2025-01-02T12:00:00.000-05:00');
    });

    it('should include Unix timestamps', () => {
      const result = formatWithExplicitOffset(inputDate, resultDate, originalTime, offset);
      expect(result.unix_original).toBe(Math.floor(inputDate.getTime() / 1000));
      expect(result.unix_result).toBe(Math.floor(resultDate.getTime() / 1000));
    });
  });
});
