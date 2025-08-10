// Error codes for the time server
export enum TimeServerErrorCodes {
  INVALID_TIMEZONE = 'INVALID_TIMEZONE',
  INVALID_DATE_FORMAT = 'INVALID_DATE_FORMAT',
  INVALID_TIME_UNIT = 'INVALID_TIME_UNIT',
  INVALID_RECURRENCE_PATTERN = 'INVALID_RECURRENCE_PATTERN',
  INVALID_DAY_OF_WEEK = 'INVALID_DAY_OF_WEEK',
  INVALID_DAY_OF_MONTH = 'INVALID_DAY_OF_MONTH',
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CACHE_ERROR = 'CACHE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

// Error structure
export interface TimeServerError {
  code: TimeServerErrorCodes;
  message: string;
  details?: unknown;
}

// Valid time units for calculations
export type TimeUnit = 'years' | 'months' | 'days' | 'hours' | 'minutes' | 'seconds';

// Recurrence patterns
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly';

// Tool parameter interfaces
export interface GetCurrentTimeParams {
  timezone?: string;
  format?: string;
  include_offset?: boolean;
}

export interface GetCurrentTimeResult {
  time: string;
  timezone: string;
  offset: string;
  unix: number;
  iso: string;
}

export interface ConvertTimezoneParams {
  time: string;
  from_timezone: string;
  to_timezone: string;
  format?: string;
}

export interface ConvertTimezoneResult {
  original: string;
  converted: string;
  from_offset: string;
  to_offset: string;
  difference: number;
}

export interface AddTimeParams {
  time: string;
  amount: number;
  unit: TimeUnit;
  timezone?: string;
}

export type SubtractTimeParams = AddTimeParams;

export interface TimeCalculationResult {
  original: string;
  result: string;
  unix_original: number;
  unix_result: number;
}

// Type alias for consistency with test
export type AddTimeResult = TimeCalculationResult;
export type SubtractTimeResult = TimeCalculationResult;

export interface CalculateDurationParams {
  start_time: string;
  end_time: string;
  unit?: string;
  timezone?: string;
}

export interface CalculateDurationResult {
  milliseconds: number;
  seconds: number;
  minutes: number;
  hours: number;
  days: number;
  formatted: string;
  is_negative: boolean;
}

export interface GetBusinessDaysParams {
  start_date: string;
  end_date: string;
  exclude_weekends?: boolean;
  holidays?: string[];
  timezone?: string;
  holiday_calendar?: string;
  include_observed?: boolean;
  custom_holidays?: string[];
}

export interface GetBusinessDaysResult {
  total_days: number;
  business_days: number;
  weekend_days: number;
  holiday_count: number;
}

export interface NextOccurrenceParams {
  pattern: RecurrencePattern;
  start_from?: string;
  day_of_week?: number;
  day_of_month?: number;
  time?: string;
  timezone?: string;
}

export interface NextOccurrenceResult {
  next: string;
  unix: number;
  days_until: number;
}

export interface FormatTimeParams {
  time: string;
  format: 'relative' | 'calendar' | 'custom';
  custom_format?: string;
  timezone?: string;
}

export interface FormatTimeResult {
  formatted: string;
  original: string;
}

// Business hours types
export interface BusinessHours {
  start: { hour: number; minute: number };
  end: { hour: number; minute: number };
}

export interface WeeklyBusinessHours {
  [dayOfWeek: number]: BusinessHours | null; // 0-6, Sunday=0, null=closed
}

export interface CalculateBusinessHoursParams {
  start_time: string;
  end_time: string;
  business_hours?: BusinessHours | WeeklyBusinessHours;
  timezone?: string;
  holidays?: string[];
  include_weekends?: boolean;
}

export interface DayBusinessHours {
  date: string;
  day_of_week: string;
  business_minutes: number;
  is_weekend: boolean;
  is_holiday: boolean;
}

export interface CalculateBusinessHoursResult {
  total_business_minutes: number;
  total_business_hours: number;
  breakdown: DayBusinessHours[];
}

export interface DaysUntilParams {
  target_date: string | number;
  timezone?: string;
  format_result?: boolean;
}

export type DaysUntilResult = number | string;

export interface ParseNaturalDateParams {
  input: string;
  timezone?: string;
  reference_date?: string | number;
}

export interface ParseNaturalDateResult {
  parsed_date: string;
  interpretation: string;
  timezone_used: string;
}
