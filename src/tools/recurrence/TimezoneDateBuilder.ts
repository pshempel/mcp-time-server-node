import { addDays, isAfter, setHours, setMilliseconds, setMinutes, setSeconds } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export function setTimeInTimezone(
  date: Date,
  hours: number,
  minutes: number,
  timezone: string,
): Date {
  if (timezone === '' || timezone === 'UTC') {
    const result = new Date(date);
    result.setUTCHours(hours);
    result.setUTCMinutes(minutes);
    result.setUTCSeconds(0);
    result.setUTCMilliseconds(0);
    return result;
  }

  // Convert to target timezone
  const zonedDate = toZonedTime(date, timezone);

  // Set the time in that timezone
  let result = new Date(zonedDate);
  result = setHours(result, hours);
  result = setMinutes(result, minutes);
  result = setSeconds(result, 0);
  result = setMilliseconds(result, 0);

  // Convert back to UTC
  return fromZonedTime(result, timezone);
}

export function addDaysInTimezone(date: Date, days: number, timezone: string): Date {
  if (timezone === '' || timezone === 'UTC') {
    return addDays(date, days);
  }

  // Convert to timezone, add days, convert back
  // This preserves the local time across DST boundaries
  const zonedDate = toZonedTime(date, timezone);
  const resultInZone = addDays(zonedDate, days);
  return fromZonedTime(resultInZone, timezone);
}

export function isTimeInFuture(time: Date, referenceTime: Date): boolean {
  return isAfter(time, referenceTime);
}
