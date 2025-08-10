const { differenceInDays, startOfDay } = require('date-fns');
const { toZonedTime } = require('date-fns-tz');

// Test the days calculation logic
const now = new Date('2025-01-15T10:30:00.000Z');
const nextDate = new Date('2025-01-20T00:00:00.000Z');

console.log('=== Analyzing Days Calculation ===');
console.log('Now:', now.toISOString());
console.log('Next:', nextDate.toISOString());

// UTC calculation (what the new implementation does)
console.log('\n--- UTC Calculation (new implementation) ---');
const nowZoned = now; // No conversion for UTC
const nextZoned = nextDate; // No conversion for UTC
const daysUntil = differenceInDays(startOfDay(nextZoned), startOfDay(nowZoned));
console.log('Now zoned:', nowZoned.toISOString());
console.log('Next zoned:', nextZoned.toISOString());
console.log('Start of day (now):', startOfDay(nowZoned).toISOString());
console.log('Start of day (next):', startOfDay(nextZoned).toISOString());
console.log('Days until:', daysUntil);

// What the old implementation might have done
console.log('\n--- Alternative calculation ---');
const daysUntil2 = differenceInDays(nextDate, now);
console.log('Simple difference:', daysUntil2);

// Using Math.floor on hours
const hoursDiff = (nextDate.getTime() - now.getTime()) / (1000 * 60 * 60);
const daysByHours = Math.floor(hoursDiff / 24);
console.log('Hours difference:', hoursDiff);
console.log('Days by hours (floor):', daysByHours);

// Using Math.ceil
const daysByCeil = Math.ceil(hoursDiff / 24);
console.log('Days by hours (ceil):', daysByCeil);

// Check what startOfDay does
console.log('\n--- StartOfDay behavior ---');
console.log(
  'startOfDay for 2025-01-15T10:30:00Z:',
  startOfDay(new Date('2025-01-15T10:30:00Z')).toISOString()
);
console.log(
  'startOfDay for 2025-01-20T00:00:00Z:',
  startOfDay(new Date('2025-01-20T00:00:00Z')).toISOString()
);
