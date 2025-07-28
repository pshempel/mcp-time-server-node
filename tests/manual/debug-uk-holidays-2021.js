#!/usr/bin/env node
const { getHolidaysForYear } = require('../../dist/data/holidays');

console.log('=== Debug UK Holidays 2021 ===\n');

const holidays = getHolidaysForYear('UK', 2021);

console.log('All UK holidays in 2021:');
holidays.forEach((h) => {
  console.log(`- ${h.name}: ${h.date.toDateString()}`);
  if (h.observedDate && h.observedDate !== h.date) {
    console.log(`  Observed: ${h.observedDate.toDateString()}`);
  }
});

console.log('\nDecember holidays:');
const decHolidays = holidays.filter((h) => h.date.getMonth() === 11); // December is month 11
decHolidays.forEach((h) => {
  console.log(
    `- ${h.name}: ${h.date.toDateString()} (${h.date.toLocaleDateString('en-US', { weekday: 'long' })})`,
  );
  if (h.observedDate && h.observedDate !== h.date) {
    console.log(
      `  Observed: ${h.observedDate.toDateString()} (${h.observedDate.toLocaleDateString('en-US', { weekday: 'long' })})`,
    );
  }
});

console.log('\n=== Done ===');
