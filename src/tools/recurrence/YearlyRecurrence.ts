import { addYears } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

import type { RecurrencePattern, YearlyParams } from '../../types/recurrence';

export class YearlyRecurrence implements RecurrencePattern {
  calculate(from: Date, params: YearlyParams): Date {
    const timezone = params.timezone ?? 'UTC';
    const hasSpecificDate = params.month !== undefined && params.dayOfMonth !== undefined;

    if (hasSpecificDate) {
      return this.calculateSpecificDate(from, params, timezone);
    }

    return this.calculateSameDate(from, params, timezone);
  }

  private calculateSameDate(from: Date, params: YearlyParams, timezone: string): Date {
    const targetTime = params.time;

    if (timezone === 'UTC') {
      const nextDate = addYears(from, 1);

      // If time is specified, update it
      if (targetTime) {
        const [hours, minutes] = targetTime.split(':').map(Number);
        nextDate.setUTCHours(hours, minutes, 0, 0);
      }

      return nextDate;
    }

    // Timezone-aware calculation
    const fromInTz = toZonedTime(from, timezone);
    const nextDate = addYears(fromInTz, 1);

    // If time is specified, update it
    if (targetTime) {
      const [hours, minutes] = targetTime.split(':').map(Number);
      nextDate.setHours(hours, minutes, 0, 0);
    }

    return fromZonedTime(nextDate, timezone);
  }

  private calculateSpecificDate(from: Date, params: YearlyParams, timezone: string): Date {
    const targetMonth = params.month ?? 0; // Default to January if not specified
    const targetDay = params.dayOfMonth ?? 1; // Default to 1st if not specified
    const targetTime = params.time;

    if (timezone === 'UTC') {
      return this.calculateSpecificDateUTC(from, targetMonth, targetDay, targetTime);
    }

    return this.calculateSpecificDateTZ(from, targetMonth, targetDay, targetTime, timezone);
  }

  private calculateSpecificDateUTC(
    from: Date,
    targetMonth: number,
    targetDay: number,
    targetTime?: string,
  ): Date {
    const fromYear = from.getUTCFullYear();
    let targetDate = this.createUTCDate(fromYear, targetMonth, targetDay);

    // Set time if specified
    if (targetTime) {
      const [hours, minutes] = targetTime.split(':').map(Number);
      targetDate.setUTCHours(hours, minutes, 0, 0);
    }

    // If the target date has passed, advance to next year
    if (targetDate <= from) {
      targetDate = this.createUTCDate(fromYear + 1, targetMonth, targetDay);
      if (targetTime) {
        const [hours, minutes] = targetTime.split(':').map(Number);
        targetDate.setUTCHours(hours, minutes, 0, 0);
      }
    }

    return targetDate;
  }

  private calculateSpecificDateTZ(
    from: Date,
    targetMonth: number,
    targetDay: number,
    targetTime: string | undefined,
    timezone: string,
  ): Date {
    const fromInTz = toZonedTime(from, timezone);
    const fromYear = fromInTz.getFullYear();

    let targetDate = this.createTimezoneDate(fromYear, targetMonth, targetDay, timezone);

    // Set time if specified
    if (targetTime) {
      const [hours, minutes] = targetTime.split(':').map(Number);
      const dateInTz = toZonedTime(targetDate, timezone);
      dateInTz.setHours(hours, minutes, 0, 0);
      targetDate = fromZonedTime(dateInTz, timezone);
    }

    // If the target date has passed, advance to next year
    if (targetDate <= from) {
      targetDate = this.createTimezoneDate(fromYear + 1, targetMonth, targetDay, timezone);
      if (targetTime) {
        const [hours, minutes] = targetTime.split(':').map(Number);
        const dateInTz = toZonedTime(targetDate, timezone);
        dateInTz.setHours(hours, minutes, 0, 0);
        targetDate = fromZonedTime(dateInTz, timezone);
      }
    }

    return targetDate;
  }

  private createUTCDate(year: number, month: number, requestedDay: number): Date {
    if (requestedDay === -1) {
      // Last day of month
      return new Date(Date.UTC(year, month + 1, 0));
    }

    // Handle month-end overflow
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
      // Handle month-end overflow
      const lastDay = new Date(year, month + 1, 0).getDate();
      actualDay = Math.min(requestedDay, lastDay);
    }

    // Create date in timezone context
    return fromZonedTime(new Date(year, month, actualDay), timezone);
  }
}
