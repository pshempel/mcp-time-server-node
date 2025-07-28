const { eachDayOfInterval, isWeekend, format } = require('date-fns');

console.log('=== January 2025 Days ===\n');

const start = new Date(2025, 0, 1);
const end = new Date(2025, 0, 31);

const days = eachDayOfInterval({ start, end });

let weekdays = 0;
let weekends = 0;

for (const day of days) {
  const isWeekendDay = isWeekend(day);
  console.log(`${format(day, 'yyyy-MM-dd EEEE')}: ${isWeekendDay ? 'WEEKEND' : 'weekday'}`);

  if (isWeekendDay) {
    weekends++;
  } else {
    weekdays++;
  }
}

console.log(`\nTotal days: ${days.length}`);
console.log(`Weekdays: ${weekdays}`);
console.log(`Weekends: ${weekends}`);
