// Fix DailyRecurrence test
const fs = require('fs');

const testFile = 'tests/tools/recurrence/DailyRecurrence.test.ts';
let content = fs.readFileSync(testFile, 'utf8');

// Fix import
content = content.replace(
  "import type { RecurrenceParams } from '../../../src/types/recurrence';",
  "import type { DailyParams } from '../../../src/types/recurrence';"
);

// Fix all RecurrenceParams to DailyParams
content = content.replace(/RecurrenceParams/g, 'DailyParams');

// Add pattern: 'daily' to all params that don't have time
content = content.replace(
  /const params: DailyParams = { timezone: 'UTC' };/g,
  "const params: DailyParams = { pattern: 'daily', timezone: 'UTC' };"
);

// Fix time format - all variations
const timeReplacements = [
  { from: 'time: { hours: 14, minutes: 30 }', to: "time: '14:30'" },
  { from: 'time: { hours: 9, minutes: 0 }', to: "time: '09:00'" },
  { from: 'time: { hours: 14, minutes: 0 }', to: "time: '14:00'" },
  { from: 'time: { hours: 10, minutes: 30 }', to: "time: '10:30'" },
];

timeReplacements.forEach(({ from, to }) => {
  content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
});

// Add pattern: 'daily' to all params objects
content = content.replace(
  /const params: DailyParams = \{\n        timezone: /g,
  "const params: DailyParams = {\n        pattern: 'daily',\n        timezone: "
);

fs.writeFileSync(testFile, content);
console.log('Fixed DailyRecurrence test');
