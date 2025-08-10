// Debug why isHoliday is failing
const { getHolidaysForYear, isHoliday } = require('../dist/data/holidays');

console.log('=== Canada Day 2025 Debug ===');
const caHolidays2025 = getHolidaysForYear('CA', 2025);
console.log(`Total CA holidays: ${caHolidays2025.length}`);

const canadaDay = caHolidays2025.find((h) => h.name === 'Canada Day');
console.log('Canada Day:', canadaDay);

const july1 = new Date('2025-07-01');
console.log('July 1 date:', july1);
console.log('July 1 toDateString:', july1.toDateString());

if (canadaDay) {
  console.log('Canada Day date:', canadaDay.date);
  console.log('Canada Day toDateString:', canadaDay.date.toDateString());
  console.log('Dates match?', canadaDay.date.toDateString() === july1.toDateString());
}

console.log('isHoliday result:', isHoliday(july1, 'CA'));

console.log('\n=== Australia Day 2025 Debug ===');
const auHolidays2025 = getHolidaysForYear('AU', 2025);
console.log(`Total AU holidays: ${auHolidays2025.length}`);

const australiaDay = auHolidays2025.find((h) => h.name === 'Australia Day');
console.log('Australia Day:', australiaDay);

const jan26 = new Date('2025-01-26');
console.log('Jan 26 date:', jan26);
console.log('Jan 26 toDateString:', jan26.toDateString());

if (australiaDay) {
  console.log('Australia Day date:', australiaDay.date);
  console.log('Australia Day toDateString:', australiaDay.date.toDateString());
  console.log('Dates match?', australiaDay.date.toDateString() === jan26.toDateString());
}

console.log('isHoliday result:', isHoliday(jan26, 'AU'));
