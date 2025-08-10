#!/usr/bin/env node

/**
 * Research script to analyze formatTime complexity
 * Goal: Identify extraction points to reduce cyclomatic complexity from 22 to ≤10
 */

const fs = require('fs');
const path = require('path');

// Read the formatTime.ts file
const filePath = path.join(__dirname, '..', 'src', 'tools', 'formatTime.ts');
const content = fs.readFileSync(filePath, 'utf8');

console.log('=== formatTime.ts Complexity Analysis ===\n');

// 1. Analyze isValidFormatString function
const isValidFormatStringLines = content.match(/function isValidFormatString[\s\S]*?^}/m);
if (isValidFormatStringLines) {
  const tokenArrayLines = isValidFormatStringLines[0].match(/const validTokens = \[[\s\S]*?\];/);
  if (tokenArrayLines) {
    const tokenCount = tokenArrayLines[0].match(/'/g).length / 2;
    console.log(`1. isValidFormatString complexity contributors:`);
    console.log(`   - Contains ${tokenCount} format tokens in array`);
    console.log(`   - Has 2 conditional checks (dangerous chars, token pattern)`);
    console.log(`   - Complexity: ~4 (can be extracted as data)\n`);
  }
}

// 2. Analyze main formatTime function
console.log('2. formatTime function complexity contributors:');

// Count conditionals
const ifStatements = (content.match(/\bif\s*\(/g) || []).length;
const switchCases = (content.match(/\bcase\s+'/g) || []).length;
const ternaryOps = (content.match(/\?[^:]*:/g) || []).length;
const tryCatchBlocks = (content.match(/\btry\s*{/g) || []).length;

console.log(`   - If statements: ${ifStatements}`);
console.log(`   - Switch cases: ${switchCases}`);
console.log(`   - Ternary operators: ${ternaryOps}`);
console.log(`   - Try-catch blocks: ${tryCatchBlocks}`);
console.log(
  `   - Total decision points: ~${ifStatements + switchCases + ternaryOps + tryCatchBlocks}\n`
);

// 3. Identify major blocks that can be extracted
console.log('3. Major blocks for extraction:');
console.log('   a. Token validation array (203 lines) -> Move to constants');
console.log('   b. Format validation logic -> Extract to validateFormatString()');
console.log('   c. Parameter validation -> Extract to validateFormatParams()');
console.log(
  '   d. Relative/calendar formatting (lines 313-346) -> Extract to formatRelativeTime()'
);
console.log('   e. Custom format handling (lines 349-371) -> Extract to formatCustomTime()');
console.log(
  '   f. Date parsing with fallback (lines 287-307) -> Extract to parseTimeWithFallback()\n'
);

// 4. Debug statement analysis
const debugCalls = content.match(/debug\.\w+\([^)]+\)/g) || [];
console.log('4. Current debug statements:');
debugCalls.forEach((call) => {
  const namespace = call.match(/debug\.(\w+)/)[1];
  const line = content.split('\n').findIndex((l) => l.includes(call)) + 1;
  console.log(`   Line ${line}: ${namespace} namespace`);
});

console.log('\n5. Refactoring Strategy:');
console.log('   Step 1: Extract FORMAT_TOKENS constant');
console.log('   Step 2: Extract validateFormatParams() for parameter validation');
console.log('   Step 3: Extract parseTimeWithFallback() for date parsing');
console.log('   Step 4: Extract formatRelativeTime() for relative/calendar');
console.log('   Step 5: Extract formatCustomTime() for custom formats');
console.log('   Step 6: Ensure each extracted function has appropriate debug statements\n');

console.log('6. Expected complexity after refactoring:');
console.log('   - Main function: ~8-10 (just orchestration + switch)');
console.log('   - Each extracted function: 3-5');
console.log('   - Total improvement: 22 -> 10\n');

console.log('7. Debug namespace mapping:');
console.log('   - validateFormatParams: validation namespace');
console.log('   - parseTimeWithFallback: parse namespace');
console.log('   - formatRelativeTime: timing namespace');
console.log('   - formatCustomTime: timing namespace');
console.log('   - Main orchestration: timing namespace\n');

// Check for existing patterns we can reuse
console.log('8. DRY check - existing patterns to reuse:');
const utilsPath = path.join(__dirname, '..', 'src', 'utils');
const utilFiles = fs.readdirSync(utilsPath);
console.log('   Available utils:', utilFiles.filter((f) => f.endsWith('.ts')).join(', '));
console.log('   - validation.ts: Already using for error creation');
console.log('   - parseTimeInput.ts: Already using for date parsing');
console.log('   - withCache.ts: Already using for caching');
console.log('   - debug.ts: Using for debug statements\n');

console.log('✅ Research complete - ready to proceed with TDD refactoring');
