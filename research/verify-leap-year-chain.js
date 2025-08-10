const { addYears, format } = require('date-fns');

console.log('=== Chained yearly addition from Feb 29 ===\n');

let date = new Date(2024, 1, 29); // Feb 29, 2024
console.log('Start:', format(date, 'yyyy-MM-dd'));

for (let i = 1; i <= 4; i++) {
  date = addYears(date, 1);
  const year = date.getFullYear();
  const isLeap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  console.log(`Year ${i}:`, format(date, 'yyyy-MM-dd'), `(${year} leap: ${isLeap})`);
}

console.log('\n=== Direct 4-year jump ===');
const start = new Date(2024, 1, 29);
const fourYearsLater = addYears(start, 4);
console.log('2024-02-29 + 4 years =', format(fourYearsLater, 'yyyy-MM-dd'));

console.log('\n=== What users might expect ===');
console.log('Some users might expect Feb 29 to "remember" and restore on next leap year');
console.log('But date-fns follows the principle of least surprise');
console.log('Feb 29 -> Feb 28 is permanent when chaining addYears');
