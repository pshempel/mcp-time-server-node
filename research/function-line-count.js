#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/tools/calculateBusinessHours.ts');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Find main function
let mainFuncStart = -1;
let mainFuncEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export function calculateBusinessHours(')) {
    mainFuncStart = i + 1; // Line numbers are 1-based
  }
  if (mainFuncStart > 0 && i === lines.length - 1) {
    mainFuncEnd = i + 1;
  }
}

console.log('Main calculateBusinessHours function:');
console.log(`  Start: line ${mainFuncStart}`);
console.log(`  End: line ${mainFuncEnd}`);
console.log(`  Total lines: ${mainFuncEnd - mainFuncStart + 1}`);

// Find extracted functions
const functions = ['generateDateRange', 'processSingleBusinessDay', 'buildBusinessHoursResult'];

console.log('\nExtracted functions:');
functions.forEach((funcName) => {
  let start = -1;
  let end = -1;
  let braceCount = 0;
  let inFunction = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`export function ${funcName}(`)) {
      start = i + 1;
      inFunction = true;
      braceCount = 0;
    }

    if (inFunction) {
      // Count braces to find end
      for (let char of lines[i]) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }

      if (braceCount === 0 && lines[i].includes('}')) {
        end = i + 1;
        inFunction = false;
        break;
      }
    }
  }

  if (start > 0 && end > 0) {
    console.log(`  ${funcName}: lines ${start}-${end} (${end - start + 1} lines)`);
  }
});

// Calculate withCache arrow function
let arrowStart = -1;
let arrowEnd = -1;
let inArrow = false;

for (let i = 0; i < lines.length; i++) {
  if (
    lines[i].includes('() => {') &&
    lines[i - 1] &&
    lines[i - 1].includes('CacheTTL.CALCULATIONS')
  ) {
    arrowStart = i + 1;
    inArrow = true;
  }

  if (inArrow && lines[i].trim() === '}' && lines[i + 1] && lines[i + 1].trim() === ');') {
    arrowEnd = i + 1;
    break;
  }
}

console.log('\nwithCache arrow function:');
console.log(`  Lines: ${arrowStart}-${arrowEnd} (${arrowEnd - arrowStart + 1} lines)`);
