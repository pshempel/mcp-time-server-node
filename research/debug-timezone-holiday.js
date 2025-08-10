const { parseISO, eachDayOfInterval } = require('date-fns');

console.log('=== Timezone Holiday Test Debug ===\n');

// Test dates
const start = parseISO('2025-01-01T00:00:00');
const end = parseISO('2025-01-02T00:00:00');

console.log('Start date:', start.toString());
console.log('End date:', end.toString());

const days = eachDayOfInterval({ start, end });
console.log('\nDays in interval:');
days.forEach((day) => {
  console.log('-', day.toString());
});

console.log(`\nTotal days: ${days.length}`);
console.log('\nNote: eachDayOfInterval is inclusive of start and end dates');
