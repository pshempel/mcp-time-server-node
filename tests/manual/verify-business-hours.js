#!/usr/bin/env node
/**
 * Verify Business Hours Behavior with date-fns
 *
 * This script tests how business hours calculations should work with date-fns
 * to ensure our implementation matches expected behavior.
 */

const {
  parseISO,
  format,
  setHours,
  setMinutes,
  isWithinInterval,
  eachDayOfInterval,
  isWeekend,
  differenceInMinutes,
  getDay,
  isSameDay,
  addDays,
  startOfDay,
  endOfDay,
} = require('date-fns');
const { toDate, formatInTimeZone } = require('date-fns-tz');

console.log('=== Business Hours Behavior Verification ===\n');

// Test 1: Define business hours
console.log('1. Business Hours Definition:');
const businessHours = {
  start: { hour: 9, minute: 0 }, // 9:00 AM
  end: { hour: 17, minute: 0 }, // 5:00 PM
};
console.log('Standard business hours: 9:00 AM - 5:00 PM');

// Test 2: Check if a time is within business hours
console.log('\n2. Check if time is within business hours:');
const testDate = parseISO('2025-01-20T10:30:00');
const businessStart = setMinutes(
  setHours(testDate, businessHours.start.hour),
  businessHours.start.minute,
);
const businessEnd = setMinutes(
  setHours(testDate, businessHours.end.hour),
  businessHours.end.minute,
);

console.log('Test time:', format(testDate, 'yyyy-MM-dd HH:mm'));
console.log('Business start:', format(businessStart, 'HH:mm'));
console.log('Business end:', format(businessEnd, 'HH:mm'));
console.log(
  'Is within business hours:',
  isWithinInterval(testDate, { start: businessStart, end: businessEnd }),
);

// Test 3: Before business hours
const beforeHours = parseISO('2025-01-20T08:30:00');
console.log(
  '\nBefore hours (8:30 AM):',
  isWithinInterval(beforeHours, {
    start: setMinutes(setHours(beforeHours, 9), 0),
    end: setMinutes(setHours(beforeHours, 17), 0),
  }),
);

// Test 4: After business hours
const afterHours = parseISO('2025-01-20T18:30:00');
console.log(
  'After hours (6:30 PM):',
  isWithinInterval(afterHours, {
    start: setMinutes(setHours(afterHours, 9), 0),
    end: setMinutes(setHours(afterHours, 17), 0),
  }),
);

// Test 5: Calculate business hours in a single day
console.log('\n3. Calculate business hours in a single day:');
const workDay = parseISO('2025-01-20T12:00:00'); // Monday
const dayStart = setMinutes(setHours(workDay, 9), 0);
const dayEnd = setMinutes(setHours(workDay, 17), 0);
const businessMinutes = differenceInMinutes(dayEnd, dayStart);
console.log('Business hours in a day:', businessMinutes / 60, 'hours');

// Test 6: Calculate business hours between two timestamps
console.log('\n4. Business hours between timestamps:');
const start = parseISO('2025-01-20T14:30:00'); // Monday 2:30 PM
const end = parseISO('2025-01-22T11:30:00'); // Wednesday 11:30 AM

console.log('Start:', format(start, 'yyyy-MM-dd HH:mm (EEEE)'));
console.log('End:', format(end, 'yyyy-MM-dd HH:mm (EEEE)'));

// Calculate business hours
let totalBusinessMinutes = 0;
const days = eachDayOfInterval({ start, end });

days.forEach((day, index) => {
  if (!isWeekend(day)) {
    let dayBusinessStart = setMinutes(setHours(day, 9), 0);
    let dayBusinessEnd = setMinutes(setHours(day, 17), 0);

    // First day: use actual start time if within business hours
    if (index === 0 && isWithinInterval(start, { start: dayBusinessStart, end: dayBusinessEnd })) {
      dayBusinessStart = start;
    } else if (index === 0 && start.getTime() > dayBusinessEnd.getTime()) {
      // Started after business hours
      return;
    }

    // Last day: use actual end time if within business hours
    if (
      index === days.length - 1 &&
      isWithinInterval(end, { start: dayBusinessStart, end: dayBusinessEnd })
    ) {
      dayBusinessEnd = end;
    } else if (index === days.length - 1 && end.getTime() < dayBusinessStart.getTime()) {
      // Ended before business hours
      return;
    }

    const minutes = Math.max(0, differenceInMinutes(dayBusinessEnd, dayBusinessStart));
    totalBusinessMinutes += minutes;
    console.log(`Day ${index + 1} (${format(day, 'EEE')}):`, minutes / 60, 'hours');
  }
});

