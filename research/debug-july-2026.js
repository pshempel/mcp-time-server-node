const { format, getDay } = require('date-fns');

console.log('=== July 2026 Holiday Observation ===\n');

const july4_2026 = new Date(2026, 6, 4);
console.log(`July 4, 2026: ${format(july4_2026, 'EEEE')} (day ${getDay(july4_2026)})`);

const july3_2026 = new Date(2026, 6, 3);
console.log(`July 3, 2026: ${format(july3_2026, 'EEEE')} (day ${getDay(july3_2026)})`);

console.log('\nFor US Federal holidays:');
console.log('- Saturday holidays are observed on Friday');
console.log('- So July 4 (Saturday) should be observed on July 3 (Friday)');
