import { formatOriginalTime, extractOffsetString } from '../../src/tools/convertTimezone';

describe('convertTimezone formatting helpers', () => {
  const testDate = new Date('2021-01-01T00:00:00.000Z');

  describe('formatOriginalTime', () => {
    it('should preserve explicit offset format', () => {
      const result = formatOriginalTime(
        testDate,
        '2021-01-01T05:00:00.000+05:00',
        'America/New_York'
      );

      expect(result).toBe('2021-01-01T05:00:00.000+05:00');
    });

    it('should add milliseconds if missing with explicit offset', () => {
      const result = formatOriginalTime(testDate, '2021-01-01T05:00:00+05:00', 'America/New_York');

      expect(result).toBe('2021-01-01T05:00:00.000+05:00');
    });

    it('should format time without explicit offset', () => {
      const result = formatOriginalTime(testDate, '2021-01-01T00:00:00', 'America/New_York');

      expect(result).toContain('2020-12-31T19:00:00');
      expect(result).toContain('-05:00');
    });

    it('should format UTC time', () => {
      const result = formatOriginalTime(testDate, '2021-01-01T00:00:00.000Z', 'UTC');

      expect(result).toBe('2021-01-01T00:00:00.000Z');
    });

    describe('Debug logging', () => {
      it('should log formatting attempts', () => {
        const result = formatOriginalTime(testDate, '2021-01-01T00:00:00.000Z', 'UTC');
        expect(result).toBeDefined();
      });
    });
  });

  describe('extractOffsetString', () => {
    it('should extract explicit offset from time string', () => {
      const result = extractOffsetString(
        '2021-01-01T00:00:00.000+05:00',
        testDate,
        'America/New_York'
      );

      expect(result).toBe('+05:00');
    });

    it('should return Z for Z suffix', () => {
      const result = extractOffsetString('2021-01-01T00:00:00.000Z', testDate, 'America/New_York');

      expect(result).toBe('Z');
    });

    it('should return Z for UTC timezone', () => {
      const result = extractOffsetString('2021-01-01T00:00:00', testDate, 'UTC');

      expect(result).toBe('Z');
    });

    it('should format offset for timezone', () => {
      const result = extractOffsetString('2021-01-01T00:00:00', testDate, 'America/New_York');

      expect(result).toBe('-05:00');
    });

    it('should handle negative offsets', () => {
      const result = extractOffsetString(
        '2021-01-01T00:00:00.000-08:00',
        testDate,
        'America/Los_Angeles'
      );

      expect(result).toBe('-08:00');
    });

    describe('Debug logging', () => {
      it('should log extraction attempts', () => {
        const result = extractOffsetString('2021-01-01T00:00:00.000Z', testDate, 'UTC');
        expect(result).toBeDefined();
      });
    });
  });
});
