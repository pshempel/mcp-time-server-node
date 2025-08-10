import { ValidationError, TimezoneError } from '../../adapters/mcp-sdk';
import type {
  RecurrenceParams,
  DailyParams,
  WeeklyParams,
  MonthlyParams,
  YearlyParams,
} from '../../types/recurrence';
import { debug } from '../../utils/debug';
import {
  validateTimezone,
  validateRecurrencePattern,
  validateDayOfWeek,
  validateStringLength,
  LIMITS,
} from '../../utils/validation';

export class RecurrenceValidator {
  validate(params: RecurrenceParams): void {
    // Validate pattern exists
    this.validatePatternExists(params);

    // Pattern is guaranteed to exist now
    const validParams = params;

    // Validate pattern
    if (!validateRecurrencePattern(validParams.pattern)) {
      debug.error('Invalid pattern: %s', validParams.pattern);
      throw new ValidationError('Invalid pattern', { pattern: validParams.pattern });
    }

    // Validate common fields
    this.validateCommonFields(validParams);

    // Validate pattern-specific fields
    switch (validParams.pattern) {
      case 'daily':
        this.validateDailyParams(validParams);
        break;
      case 'weekly':
        this.validateWeeklyParams(validParams);
        break;
      case 'monthly':
        this.validateMonthlyParams(validParams);
        break;
      case 'yearly':
        this.validateYearlyParams(validParams);
        break;
    }
  }

  private validatePatternExists(params: RecurrenceParams): asserts params is RecurrenceParams {
    const p = params as { pattern?: string } | null | undefined;
    if (!p?.pattern) {
      debug.error('Pattern is required');
      throw new ValidationError('Pattern is required', { pattern: p?.pattern });
    }
  }

  private validateCommonFields(params: RecurrenceParams): void {
    this.validateTimezoneField(params.timezone);
    this.validateTimeField(params.time);
  }

  private validateTimezoneField(timezone: string | undefined): void {
    if (timezone === undefined) {
      return;
    }

    // Check length first
    if (timezone !== '') {
      validateStringLength(timezone, LIMITS.MAX_TIMEZONE_LENGTH, 'timezone');
    }

    // Empty string is valid (means UTC)
    if (timezone !== '' && !validateTimezone(timezone)) {
      debug.error('Invalid timezone: %s', timezone);
      throw new TimezoneError(`Invalid timezone: ${timezone}`, timezone);
    }
  }

  private validateTimeField(time: string | undefined): void {
    if (time === undefined) {
      return;
    }

    const timeMatch = time.match(/^(\d{1,2}):(\d{2})$/);
    if (!timeMatch) {
      debug.error('Invalid time format: %s', time);
      throw new ValidationError('Invalid time format', { time });
    }

    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      debug.error('Invalid time format (hours/minutes out of range): %s', time);
      throw new ValidationError('Invalid time format', { time });
    }
  }

  private validateDailyParams(_params: DailyParams): void {
    // Daily has no additional fields to validate
  }

  private validateWeeklyParams(params: WeeklyParams): void {
    // dayOfWeek is optional, but if provided must be valid
    if (params.dayOfWeek !== undefined && !validateDayOfWeek(params.dayOfWeek)) {
      debug.error('Invalid day_of_week: %s', params.dayOfWeek);
      throw new ValidationError('Invalid day_of_week', { dayOfWeek: params.dayOfWeek });
    }
  }

  private validateMonthlyParams(params: MonthlyParams): void {
    // dayOfMonth is required for monthly
    if (params.dayOfMonth === undefined) {
      debug.error('dayOfMonth is required for monthly pattern');
      throw new ValidationError('dayOfMonth is required for monthly pattern', {
        pattern: params.pattern,
      });
    }

    // Special case: -1 means last day of month
    const isValidDay =
      params.dayOfMonth === -1 ||
      (Number.isInteger(params.dayOfMonth) && params.dayOfMonth >= 1 && params.dayOfMonth <= 31);

    if (!isValidDay) {
      debug.error('Invalid day_of_month: %s', params.dayOfMonth);
      throw new ValidationError('Invalid day_of_month', { dayOfMonth: params.dayOfMonth });
    }
  }

  private validateYearlyParams(params: YearlyParams): void {
    const hasMonth = params.month !== undefined;
    const hasDayOfMonth = params.dayOfMonth !== undefined;

    this.validateYearlyFieldsPairing(hasMonth, hasDayOfMonth, params);
    this.validateYearlyMonth(params.month);
    this.validateYearlyDayOfMonth(params.dayOfMonth);
  }

  private validateYearlyFieldsPairing(
    hasMonth: boolean,
    hasDayOfMonth: boolean,
    params: YearlyParams
  ): void {
    if (hasMonth !== hasDayOfMonth) {
      debug.error('Both month and dayOfMonth must be provided together for yearly pattern');
      throw new ValidationError(
        'Both month and dayOfMonth must be provided together for yearly pattern',
        { month: params.month, dayOfMonth: params.dayOfMonth }
      );
    }
  }

  private validateYearlyMonth(month: number | undefined): void {
    if (month === undefined) {
      return;
    }

    const isValidMonth = Number.isInteger(month) && month >= 0 && month <= 11;
    if (!isValidMonth) {
      debug.error('Invalid month (must be 0-11): %s', month);
      throw new ValidationError('Invalid month (must be 0-11)', { month });
    }
  }

  private validateYearlyDayOfMonth(dayOfMonth: number | undefined): void {
    if (dayOfMonth === undefined) {
      return;
    }

    const isValidDay =
      dayOfMonth === -1 || (Number.isInteger(dayOfMonth) && dayOfMonth >= 1 && dayOfMonth <= 31);

    if (!isValidDay) {
      debug.error('Invalid day_of_month: %s', dayOfMonth);
      throw new ValidationError('Invalid day_of_month', { dayOfMonth });
    }
  }
}
