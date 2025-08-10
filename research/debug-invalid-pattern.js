// Debug invalid pattern issue
const { nextOccurrenceNew } = require('../dist/tools/nextOccurrenceNew.js');

console.log('Testing invalid pattern...');
try {
  const result = nextOccurrenceNew({
    pattern: 'invalid',
    start_from: '2025-01-29T10:00:00Z',
  });
  console.log('Result:', result);
  console.log('ERROR: Should have thrown!');
} catch (e) {
  console.log('Correctly threw error:', e.message);
  console.log('Error code:', e.error?.code);
}
