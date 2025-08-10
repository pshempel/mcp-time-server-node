// Fix WeeklyRecurrence test
const fs = require('fs');

const testFile = 'tests/tools/recurrence/WeeklyRecurrence.test.ts';
let content = fs.readFileSync(testFile, 'utf8');

// Add pattern: 'weekly' to all params
content = content.replace(
  /const params: WeeklyParams = \{/g,
  "const params: WeeklyParams = {\n        pattern: 'weekly',"
);

// Fix time format - all variations
const timeReplacements = [
  { from: 'time: { hours: 14, minutes: 30 }', to: "time: '14:30'" },
  { from: 'time: { hours: 10, minutes: 0 }', to: "time: '10:00'" },
  { from: 'time: { hours: 20, minutes: 0 }', to: "time: '20:00'" },
  { from: 'time: { hours: 10, minutes: 30 }', to: "time: '10:30'" },
  { from: 'time: { hours: 0, minutes: 0 }', to: "time: '00:00'" },
];

timeReplacements.forEach(({ from, to }) => {
  content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
});

fs.writeFileSync(testFile, content);
console.log('Fixed WeeklyRecurrence test');
