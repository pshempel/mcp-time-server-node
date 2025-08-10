/**
 * Research: Natural Language Date Parsing Behavior
 *
 * Goal: Understand how to parse phrases like "next Tuesday", "in 3 days", "tomorrow at 3pm"
 * without adding new dependencies (using only date-fns if possible)
 */

const {
  addDays,
  setHours,
  setMinutes,
  nextMonday,
  nextTuesday,
  nextWednesday,
  nextThursday,
  nextFriday,
  nextSaturday,
  nextSunday,
  addWeeks,
  addMonths,
  parse,
  format,
} = require('date-fns');

console.log('=== Natural Language Date Parsing Research ===\n');

// Test current date
const now = new Date('2025-01-09T10:00:00');
console.log('Reference time:', format(now, "yyyy-MM-dd'T'HH:mm:ss"));
console.log('Day of week:', format(now, 'EEEE'), '\n');

// Research: "next [weekday]"
console.log('--- "next [weekday]" patterns ---');
console.log('next Monday:', format(nextMonday(now), 'yyyy-MM-dd (EEEE)'));
console.log('next Tuesday:', format(nextTuesday(now), 'yyyy-MM-dd (EEEE)'));
console.log('next Friday:', format(nextFriday(now), 'yyyy-MM-dd (EEEE)'));

// What if today is Thursday and we say "next Thursday"?
const thursday = new Date('2025-01-09T10:00:00'); // This is a Thursday
console.log('\nToday is Thursday:', format(thursday, 'EEEE'));
console.log('nextThursday() gives:', format(nextThursday(thursday), 'yyyy-MM-dd (EEEE)'));
console.log("Note: Returns NEXT week's Thursday, not today!");

// Research: "tomorrow", "yesterday"
console.log('\n--- Relative days ---');
console.log('tomorrow:', format(addDays(now, 1), 'yyyy-MM-dd (EEEE)'));
console.log('yesterday:', format(addDays(now, -1), 'yyyy-MM-dd (EEEE)'));
console.log('in 3 days:', format(addDays(now, 3), 'yyyy-MM-dd (EEEE)'));
console.log('3 days ago:', format(addDays(now, -3), 'yyyy-MM-dd (EEEE)'));

// Research: Time components
console.log('\n--- Time components ---');
const tomorrow = addDays(now, 1);
console.log('tomorrow at 3pm:', format(setHours(tomorrow, 15), "yyyy-MM-dd'T'HH:mm:ss"));
console.log(
  'tomorrow at 3:30pm:',
  format(setMinutes(setHours(tomorrow, 15), 30), "yyyy-MM-dd'T'HH:mm:ss")
);

// Research: "in X [unit]"
console.log('\n--- "in X [units]" patterns ---');
console.log('in 2 weeks:', format(addWeeks(now, 2), 'yyyy-MM-dd'));
console.log('in 3 months:', format(addMonths(now, 3), 'yyyy-MM-dd'));

// Research: Can we parse these with date-fns parse()?
console.log('\n--- date-fns parse() capabilities ---');
// parse() needs a format string, not natural language
try {
  const parsed = parse('next Tuesday', 'EEEE', now);
  console.log('parse("next Tuesday"):', parsed);
} catch (e) {
  console.log('parse("next Tuesday"): FAILED -', e.message);
}

// Research: Pattern matching approach
console.log('\n--- Pattern matching approach ---');

function parseNaturalDate(input, referenceDate = new Date()) {
  const normalized = input.toLowerCase().trim();

  // Pattern: "next [weekday]"
  const nextWeekdayMatch = normalized.match(
    /^next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/
  );
  if (nextWeekdayMatch) {
    const weekday = nextWeekdayMatch[1];
    const weekdayFunctions = {
      monday: nextMonday,
      tuesday: nextTuesday,
      wednesday: nextWednesday,
      thursday: nextThursday,
      friday: nextFriday,
      saturday: nextSaturday,
      sunday: nextSunday,
    };
    return weekdayFunctions[weekday](referenceDate);
  }

  // Pattern: "tomorrow"
  if (normalized === 'tomorrow') {
    return addDays(referenceDate, 1);
  }

  // Pattern: "in X days"
  const inDaysMatch = normalized.match(/^in\s+(\d+)\s+days?$/);
  if (inDaysMatch) {
    return addDays(referenceDate, parseInt(inDaysMatch[1]));
  }

  // Pattern: "tomorrow at HH:mm(am/pm)"
  const tomorrowAtMatch = normalized.match(/^tomorrow\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (tomorrowAtMatch) {
    let hour = parseInt(tomorrowAtMatch[1]);
    const minute = parseInt(tomorrowAtMatch[2] || '0');
    const meridiem = tomorrowAtMatch[3];

    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;

    const tomorrow = addDays(referenceDate, 1);
    return setMinutes(setHours(tomorrow, hour), minute);
  }

  return null;
}

// Test our pattern matching
console.log('\nTesting pattern matching:');
console.log(
  'Input: "next Tuesday" =>',
  format(parseNaturalDate('next Tuesday', now), 'yyyy-MM-dd')
);
console.log('Input: "tomorrow" =>', format(parseNaturalDate('tomorrow', now), 'yyyy-MM-dd'));
console.log('Input: "in 3 days" =>', format(parseNaturalDate('in 3 days', now), 'yyyy-MM-dd'));
console.log(
  'Input: "tomorrow at 3pm" =>',
  format(parseNaturalDate('tomorrow at 3pm', now), "yyyy-MM-dd'T'HH:mm:ss")
);
console.log(
  'Input: "tomorrow at 3:30pm" =>',
  format(parseNaturalDate('tomorrow at 3:30pm', now), "yyyy-MM-dd'T'HH:mm:ss")
);

console.log('\n=== Key Findings ===');
console.log('1. date-fns has next[Weekday]() functions for each day');
console.log('2. date-fns parse() needs format strings, not natural language');
console.log('3. Pattern matching with regex works well for common phrases');
console.log("4. nextThursday() on a Thursday returns NEXT week's Thursday");
console.log('5. Need to handle timezone context for natural language dates');
