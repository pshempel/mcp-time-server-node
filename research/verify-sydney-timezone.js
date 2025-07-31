const { formatInTimeZone, toZonedTime, fromZonedTime } = require('date-fns-tz');

console.log('=== Sydney Timezone Test ===\n');

// The test expects Feb 29 midnight Sydney = Feb 28 13:00 UTC
const sydneyTime = new Date(2024, 1, 29, 0, 0, 0); // Feb 29 midnight local
console.log('Local Feb 29 midnight:', sydneyTime.toISOString());

// What is Feb 29 midnight Sydney in UTC?
const feb29Sydney = fromZonedTime(new Date(2024, 1, 29, 0, 0, 0), 'Australia/Sydney');
console.log('Feb 29 midnight Sydney in UTC:', feb29Sydney.toISOString());

// Starting from Jan 30 13:00 UTC (which is Jan 31 midnight Sydney)
const startTime = new Date('2024-01-30T13:00:00Z');
console.log('\nStart time UTC:', startTime.toISOString());
console.log(
  'Start time Sydney:',
  formatInTimeZone(startTime, 'Australia/Sydney', 'yyyy-MM-dd HH:mm zzz'),
);

// What should the next occurrence be?
console.log('\nSydney is UTC+11 in Feb (AEDT - Daylight Saving)');
console.log('So Feb 29 00:00 Sydney = Feb 28 13:00 UTC');

// Let's verify
const targetSydney = new Date(2024, 1, 29); // Feb 29 in local time
const targetUTC = fromZonedTime(targetSydney, 'Australia/Sydney');
console.log(
  '\nTarget in Sydney:',
  formatInTimeZone(targetUTC, 'Australia/Sydney', 'yyyy-MM-dd HH:mm'),
);
console.log('Target in UTC:', targetUTC.toISOString());
