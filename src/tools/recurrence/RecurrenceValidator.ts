// SDK 1.17.2 export issue workaround
const path = require('path');
const sdkPath = path.resolve(__dirname, '../../../node_modules/@modelcontextprotocol/sdk/dist/cjs/types');
const { ErrorCode } = require(sdkPath);

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
      const err: any = new Error('Invalid pattern');
      err.code = ErrorCode.InvalidParams;
      err.data = { pattern: validParams.pattern };
      throw err;
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
      const err: any = new Error('Pattern is required');
      err.code = ErrorCode.InvalidParams;
      err.data = { pattern: p?.pattern };
      throw err;
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
      const err: any = new Error(`Invalid timezone: ${timezone}`);
      err.code = ErrorCode.InvalidParams;
      err.data = { timezone };
      throw err;
    }
  }

  private validateTimeField(time: string | undefined): void {
    if (time === undefined) {
      return;
    }

    const timeMatch = time.match(/^(\d{1,2}):(\d{2})$/);
    if (!timeMatch) {
      debug.error('Invalid time format: %s', time);
      const err: any = new Error('Invalid time format');
      err.code = ErrorCode.InvalidParams;
      err.data = { time };
      throw err;
    }

    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      debug.error('Invalid time format (hours/minutes out of range): %s', time);
      const err: any = new Error('Invalid time format');
      err.code = ErrorCode.InvalidParams;
      err.data = { time };
      throw err;
    }
  }

  private validateDailyParams(_params: DailyParams): void {
    // Daily has no additional fields to validate
  }

  private validateWeeklyParams(params: WeeklyParams): void {
    // dayOfWeek is optional, but if provided must be valid
    if (params.dayOfWeek !== undefined && !validateDayOfWeek(params.dayOfWeek)) {
      debug.error('Invalid day_of_week: %s', params.dayOfWeek);
      const err: any = new Error('Invalid day_of_week');
      err.code = ErrorCode.InvalidParams;
      err.data = { dayOfWeek: params.dayOfWeek };
      throw err;
    }
  }

  private validateMonthlyParams(params: MonthlyParams): void {
    // dayOfMonth is required for monthly
    if (params.dayOfMonth === undefined) {
      debug.error('dayOfMonth is required for monthly pattern');
      const err: any = new Error('dayOfMonth is required for monthly pattern');
      err.code = ErrorCode.InvalidParams;
      err.data = { pattern: params.pattern };
      throw err;
    }

    // Special case: -1 means last day of month
    const isValidDay =
      params.dayOfMonth === -1 ||
      (Number.isInteger(params.dayOfMonth) && params.dayOfMonth >= 1 && params.dayOfMonth <= 31);

    if (!isValidDay) {
      debug.error('Invalid day_of_month: %s', params.dayOfMonth);
      const err: any = new Error('Invalid day_of_month');
      err.code = ErrorCode.InvalidParams;
      err.data = { dayOfMonth: params.dayOfMonth };
      throw err;
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
    params: YearlyParams,
  ): void {
    if (hasMonth !== hasDayOfMonth) {
      debug.error('Both month and dayOfMonth must be provided together for yearly pattern');
      const err: any = new Error('Both month and dayOfMonth must be provided together for yearly pattern');
      err.code = ErrorCode.InvalidParams;
      err.data = { month: params.month, dayOfMonth: params.dayOfMonth };
      throw err;
    }
  }

  private validateYearlyMonth(month: number | undefined): void {
    if (month === undefined) {
      return;
    }

    const isValidMonth = Number.isInteger(month) && month >= 0 && month <= 11;
    if (!isValidMonth) {
      debug.error('Invalid month (must be 0-11): %s', month);
      const err: any = new Error('Invalid month (must be 0-11)');
      err.code = ErrorCode.InvalidParams;
      err.data = { month };
      throw err;
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
      const err: any = new Error('Invalid day_of_month');
      err.code = ErrorCode.InvalidParams;
      err.data = { dayOfMonth };
      throw err;
    }
  }
}
