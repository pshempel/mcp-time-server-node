import { describe, it, expect, jest } from '@jest/globals';

import { RecurrenceFactory } from '../../../src/tools/recurrence/RecurrenceFactory';
import { RecurrenceValidator } from '../../../src/tools/recurrence/RecurrenceValidator';
import { DailyRecurrence } from '../../../src/tools/recurrence/DailyRecurrence';
import { WeeklyRecurrence } from '../../../src/tools/recurrence/WeeklyRecurrence';
import { MonthlyRecurrence } from '../../../src/tools/recurrence/MonthlyRecurrence';
import { YearlyRecurrence } from '../../../src/tools/recurrence/YearlyRecurrence';
import type {
  DailyParams,
  WeeklyParams,
  MonthlyParams,
  YearlyParams,
} from '../../../src/types/recurrence';

describe('RecurrenceFactory', () => {
  const factory = new RecurrenceFactory();

  describe('pattern selection', () => {
    it('should create DailyRecurrence for daily pattern', () => {
      const params: DailyParams = { pattern: 'daily' };
      const recurrence = factory.create(params);
      expect(recurrence).toBeInstanceOf(DailyRecurrence);
    });

    it('should create WeeklyRecurrence for weekly pattern', () => {
      const params: WeeklyParams = { pattern: 'weekly' };
      const recurrence = factory.create(params);
      expect(recurrence).toBeInstanceOf(WeeklyRecurrence);
    });

    it('should create MonthlyRecurrence for monthly pattern', () => {
      const params: MonthlyParams = { pattern: 'monthly', dayOfMonth: 15 };
      const recurrence = factory.create(params);
      expect(recurrence).toBeInstanceOf(MonthlyRecurrence);
    });

    it('should create YearlyRecurrence for yearly pattern', () => {
      const params: YearlyParams = { pattern: 'yearly' };
      const recurrence = factory.create(params);
      expect(recurrence).toBeInstanceOf(YearlyRecurrence);
    });
  });

  describe('validation', () => {
    it('should validate params before creating instance', () => {
      const validatorSpy = jest.spyOn(RecurrenceValidator.prototype, 'validate');

      const params: DailyParams = { pattern: 'daily' };
      factory.create(params);

      expect(validatorSpy).toHaveBeenCalledWith(params);
      validatorSpy.mockRestore();
    });

    it('should throw validation error for invalid pattern', () => {
      const params = { pattern: 'invalid' } as any;

      expect(() => factory.create(params)).toThrow(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INVALID_PARAMETER',
            message: expect.stringContaining('Invalid pattern'),
          }),
        }),
      );
    });

    it('should throw validation error for missing required fields', () => {
      const params = { pattern: 'monthly' } as MonthlyParams;

      expect(() => factory.create(params)).toThrow(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INVALID_PARAMETER',
            message: expect.stringContaining('dayOfMonth is required'),
          }),
        }),
      );
    });
  });

  describe('calculate method', () => {
    it('should validate and calculate in one step', () => {
      const from = new Date('2024-01-15T10:00:00Z');
      const params: DailyParams = { pattern: 'daily' };

      const result = factory.calculate(from, params);

      expect(result).toEqual(new Date('2024-01-16T10:00:00Z'));
    });

    it('should handle weekly calculation', () => {
      const from = new Date('2024-01-15T10:00:00Z'); // Monday
      const params: WeeklyParams = { pattern: 'weekly', dayOfWeek: 3 }; // Wednesday

      const result = factory.calculate(from, params);

      expect(result).toEqual(new Date('2024-01-17T10:00:00Z'));
    });

    it('should handle monthly calculation', () => {
      const from = new Date('2024-01-15T10:00:00Z');
      const params: MonthlyParams = { pattern: 'monthly', dayOfMonth: 20 };

      const result = factory.calculate(from, params);

      expect(result).toEqual(new Date('2024-01-20T00:00:00Z'));
    });

    it('should handle yearly calculation', () => {
      const from = new Date('2024-06-15T10:00:00Z');
      const params: YearlyParams = { pattern: 'yearly' };

      const result = factory.calculate(from, params);

      expect(result).toEqual(new Date('2025-06-15T10:00:00Z'));
    });

    it('should throw for invalid params in calculate', () => {
      const from = new Date('2024-01-15T10:00:00Z');
      const params = { pattern: 'invalid' } as any;

      expect(() => factory.calculate(from, params)).toThrow(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INVALID_PARAMETER',
          }),
        }),
      );
    });
  });

  describe('timezone handling', () => {
    it('should pass timezone to recurrence instance', () => {
      const from = new Date('2024-01-15T10:00:00Z'); // 5:00 AM NY time
      const params: DailyParams = {
        pattern: 'daily',
        timezone: 'America/New_York',
        time: '14:30', // 2:30 PM NY time - hasn't passed yet
      };

      const result = factory.calculate(from, params);

      // Should be 14:30 NY time TODAY since time hasn't passed
      expect(result).toEqual(new Date('2024-01-15T19:30:00Z')); // 14:30 EST = 19:30 UTC
    });

    it('should handle UTC timezone (empty string)', () => {
      const from = new Date('2024-01-15T10:00:00Z');
      const params: DailyParams = {
        pattern: 'daily',
        timezone: '',
        time: '14:30', // Time hasn't passed yet
      };

      const result = factory.calculate(from, params);

      // Should be today since time hasn't passed
      expect(result).toEqual(new Date('2024-01-15T14:30:00Z'));
    });

    it('should use system timezone when undefined', () => {
      const from = new Date('2024-01-15T10:00:00Z');
      const params: DailyParams = {
        pattern: 'daily',
        // timezone undefined - should use system timezone
      };

      const result = factory.calculate(from, params);

      // Without timezone, should just add 1 day in UTC
      expect(result).toEqual(new Date('2024-01-16T10:00:00Z'));
    });
  });
});
