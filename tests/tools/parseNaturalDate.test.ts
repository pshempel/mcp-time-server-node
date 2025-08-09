/**
 * TDD Test for parseNaturalDate tool
 * Written BEFORE implementation (RED phase)
 *
 * Based on research in research/natural-language-parsing.js
 */

import { parseNaturalDate } from '../../src/tools/parseNaturalDate';

describe('parseNaturalDate', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Set to Thursday, Jan 9, 2025, 10:00:00 UTC
    jest.setSystemTime(new Date('2025-01-09T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('basic weekday patterns', () => {
    it('should parse "next Tuesday"', () => {
      const result = parseNaturalDate({
        input: 'next Tuesday',
        timezone: 'UTC',
        reference_date: '2025-01-09T10:00:00.000Z',
      });

      expect(result).toEqual({
        parsed_date: '2025-01-14T10:00:00.000Z',
        interpretation: 'Next Tuesday (January 14, 2025)',
        timezone_used: 'UTC',
      });
    });

    it('should parse "next Monday"', () => {
      const result = parseNaturalDate({
        input: 'next Monday',
        timezone: 'UTC',
      });

      expect(result).toEqual({
        parsed_date: '2025-01-13T10:00:00.000Z',
        interpretation: 'Next Monday (January 13, 2025)',
        timezone_used: 'UTC',
      });
    });

    it('should parse "next Friday" (tomorrow)', () => {
      const result = parseNaturalDate({
        input: 'next Friday',
        timezone: 'UTC',
      });

      expect(result).toEqual({
        parsed_date: '2025-01-10T10:00:00.000Z',
        interpretation: 'Next Friday (January 10, 2025)',
        timezone_used: 'UTC',
      });
    });
  });

  describe('relative day patterns', () => {
    it('should parse "tomorrow"', () => {
      const result = parseNaturalDate({
        input: 'tomorrow',
        timezone: 'UTC',
      });

      expect(result).toEqual({
        parsed_date: '2025-01-10T10:00:00.000Z',
        interpretation: 'Tomorrow (January 10, 2025)',
        timezone_used: 'UTC',
      });
    });

    it('should parse "yesterday"', () => {
      const result = parseNaturalDate({
        input: 'yesterday',
        timezone: 'UTC',
      });

      expect(result).toEqual({
        parsed_date: '2025-01-08T10:00:00.000Z',
        interpretation: 'Yesterday (January 8, 2025)',
        timezone_used: 'UTC',
      });
    });

    it('should parse "today"', () => {
      const result = parseNaturalDate({
        input: 'today',
        timezone: 'UTC',
      });

      expect(result).toEqual({
        parsed_date: '2025-01-09T10:00:00.000Z',
        interpretation: 'Today (January 9, 2025)',
        timezone_used: 'UTC',
      });
    });
  });

  describe('relative duration patterns', () => {
    it('should parse "in 3 days"', () => {
      const result = parseNaturalDate({
        input: 'in 3 days',
        timezone: 'UTC',
      });

      expect(result).toEqual({
        parsed_date: '2025-01-12T10:00:00.000Z',
        interpretation: 'In 3 days (January 12, 2025)',
        timezone_used: 'UTC',
      });
    });

    it('should parse "in 2 weeks"', () => {
      const result = parseNaturalDate({
        input: 'in 2 weeks',
        timezone: 'UTC',
      });

      expect(result).toEqual({
        parsed_date: '2025-01-23T10:00:00.000Z',
        interpretation: 'In 2 weeks (January 23, 2025)',
        timezone_used: 'UTC',
      });
    });

    it('should parse "in 1 month"', () => {
      const result = parseNaturalDate({
        input: 'in 1 month',
        timezone: 'UTC',
      });

      expect(result).toEqual({
        parsed_date: '2025-02-09T10:00:00.000Z',
        interpretation: 'In 1 month (February 9, 2025)',
        timezone_used: 'UTC',
      });
    });
  });

  describe('time-specific patterns', () => {
    it('should parse "tomorrow at 3pm"', () => {
      const result = parseNaturalDate({
        input: 'tomorrow at 3pm',
        timezone: 'UTC',
      });

      expect(result).toEqual({
        parsed_date: '2025-01-10T15:00:00.000Z',
        interpretation: 'Tomorrow at 3:00 PM (January 10, 2025)',
        timezone_used: 'UTC',
      });
    });

    it('should parse "tomorrow at 3:30pm"', () => {
      const result = parseNaturalDate({
        input: 'tomorrow at 3:30pm',
        timezone: 'UTC',
      });

      expect(result).toEqual({
        parsed_date: '2025-01-10T15:30:00.000Z',
        interpretation: 'Tomorrow at 3:30 PM (January 10, 2025)',
        timezone_used: 'UTC',
      });
    });

    it('should parse "next Tuesday at 2pm"', () => {
      const result = parseNaturalDate({
        input: 'next Tuesday at 2pm',
        timezone: 'UTC',
      });

      expect(result).toEqual({
        parsed_date: '2025-01-14T14:00:00.000Z',
        interpretation: 'Next Tuesday at 2:00 PM (January 14, 2025)',
        timezone_used: 'UTC',
      });
    });
  });

  describe('timezone handling', () => {
    it('should respect timezone parameter', () => {
      const result = parseNaturalDate({
        input: 'tomorrow at 3pm',
        timezone: 'America/New_York',
      });

      expect(result).toEqual({
        parsed_date: '2025-01-10T15:00:00.000-05:00',
        interpretation: 'Tomorrow at 3:00 PM EST (January 10, 2025)',
        timezone_used: 'America/New_York',
      });
    });

    it('should use system timezone when not specified', () => {
      const result = parseNaturalDate({
        input: 'tomorrow',
        // timezone not specified
      });

      expect(result.timezone_used).toBeDefined();
      expect(result.parsed_date).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle unrecognized patterns', () => {
      expect(() => {
        parseNaturalDate({
          input: "the day after tomorrow's yesterday",
        });
      }).toThrow('Could not parse natural language date');
    });

    it('should handle empty input', () => {
      expect(() => {
        parseNaturalDate({
          input: '',
        });
      }).toThrow('Input is required');
    });

    it('should handle invalid timezone', () => {
      expect(() => {
        parseNaturalDate({
          input: 'tomorrow',
          timezone: 'Invalid/Timezone',
        });
      }).toThrow('Invalid timezone');
    });
  });

  describe('case insensitivity', () => {
    it('should handle mixed case input', () => {
      const result = parseNaturalDate({
        input: 'Next TUESDAY at 3PM',
        timezone: 'UTC',
      });

      expect(result.parsed_date).toBe('2025-01-14T15:00:00.000Z');
    });
  });
});
