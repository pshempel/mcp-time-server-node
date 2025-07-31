export interface BaseRecurrenceParams {
  pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
  timezone?: string;
}

export interface DailyParams extends BaseRecurrenceParams {
  pattern: 'daily';
  time?: string;
}

export interface WeeklyParams extends BaseRecurrenceParams {
  pattern: 'weekly';
  dayOfWeek?: number;
  time?: string;
}

export interface MonthlyParams extends BaseRecurrenceParams {
  pattern: 'monthly';
  dayOfMonth: number; // 1-31, or -1 for last day
  time?: string;
}

export interface YearlyParams extends BaseRecurrenceParams {
  pattern: 'yearly';
  month?: number; // 0-11, optional for specific month
  dayOfMonth?: number; // 1-31, optional for specific day
  time?: string;
}

export type RecurrenceParams = DailyParams | WeeklyParams | MonthlyParams | YearlyParams;

export interface RecurrencePattern {
  calculate(from: Date, params: RecurrenceParams): Date;
}
