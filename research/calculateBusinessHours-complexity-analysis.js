#!/usr/bin/env node

/**
 * Research script to analyze calculateBusinessHours complexity
 * Goal: Identify extraction points to reduce cyclomatic complexity from 17 to ≤15
 * and lines from 136 to ≤110
 */

const fs = require('fs');
const path = require('path');

// Read the calculateBusinessHours.ts file
const filePath = path.join(__dirname, '..', 'src', 'tools', 'calculateBusinessHours.ts');
const content = fs.readFileSync(filePath, 'utf8');

console.log('=== calculateBusinessHours.ts Complexity Analysis ===\n');

// Find the main function
const mainFunctionMatch = content.match(/export function calculateBusinessHours[\s\S]*?^  \);/m);
if (!mainFunctionMatch) {
  console.error('Could not find main function');
  process.exit(1);
}

const mainFunction = mainFunctionMatch[0];

// Find the withCache arrow function
const arrowFunctionMatch = mainFunction.match(/\(\) => \{[\s\S]*?^\s{4}\}/m);
if (!arrowFunctionMatch) {
  console.error('Could not find arrow function');
  process.exit(1);
}

const arrowFunction = arrowFunctionMatch[0];
const arrowFunctionLines = arrowFunction.split('\n');

console.log('1. Function Metrics:');
console.log(`   - Total lines in file: ${content.split('\n').length}`);
console.log(`   - Main function lines: ${mainFunction.split('\n').length}`);
console.log(`   - Arrow function lines: ${arrowFunctionLines.length} (limit: 110)`);

// Count complexity contributors in arrow function
const ifStatements = (arrowFunction.match(/\bif\s*\(/g) || []).length;
const elseStatements = (arrowFunction.match(/\belse\s/g) || []).length;
const ternaryOps = (arrowFunction.match(/\?[^:]*:/g) || []).length;
const forLoops = (arrowFunction.match(/\bfor\s*\(/g) || []).length;
const whileLoops = (arrowFunction.match(/\bwhile\s*\(/g) || []).length;
const logicalAnd = (arrowFunction.match(/&&/g) || []).length;
const logicalOr = (arrowFunction.match(/\|\|/g) || []).length;

console.log('\n2. Complexity Contributors (Arrow Function):');
console.log(`   - If statements: ${ifStatements}`);
console.log(`   - Else branches: ${elseStatements}`);
console.log(`   - Ternary operators: ${ternaryOps}`);
console.log(`   - For loops: ${forLoops}`);
console.log(`   - While loops: ${whileLoops}`);
console.log(`   - Logical AND (&&): ${logicalAnd}`);
console.log(`   - Logical OR (||): ${logicalOr}`);
console.log(
  `   - Estimated complexity: ${ifStatements + elseStatements + forLoops + whileLoops + 1}`
);

// Identify major blocks for extraction
console.log('\n3. Major Blocks in Arrow Function:');

// Find the main loop
const loopMatch = arrowFunction.match(/while \(currentDate <= endDate\) \{[\s\S]*?^\s{4}\}/m);
if (loopMatch) {
  const loopLines = loopMatch[0].split('\n').length;
  console.log(`   - Main while loop: ${loopLines} lines (starts around line 105)`);

  // Analyze loop body complexity
  const loopContent = loopMatch[0];
  const loopIfs = (loopContent.match(/\bif\s*\(/g) || []).length;
  console.log(`     - Contains ${loopIfs} if statements`);
}

// Find business hours processing
const businessHoursProcessing = arrowFunction.includes('calculateDayBusinessMinutes');
if (businessHoursProcessing) {
  console.log('   - Business hours calculation: Uses helper function (good!)');
}

// Look for validation logic
const validationCalls = arrowFunction.match(/validate\w+/g) || [];
console.log(`   - Validation calls: ${validationCalls.length} (already extracted)`);

console.log('\n4. Extraction Opportunities:');
console.log('   a. Date range setup (lines ~70-90) -> extractDateRange()');
console.log('   b. Day processing logic (lines ~135-165) -> processSingleDay()');
console.log('   c. Result aggregation (lines ~180-210) -> aggregateResults()');
console.log('   d. Weekend/holiday checks -> Already in helpers (good!)');

console.log('\n5. Current Good Practices:');
console.log('   - Uses helper functions from businessHoursHelpers');
console.log('   - Uses businessUtils for date parsing');
console.log('   - Validation is already extracted');

console.log('\n6. Refactoring Strategy:');
console.log('   Step 1: Extract processSingleDay() for the day loop body');
console.log('   Step 2: Extract setupDateRange() for initial date setup');
console.log('   Step 3: Extract aggregateBusinessResults() for final calculations');
console.log('   Step 4: Keep main function as orchestrator');

console.log('\n7. Expected Results After Refactoring:');
console.log('   - Main arrow function: ~60-70 lines (from 118)');
console.log('   - Complexity: ~10-12 (from 17)');
console.log('   - Each extracted function: 20-30 lines, complexity 3-5');

console.log('\n8. Debug Namespace Preservation:');
const debugCalls = arrowFunction.match(/debug\.\w+/g) || [];
const uniqueNamespaces = [...new Set(debugCalls.map((call) => call.split('.')[1]))];
console.log(`   - Current namespaces used: ${uniqueNamespaces.join(', ')}`);
console.log('   - Must preserve in extracted functions');

console.log('\n✅ Analysis complete - This requires a proper refactor in a separate session');
