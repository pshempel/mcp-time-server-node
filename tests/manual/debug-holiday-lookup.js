const { getHolidaysForYear } = require('../../dist/data/holidays');

console.log('=== Debug Holiday Lookup ===\n');

const holidays2025 = getHolidaysForYear('US', 2025);
console.log('US Holidays for 2025:');
holidays2025.forEach((h) => {
  console.log(`- ${h.name}: ${h.date.toDateString()}`);
  if (h.observedDate) {
    console.log(`  (observed: ${h.observedDate.toDateString()})`);
  }
});

console.log('\nJanuary 1, 2025 comparison:');
const jan1 = new Date(2025, 0, 1);
const newYears = holidays2025.find((h) => h.name === "New Year's Day");
if (newYears) {
  console.log('New Years date:', newYears.date.toDateString());
  console.log('Jan 1 date:', jan1.toDateString());
  console.log('Dates match:', newYears.date.toDateString() === jan1.toDateString());
}
