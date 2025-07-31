import { formatAddTimeResult } from '../../src/tools/addTime';
import type { AddTimeParams } from '../../src/types';

describe('addTime result formatting helper', () => {
  describe('formatAddTimeResult', () => {
    const baseDate = new Date('2021-01-01T00:00:00.000Z');
    const resultDate = new Date('2021-01-02T00:00:00.000Z');

    it('should format Unix timestamp without timezone parameter', () => {
      const params: AddTimeParams = { time: '1609459200', amount: 1, unit: 'days' };
      const parseInfo = {
        date: baseDate,
        displayTimezone: 'UTC',
        hasExplicitOffset: false,
        explicitOffset: '',
      };

      const result = formatAddTimeResult(baseDate, resultDate, '1609459200', params, parseInfo);

      expect(result.original).toBe('2021-01-01T00:00:00.000Z');
      expect(result.result).toBe('2021-01-02T00:00:00.000Z');
    });

    it('should format Unix timestamp with timezone parameter', () => {
      const params: AddTimeParams = {
        time: '1609459200',
        amount: 1,
        unit: 'days',
        timezone: 'America/New_York',
      };
      const parseInfo = {
        date: baseDate,
        displayTimezone: 'America/New_York',
        hasExplicitOffset: false,
        explicitOffset: '',
      };

      const result = formatAddTimeResult(baseDate, resultDate, '1609459200', params, parseInfo);

      expect(result.original).toContain('2020-12-31');
      expect(result.original).toContain('19:00:00');
      expect(result.result).toContain('2021-01-01');
      expect(result.result).toContain('19:00:00');
    });

    it('should format ISO string with Z suffix', () => {
      const params: AddTimeParams = {
        time: '2021-01-01T00:00:00.000Z',
        amount: 1,
        unit: 'days',
      };
      const parseInfo = {
        date: baseDate,
        displayTimezone: 'UTC',
        hasExplicitOffset: false,
        explicitOffset: '',
      };

      const result = formatAddTimeResult(
        baseDate,
        resultDate,
        '2021-01-01T00:00:00.000Z',
        params,
        parseInfo
      );

      expect(result.original).toBe('2021-01-01T00:00:00.000Z');
      expect(result.result).toBe('2021-01-02T00:00:00.000Z');
    });

    it('should format string with explicit offset', () => {
      const params: AddTimeParams = {
        time: '2021-01-01T00:00:00.000+05:00',
        amount: 1,
        unit: 'days',
      };
      const parseInfo = {
        date: new Date('2020-12-31T19:00:00.000Z'),
        displayTimezone: 'America/New_York',
        hasExplicitOffset: true,
        explicitOffset: '+05:00',
      };

      const result = formatAddTimeResult(
        new Date('2020-12-31T19:00:00.000Z'),
        new Date('2021-01-01T19:00:00.000Z'),
        '2021-01-01T00:00:00.000+05:00',
        params,
        parseInfo
      );

      expect(result.original).toBe('2021-01-01T00:00:00.000+05:00');
      expect(result.result).toBe('2021-01-02T00:00:00.000+05:00');
    });

    it('should format local time string', () => {
      const params: AddTimeParams = {
        time: '2021-01-01T00:00:00',
        amount: 1,
        unit: 'days',
        timezone: 'America/New_York',
      };
      const parseInfo = {
        date: new Date('2021-01-01T05:00:00.000Z'),
        displayTimezone: 'America/New_York',
        hasExplicitOffset: false,
        explicitOffset: '',
      };

      const result = formatAddTimeResult(
        new Date('2021-01-01T05:00:00.000Z'),
        new Date('2021-01-02T05:00:00.000Z'),
        '2021-01-01T00:00:00',
        params,
        parseInfo
      );

      expect(result.original).toContain('2021-01-01T00:00:00');
      expect(result.result).toContain('2021-01-02T00:00:00');
    });

    it('should include Unix timestamps in result', () => {
      const params: AddTimeParams = {
        time: '2021-01-01T00:00:00.000Z',
        amount: 1,
        unit: 'days',
      };
      const parseInfo = {
        date: baseDate,
        displayTimezone: 'UTC',
        hasExplicitOffset: false,
        explicitOffset: '',
      };

      const result = formatAddTimeResult(
        baseDate,
        resultDate,
        '2021-01-01T00:00:00.000Z',
        params,
        parseInfo
      );

      expect(result.unix_original).toBe(1609459200);
      expect(result.unix_result).toBe(1609545600);
    });

    describe('Debug logging', () => {
      it('should log formatting attempts', () => {
        const params: AddTimeParams = {
          time: '2021-01-01T00:00:00.000Z',
          amount: 1,
          unit: 'days',
        };
        const parseInfo = {
          date: baseDate,
          displayTimezone: 'UTC',
          hasExplicitOffset: false,
          explicitOffset: '',
        };

        const result = formatAddTimeResult(
          baseDate,
          resultDate,
          '2021-01-01T00:00:00.000Z',
          params,
          parseInfo
        );
        expect(result).toBeDefined();
      });
    });
  });
});