console.log('Total business hours:', totalBusinessMinutes / 60, 'hours');

// Test 7: Different business hours per day
console.log('\n5. Different business hours per day:');
const weekSchedule = {
  0: null, // Sunday - closed
  1: { start: { hour: 9, minute: 0 }, end: { hour: 17, minute: 0 } }, // Monday
  2: { start: { hour: 9, minute: 0 }, end: { hour: 17, minute: 0 } }, // Tuesday
  3: { start: { hour: 9, minute: 0 }, end: { hour: 17, minute: 0 } }, // Wednesday
  4: { start: { hour: 9, minute: 0 }, end: { hour: 17, minute: 0 } }, // Thursday
  5: { start: { hour: 9, minute: 0 }, end: { hour: 13, minute: 0 } }, // Friday - half day
  6: null, // Saturday - closed
};

const friday = parseISO('2025-01-24');
const fridayHours = weekSchedule[getDay(friday)];
if (fridayHours) {
  const fridayStart = setMinutes(
    setHours(friday, fridayHours.start.hour),
    fridayHours.start.minute,
  );
  const fridayEnd = setMinutes(setHours(friday, fridayHours.end.hour), fridayHours.end.minute);
  console.log('Friday hours:', format(fridayStart, 'HH:mm'), '-', format(fridayEnd, 'HH:mm'));
  console.log('Friday business hours:', differenceInMinutes(fridayEnd, fridayStart) / 60, 'hours');
}

// Test 8: Timezone-aware business hours
console.log('\n6. Timezone-aware business hours:');
const nycTime = '2025-01-20T10:00:00';
const nycDate = toDate(nycTime, { timeZone: 'America/New_York' });
const tokyoTime = formatInTimeZone(nycDate, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm zzz');
console.log('NYC time:', nycTime, '(business hours)');
console.log('Tokyo time:', tokyoTime);

// Check if NYC business hours
const nycBusinessStart = toDate('2025-01-20T09:00:00', { timeZone: 'America/New_York' });
const nycBusinessEnd = toDate('2025-01-20T17:00:00', { timeZone: 'America/New_York' });
console.log(
  'Is within NYC business hours:',
  nycDate >= nycBusinessStart && nycDate <= nycBusinessEnd,
);

// Test 9: Edge cases
console.log('\n7. Edge cases:');

// Exact business start
const exactStart = setMinutes(setHours(parseISO('2025-01-20'), 9), 0);
const exactStartCheck = isWithinInterval(exactStart, {
  start: setMinutes(setHours(exactStart, 9), 0),
  end: setMinutes(setHours(exactStart, 17), 0),
});
console.log('Exactly at 9:00 AM:', exactStartCheck);

// Exact business end
const exactEnd = setMinutes(setHours(parseISO('2025-01-20'), 17), 0);
const exactEndCheck = isWithinInterval(exactEnd, {
  start: setMinutes(setHours(exactEnd, 9), 0),
  end: setMinutes(setHours(exactEnd, 17), 0),
});
console.log('Exactly at 5:00 PM:', exactEndCheck);

// One minute before end
const beforeEnd = setMinutes(setHours(parseISO('2025-01-20'), 16), 59);
const beforeEndCheck = isWithinInterval(beforeEnd, {
  start: setMinutes(setHours(beforeEnd, 9), 0),
  end: setMinutes(setHours(beforeEnd, 17), 0),
});
console.log('At 4:59 PM:', beforeEndCheck);

// Test 10: Holiday handling
console.log('\n8. Holiday handling:');
const holidays = [
  parseISO('2025-01-20'), // Monday holiday
  parseISO('2025-01-21'), // Tuesday holiday
];

const checkDate = parseISO('2025-01-20T10:00:00');
const isHoliday = holidays.some((h) => isSameDay(checkDate, h));
console.log('Is 2025-01-20 a holiday?', isHoliday);
console.log('Business hours on holiday: 0 (typically)');

console.log('\n=== Verification Complete ===');
