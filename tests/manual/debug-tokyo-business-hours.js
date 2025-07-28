#!/usr/bin/env node
const { calculateBusinessHours } = require('../../dist/tools/calculateBusinessHours');

console.log('=== Debug Tokyo Business Hours ===\n');

const params = {
  start_time: '2025-01-20T10:00:00',
  end_time: '2025-01-20T14:00:00',
  timezone: 'Asia/Tokyo',
};

try {
  const result = calculateBusinessHours(params);
  console.log('Result:', JSON.stringify(result, null, 2));
} catch (error) {
  console.error('Error:', error);
}

console.log('\n=== Done ===');
