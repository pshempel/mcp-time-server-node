#!/usr/bin/env node

/**
 * Research script for Phase 3 of calculateDuration refactoring
 * Current: 79 lines, complexity 14
 * Target: <50 lines, complexity ~10-12
 */

console.log('=== Phase 3: Calculate & Format Helpers Analysis ===\n');

console.log('Current Structure in main function:');
console.log('1. Calculate all duration units (lines 121-128)');
console.log('2. Format based on unit parameter (lines 131-140)');
console.log('3. Build result object (lines 142-150)\n');

console.log('Proposed Extraction:\n');

console.log('1. calculateDurationValues(startDate, endDate):');
console.log('   - Input: Two Date objects');
console.log('   - Output: Object with all calculated values');
console.log('   - Reduces complexity by ~2-3 (removes calculations)');
console.log('   - Removes ~8 lines from main\n');

console.log('2. formatDurationResult(values, unit):');
console.log('   - Input: Calculated values + unit string');
console.log('   - Output: Formatted string');
console.log('   - Reduces complexity by ~3-4 (removes ternary chain)');
console.log('   - Removes ~10 lines from main\n');

console.log('Expected Benefits:');
console.log('- Main function: ~60 lines (79 - 8 - 10 - 1)');
console.log('- Complexity: ~10 (14 - 2 - 2)');
console.log('- Better separation of concerns');
console.log('- Reusable calculation logic\n');

// Test the interface design
console.log('=== Testing Interface Design ===\n');

function calculateDurationValues(startDate, endDate) {
  const milliseconds = endDate - startDate;
  const seconds = milliseconds / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;
  const is_negative = milliseconds < 0;
  
  return {
    milliseconds,
    seconds,
    minutes,
    hours,
    days,
    is_negative
  };
}

function formatDurationResult(values, unit) {
  const { milliseconds, seconds, minutes, hours, days } = values;
  
  if (unit !== 'auto' && unit !== 'milliseconds') {
    const value = 
      unit === 'seconds' ? seconds :
      unit === 'minutes' ? minutes :
      unit === 'hours' ? hours : 
      days;
    return `${value} ${unit}`;
  }
  
  // For auto, we'd call existing formatDuration
  // For now, simplified version
  if (unit === 'milliseconds') {
    return `${milliseconds} milliseconds`;
  }
  
  // Auto formatting would use existing formatDuration function
  return `${Math.abs(days)} days (simplified)`;
}

// Test with sample data
const start = new Date('2025-01-01T00:00:00Z');
const end = new Date('2025-01-02T12:30:45Z');

const values = calculateDurationValues(start, end);
console.log('Calculated values:', values);

console.log('\nFormatted outputs:');
console.log('auto:', formatDurationResult(values, 'auto'));
console.log('seconds:', formatDurationResult(values, 'seconds'));
console.log('minutes:', formatDurationResult(values, 'minutes'));
console.log('hours:', formatDurationResult(values, 'hours'));
console.log('days:', formatDurationResult(values, 'days'));
console.log('milliseconds:', formatDurationResult(values, 'milliseconds'));

console.log('\n=== Complexity Breakdown ===');
console.log('calculateDurationValues: ~1 (just math, no branches)');
console.log('formatDurationResult: ~4 (one if, nested ternary)');
console.log('Main function after extraction: ~10');
console.log('  - Entry: 1');
console.log('  - String validation x2: 2');
console.log('  - Cache check: 1');
console.log('  - Timezone validation: 1');
console.log('  - Parse x2 with try/catch: 2');
console.log('  - Call helpers: 0');
console.log('  - Build result: 1');
console.log('  - Cache set: 1');
console.log('  - Total: ~9-10');

console.log('\n=== Implementation Notes ===');
console.log('1. calculateDurationValues should include debug logging');
console.log('2. formatDurationResult needs to handle negative values');
console.log('3. For auto format, call existing formatDuration helper');
console.log('4. Consider type for values object (DurationValues interface)');
console.log('5. Main function becomes mostly orchestration');