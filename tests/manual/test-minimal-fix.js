#!/usr/bin/env node
const { toDate, formatInTimeZone } = require('date-fns-tz');
const { format, eachDayOfInterval, differenceInMinutes } = require('date-fns');

console.log('=== Testing Minimal Fix Approach ===\n');

// The problem: calculate business hours from 10 AM to 2 PM Tokyo time
const startStr = '2025-01-21T10:00:00';
const endStr = '2025-01-21T14:00:00';
const timezone = 'Asia/Tokyo';

// Current approach: parse as Tokyo time -> UTC
const startDate = toDate(startStr, { timeZone: timezone });
const endDate = toDate(endStr, { timeZone: timezone });

console.log('Parsed to UTC:');
console.log('Start:', startDate.toISOString());
console.log('End:', endDate.toISOString());

// The issue: eachDayOfInterval gives us days in system TZ
const days = eachDayOfInterval({ start: startDate, end: endDate });
console.log('\nDays from eachDayOfInterval:', days.length);
days.forEach((d) => console.log('-', format(d, 'yyyy-MM-dd')));

// Solution: We need to check what day it is IN THE BUSINESS TIMEZONE
console.log('\n=== Solution ===');

// Format the dates in business timezone to get the actual business dates
const startDateInBizTz = formatInTimeZone(startDate, timezone, 'yyyy-MM-dd');
const endDateInBizTz = formatInTimeZone(endDate, timezone, 'yyyy-MM-dd');

console.log('Start date in Tokyo:', startDateInBizTz);
console.log('End date in Tokyo:', endDateInBizTz);

// For single day calculation:
if (startDateInBizTz === endDateInBizTz) {
  console.log('\nSingle day calculation');

  // Get the times in Tokyo
  const startHourInTokyo = parseInt(formatInTimeZone(startDate, timezone, 'HH'), 10);
  const startMinuteInTokyo = parseInt(formatInTimeZone(startDate, timezone, 'mm'), 10);
  const endHourInTokyo = parseInt(formatInTimeZone(endDate, timezone, 'HH'), 10);
  const endMinuteInTokyo = parseInt(formatInTimeZone(endDate, timezone, 'mm'), 10);

  console.log(`Start time in Tokyo: ${startHourInTokyo}:${startMinuteInTokyo}`);
  console.log(`End time in Tokyo: ${endHourInTokyo}:${endMinuteInTokyo}`);

  // Business hours in Tokyo (9 AM - 5 PM)
  const bizStartHour = 9;
  const bizEndHour = 17;

  // Calculate overlap
  const effectiveStartHour = Math.max(startHourInTokyo, bizStartHour);
  const effectiveEndHour = Math.min(endHourInTokyo, bizEndHour);

  if (effectiveStartHour < effectiveEndHour) {
    const hours = effectiveEndHour - effectiveStartHour;
    console.log(`Business hours: ${hours}`);
  }
}

// Alternative: just use the UTC times directly
console.log('\n=== Direct calculation ===');
const totalMinutes = differenceInMinutes(endDate, startDate);
console.log('Total minutes between times:', totalMinutes);
console.log('Total hours:', totalMinutes / 60);

console.log('\n=== Done ===');
