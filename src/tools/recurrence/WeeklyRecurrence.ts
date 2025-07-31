import { addDays, addWeeks, getDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

import type { RecurrencePattern, WeeklyParams } from '../../types/recurrence';

import { isTimeInFuture, setTimeInTimezone } from './TimezoneDateBuilder';

export class WeeklyRecurrence implements RecurrencePattern {
  calculate(from: Date, params: WeeklyParams): Date {
    const timezone = params.timezone ?? 'UTC';
    const { time, dayOfWeek } = params;

    // Get the target day of week
    const targetDay = this.getTargetDay(from, dayOfWeek, timezone);

    // Calculate days until target
    const daysToAdd = this.calculateDaysToAdd(from, targetDay, timezone);

    if (daysToAdd === 0) {
      return this.handleSameDay(from, time, timezone);
    }

    // Add days to reach target day
    const targetDate = addDays(from, daysToAdd);

    // Set time if specified
    if (time) {
      const [hours, minutes] = time.split(':').map(Number);
      return setTimeInTimezone(targetDate, hours, minutes, timezone);
    }

    return targetDate;
  }

  private getTargetDay(from: Date, dayOfWeek: number | undefined, timezone: string): number {
    if (dayOfWeek !== undefined) {
      return dayOfWeek;
    }

    // Default to same day of week
    if (timezone === '' || timezone === 'UTC') {
      return getDay(from);
    }

    const zonedFrom = toZonedTime(from, timezone);
    return getDay(zonedFrom);
  }

  private calculateDaysToAdd(from: Date, targetDay: number, timezone: string): number {
    let currentDay: number;

    if (timezone === '' || timezone === 'UTC') {
      currentDay = getDay(from);
    } else {
      const zonedFrom = toZonedTime(from, timezone);
      currentDay = getDay(zonedFrom);
    }

    return (targetDay - currentDay + 7) % 7;
  }

  private handleSameDay(from: Date, time: string | undefined, timezone: string): Date {
    if (!time) {
      // No specific time, force next week
      return addWeeks(from, 1);
    }

    // Parse time string
    const [hours, minutes] = time.split(':').map(Number);

    // Check if time has passed
    const withTime = setTimeInTimezone(from, hours, minutes, timezone);

    if (isTimeInFuture(withTime, from)) {
      // Time hasn't passed, use today
      return withTime;
    }

    // Time has passed, go to next week
    const nextWeek = addWeeks(from, 1);
    return setTimeInTimezone(nextWeek, hours, minutes, timezone);
  }
}
