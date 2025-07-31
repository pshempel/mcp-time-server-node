import { addDays, isAfter, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

import type { RecurrencePattern, DailyParams } from '../../types/recurrence';

export class DailyRecurrence implements RecurrencePattern {
  calculate(from: Date, params: DailyParams): Date {
    const timezone = params.timezone ?? 'UTC';
    const time = params.time;

    if (!time) {
      // No specific time, just add one day
      return addDays(from, 1);
    }

    // Parse time string
    const [hours, minutes] = time.split(':').map(Number);

    if (timezone === '' || timezone === 'UTC') {
      return this.calculateInUTC(from, hours, minutes);
    }

    return this.calculateInTimezone(from, hours, minutes, timezone);
  }

  private calculateInUTC(from: Date, hours: number, minutes: number): Date {
    const result = new Date(from);
    result.setUTCHours(hours);
    result.setUTCMinutes(minutes);
    result.setUTCSeconds(0);
    result.setUTCMilliseconds(0);

    // If the time has already passed or is exactly now, move to tomorrow
    if (!isAfter(result, from)) {
      return addDays(result, 1);
    }

    return result;
  }

  private calculateInTimezone(from: Date, hours: number, minutes: number, timezone: string): Date {
    // Convert to target timezone
    const zonedFrom = toZonedTime(from, timezone);

    // Set the time in the timezone
    let result = new Date(zonedFrom);
    result = setHours(result, hours);
    result = setMinutes(result, minutes);
    result = setSeconds(result, 0);
    result = setMilliseconds(result, 0);

    // If the time has already passed or is exactly now, move to tomorrow
    if (!isAfter(result, zonedFrom)) {
      result = addDays(result, 1);
    }

    // Convert back to UTC
    return fromZonedTime(result, timezone);
  }
}
