#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== Analyzing addTime.ts Helper Functions ===\n');

// Read the file
const filePath = path.join(__dirname, '..', 'src', 'tools', 'addTime.ts');
const content = fs.readFileSync(filePath, 'utf8');

// Extract parseDateWithTimezone function
const parseStart = content.indexOf('export function parseDateWithTimezone(');
const parseEnd = content.indexOf(
  '\n}',
  content.indexOf("debug.tools('parseDateWithTimezone result:")
);
const parseFunc = content.substring(parseStart, parseEnd + 2);

// Extract formatAddTimeResult function
const formatStart = content.indexOf('export function formatAddTimeResult(');
const formatEnd = content.lastIndexOf('\n}') + 2;
const formatFunc = content.substring(formatStart, formatEnd);

console.log('1. parseDateWithTimezone Analysis:');
console.log('   Lines:', parseFunc.split('\n').length);
console.log('   Current: 65 lines (limit 50), complexity 11 (limit 10)');
console.log('\n   Complexity sources:');
console.log('   - Multiple input format branches (Unix, Z suffix, explicit offset, local)');
console.log('   - Nested try-catch with multiple conditionals');
console.log('   - Each branch has different parsing logic');
console.log('\n   Potential extractions:');
console.log('   - parseUnixTimestamp() - handle Unix timestamp parsing');
console.log('   - parseISOWithTimezone() - handle ISO strings with Z or offset');
console.log('   - determineDisplayTimezone() - logic for timezone resolution');
console.log('   - Each would reduce complexity by ~2-3 points');

console.log('\n2. formatAddTimeResult Analysis:');
console.log('   Lines:', formatFunc.split('\n').length);
console.log('   Current: 58 lines (limit 50)');
console.log('\n   Complexity sources:');
console.log('   - Multiple format branches based on input type');
console.log('   - Complex explicit offset handling with regex parsing');
console.log('   - Different logic for Unix, Z suffix, explicit offset, local time');
console.log('\n   Potential extractions:');
console.log('   - formatUnixTimestamp() - handle Unix timestamp formatting');
console.log('   - formatWithExplicitOffset() - complex offset preservation logic');
console.log('   - formatWithTimezone() - standard timezone formatting');
console.log('   - Each extraction would reduce lines by ~10-15');

console.log('\n3. Recommended Approach:');
console.log('   Phase 1a: Extract from parseDateWithTimezone:');
console.log('   - parseUnixTimestamp(time: string): Date | null');
console.log(
  '   - parseISOWithTimezoneInfo(time: string): { date: Date, hasZ: boolean, offset: string }'
);
console.log('   - This should bring complexity from 11 to ~7-8');
console.log('\n   Phase 1b: Extract from formatAddTimeResult:');
console.log('   - formatUnixTimestampResult(inputDate, resultDate, timezone?)');
console.log('   - formatWithExplicitOffset(inputDate, resultDate, offset)');
console.log('   - This should bring lines from 58 to ~40');

console.log('\n4. Benefits:');
console.log('   - Each helper can be unit tested independently');
console.log('   - Logic becomes more modular and reusable');
console.log('   - Main functions become clearer dispatchers');
console.log('   - Easier to add new format support later');
