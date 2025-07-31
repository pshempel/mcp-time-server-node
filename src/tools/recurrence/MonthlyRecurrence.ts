import { toZonedTime, fromZonedTime } from 'date-fns-tz';

import type { RecurrencePattern, MonthlyParams } from '../../types/recurrence';

export class MonthlyRecurrence implements RecurrencePattern {
  calculate(from: Date, params: MonthlyParams): Date {
    const timezone = params.timezone ?? 'UTC';

    if (timezone === 'UTC') {
      return this.calculateUTC(from, params);
    }

    return this.calculateWithTimezone(from, params, timezone);
  }

  private calculateUTC(from: Date, params: MonthlyParams): Date {
    const targetDay = params.dayOfMonth;
    const targetTime = params.time;

    // Start with current month
    const fromYear = from.getUTCFullYear();
    const fromMonth = from.getUTCMonth();

    // Calculate initial target date
    let targetDate = this.createUTCDate(fromYear, fromMonth, targetDay);

    // Set time if specified
    if (targetTime) {
      const [hours, minutes] = targetTime.split(':').map(Number);
      targetDate.setUTCHours(hours, minutes, 0, 0);
    }

    // Check if we need to advance to next month
    if (targetDate <= from) {
      // Calculate next month
      const nextMonth = fromMonth === 11 ? 0 : fromMonth + 1;
      const nextYear = fromMonth === 11 ? fromYear + 1 : fromYear;

      targetDate = this.createUTCDate(nextYear, nextMonth, targetDay);

      // Reapply time if specified
      if (targetTime) {
        const [hours, minutes] = targetTime.split(':').map(Number);
        targetDate.setUTCHours(hours, minutes, 0, 0);
      }
    }

    return targetDate;
  }

  private calculateWithTimezone(from: Date, params: MonthlyParams, timezone: string): Date {
    const targetDay = params.dayOfMonth;
    const targetTime = params.time;

    // Convert to timezone for calculations
    const fromInTz = toZonedTime(from, timezone);
    const year = fromInTz.getFullYear();
    const month = fromInTz.getMonth();

    // Calculate initial target date
    let targetDate = this.createTimezoneDate(year, month, targetDay, timezone);

    // Set time if specified
    if (targetTime) {
      targetDate = this.setTimeInTimezone(targetDate, targetTime, timezone);
    }

    // Check if we need to advance to next month
    if (targetDate <= from) {
      // Calculate next month
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;

      targetDate = this.createTimezoneDate(nextYear, nextMonth, targetDay, timezone);

      // Reapply time if specified
      if (targetTime) {
        targetDate = this.setTimeInTimezone(targetDate, targetTime, timezone);
      }
    }

    return targetDate;
  }

  private createUTCDate(year: number, month: number, requestedDay: number): Date {
    if (requestedDay === -1) {
      // Last day of month
      return new Date(Date.UTC(year, month + 1, 0));
    }

    // Get last day of month
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const actualDay = Math.min(requestedDay, lastDay);

    return new Date(Date.UTC(year, month, actualDay));
  }

  private createTimezoneDate(
    year: number,
    month: number,
    requestedDay: number,
    timezone: string,
  ): Date {
    let actualDay: number;

    if (requestedDay === -1) {
      // Last day of month
      actualDay = new Date(year, month + 1, 0).getDate();
    } else {
      // Get last day of month
      const lastDay = new Date(year, month + 1, 0).getDate();
      actualDay = Math.min(requestedDay, lastDay);
    }

    // Create date in timezone context
    return fromZonedTime(new Date(year, month, actualDay), timezone);
  }

  private setTimeInTimezone(date: Date, timeStr: string, timezone: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const dateInTz = toZonedTime(date, timezone);
    dateInTz.setHours(hours, minutes, 0, 0);
    return fromZonedTime(dateInTz, timezone);
  }
}
