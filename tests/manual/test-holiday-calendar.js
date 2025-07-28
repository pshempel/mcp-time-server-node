const { getBusinessDays } = require('../../dist/tools/getBusinessDays');

console.log('=== Manual Test: Holiday Calendar ===\n');

const params = {
  start_date: '2025-01-01',
  end_date: '2025-01-01',
  timezone: 'America/Los_Angeles',
  holiday_calendar: 'US',
};

console.log('Parameters:', JSON.stringify(params, null, 2));

try {
  const result = getBusinessDays(params);
  console.log('\nResult:', JSON.stringify(result, null, 2));
} catch (error) {
  console.error('Error:', error);
}
