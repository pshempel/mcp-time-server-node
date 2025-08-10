#!/usr/bin/env node

/**
 * Research script to verify recurrence pattern behavior
 * Tests date-fns and date-fns-tz for recurrence calculations
 */

const {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  getDay,
  getDate,
  isAfter,
  startOfDay,
  differenceInDays,
} = require('date-fns');
const { toZonedTime, fromZonedTime } = require('date-fns-tz');

console.log('=== Recurrence Pattern Research ===\n');

// Test 1: Daily recurrence
console.log('1. Daily Recurrence Tests:');
const now = new Date('2025-01-15T10:30:00Z');
console.log(`Starting from: ${now.toISOString()}`);

// Simple daily - next day at same time
const nextDay = addDays(now, 1);
console.log(`Next day (same time): ${nextDay.toISOString()}`);

// Daily at specific time (14:30)
let dailyWithTime = new Date(now);
dailyWithTime = setHours(dailyWithTime, 14);
dailyWithTime = setMinutes(dailyWithTime, 30);
dailyWithTime = setSeconds(dailyWithTime, 0);
dailyWithTime = setMilliseconds(dailyWithTime, 0);

if (isAfter(dailyWithTime, now)) {
  console.log(`Today at 14:30: ${dailyWithTime.toISOString()}`);
} else {
  dailyWithTime = addDays(dailyWithTime, 1);
  console.log(`Tomorrow at 14:30: ${dailyWithTime.toISOString()}`);
}

// Test 2: Weekly recurrence
console.log('\n2. Weekly Recurrence Tests:');
const currentDay = getDay(now); // 3 (Wednesday)
console.log(`Current day of week: ${currentDay} (0=Sunday, 3=Wednesday)`);

// Next Friday (day 5)
const targetDay = 5;
const daysUntilFriday = (targetDay - currentDay + 7) % 7;
console.log(`Days until Friday: ${daysUntilFriday}`);
const nextFriday = addDays(now, daysUntilFriday);
console.log(`Next Friday: ${nextFriday.toISOString()}`);

// Test 3: Monthly recurrence
console.log('\n3. Monthly Recurrence Tests:');
const currentDayOfMonth = getDate(now); // 15
console.log(`Current day of month: ${currentDayOfMonth}`);

// Next occurrence of 20th
let next20th = new Date(now);
if (currentDayOfMonth >= 20) {
  next20th = addMonths(next20th, 1);
}
next20th.setDate(20);
console.log(`Next 20th: ${next20th.toISOString()}`);

// Test month overflow (31st in February)
console.log('\n4. Month Overflow Tests:');
const jan31 = new Date('2025-01-31T10:00:00Z');
let nextMonth31 = addMonths(jan31, 1);
nextMonth31.setDate(31);
console.log(`Jan 31 + 1 month, set to 31st: ${nextMonth31.toISOString()}`);
console.log(`Actual date: ${nextMonth31.getDate()}`); // Will be 3 (March 3)

// Proper handling - check if date overflowed
if (nextMonth31.getDate() !== 31) {
  nextMonth31.setDate(0); // Last day of previous month
  console.log(`Corrected to last day of Feb: ${nextMonth31.toISOString()}`);
}

// Test 5: Timezone handling
console.log('\n5. Timezone Handling:');
const nyTz = 'America/New_York';
const zonedNow = toZonedTime(now, nyTz);
console.log(`UTC time: ${now.toISOString()}`);
console.log(`NY zoned time object: ${zonedNow.toISOString()}`);

// Set time in NY timezone
let nyTime = new Date(zonedNow);
nyTime = setHours(nyTime, 14);
nyTime = setMinutes(nyTime, 30);
console.log(`NY 14:30 (as Date object): ${nyTime.toISOString()}`);

// Convert back to UTC
const utcFromNy = fromZonedTime(nyTime, nyTz);
console.log(`NY 14:30 converted to UTC: ${utcFromNy.toISOString()}`);

// Test 6: DST edge cases
console.log('\n6. DST Edge Cases:');
const beforeDst = new Date('2025-03-08T15:00:00Z'); // Day before DST
const afterDst = addDays(beforeDst, 1);
console.log(`Before DST: ${beforeDst.toISOString()}`);
console.log(`After DST: ${afterDst.toISOString()}`);

// In NY timezone
const nyBeforeDst = toZonedTime(beforeDst, nyTz);
const nyAfterDst = toZonedTime(afterDst, nyTz);
console.log(`NY before DST: ${nyBeforeDst.toISOString()}`);
console.log(`NY after DST: ${nyAfterDst.toISOString()}`);

// Test 7: Days until calculation
console.log('\n7. Days Until Calculation:');
const future = new Date('2025-01-20T14:30:00Z');
const daysUntil = differenceInDays(startOfDay(future), startOfDay(now));
console.log(`Days from ${now.toISOString()} to ${future.toISOString()}: ${daysUntil}`);

// Test edge case - same day but different times
const laterToday = new Date('2025-01-15T20:00:00Z');
const daysUntilLaterToday = differenceInDays(startOfDay(laterToday), startOfDay(now));
console.log(`Days until later today: ${daysUntilLaterToday}`);

console.log('\n=== End of Research ===');
