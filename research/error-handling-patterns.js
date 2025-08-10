#!/usr/bin/env node
/**
 * Research: Document current error handling patterns and what needs fixing
 * Session 112 - Issue #1
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== Error Handling Pattern Research ===\n');

// Find all throw statements in src/tools
console.log('1. Searching for throw patterns in src/tools/...\n');

const throwPatterns = execSync(
  "grep -r 'throw' src/tools/ --include='*.ts' | head -20",
  { encoding: 'utf8' }
);

console.log('Current throw patterns found:');
console.log(throwPatterns);

// Check for debug.error usage
console.log('\n2. Checking for debug.error usage before throws...\n');

const debugErrorPatterns = execSync(
  "grep -B3 'throw' src/tools/ --include='*.ts' | grep 'debug.error' | wc -l",
  { encoding: 'utf8' }
);

console.log(`Found ${debugErrorPatterns.trim()} instances of debug.error before throw`);

// Find specific problem patterns
console.log('\n3. Problem Pattern: throw { error: createError(...) }\n');

const wrappedErrors = execSync(
  "grep -r 'throw {' src/tools/ --include='*.ts' | wc -l",
  { encoding: 'utf8' }
);

console.log(`Found ${wrappedErrors.trim()} instances of wrapped error throws`);

// Find throws without debug.error
console.log('\n4. Files with throws but no debug.error before them:\n');

const files = [
  'src/tools/recurrence/RecurrenceFactory.ts',
  'src/tools/addTime.ts',
  'src/tools/nextOccurrence.ts',
  'src/tools/formatTime.ts',
  'src/tools/convertTimezone.ts'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      if (line.includes('throw')) {
        // Check previous 3 lines for debug.error
        let hasDebugError = false;
        for (let i = Math.max(0, index - 3); i < index; i++) {
          if (lines[i].includes('debug.error')) {
            hasDebugError = true;
            break;
          }
        }
        
        if (!hasDebugError) {
          console.log(`${file}:${index + 1} - Missing debug.error before throw`);
        }
      }
    });
  }
});

console.log('\n5. Pattern Summary:\n');
console.log('WRONG (current): throw { error: createError(...) }');
console.log('RIGHT (needed):  debug.error("details"); throw new Error("msg")');

console.log('\n6. MCP SDK Error Codes (from @modelcontextprotocol/sdk):\n');
console.log('- ErrorCode.InvalidParams = -32602');
console.log('- ErrorCode.InternalError = -32603');
console.log('- Use err["code"] = ErrorCode.InvalidParams to set code');
console.log('- Use err["data"] = {...} for additional context');

console.log('\n=== Research Complete ===');