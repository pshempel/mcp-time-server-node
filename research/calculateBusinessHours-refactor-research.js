#!/usr/bin/env node

/**
 * Research script to understand calculateBusinessHours structure
 * and verify refactoring boundaries
 *
 * Created: 2025-08-08
 * Purpose: Identify logical extraction points for refactoring
 */

const fs = require('fs');
const path = require('path');

// Read the function to analyze
const filePath = path.join(__dirname, '../src/tools/calculateBusinessHours.ts');
const content = fs.readFileSync(filePath, 'utf8');

console.log('=== calculateBusinessHours Structure Analysis ===\n');

// Identify main sections
const sections = [
  {
    name: 'Parameter Validation',
    startLine: 48,
    endLine: 56,
    purpose: 'Validate input parameters for length and format',
  },
  {
    name: 'Cache Setup',
    startLine: 58,
    endLine: 62,
    purpose: 'Generate cache key for results',
  },
  {
    name: 'Timezone & Business Hours Validation',
    startLine: 70,
    endLine: 80,
    purpose: 'Validate timezone and business hours structure',
  },
  {
    name: 'Date Range Setup',
    startLine: 83,
    endLine: 96,
    purpose: 'Parse start/end dates and validate range',
  },
  {
    name: 'Holiday Processing',
    startLine: 105,
    endLine: 109,
    purpose: 'Parse and prepare holiday dates',
  },
  {
    name: 'Business Hours Helper',
    startLine: 111,
    endLine: 123,
    purpose: 'Get business hours for specific day of week',
  },
  {
    name: 'Date List Generation',
    startLine: 125,
    endLine: 133,
    purpose: 'Generate list of dates to process',
  },
  {
    name: 'Day Processing Loop',
    startLine: 139,
    endLine: 214,
    purpose: 'Calculate business hours for each day',
  },
  {
    name: 'Result Aggregation',
    startLine: 218,
    endLine: 231,
    purpose: 'Build final result with totals and breakdown',
  },
];

console.log('Main Sections:');
sections.forEach((section) => {
  const lines = section.endLine - section.startLine + 1;
  console.log(`\n${section.name}:`);
  console.log(`  Lines: ${section.startLine}-${section.endLine} (${lines} lines)`);
  console.log(`  Purpose: ${section.purpose}`);
});

// Analyze the day processing loop complexity
console.log('\n=== Day Processing Loop Analysis ===\n');

const dayProcessingSteps = [
  { lines: '140-145', task: 'Get day info (date, dayOfWeek, dayName, isWeekend)' },
  { lines: '147-154', task: 'Check if work day (holidays, weekends)' },
  { lines: '156-157', task: 'Get business hours for this day' },
  { lines: '159-168', task: 'Log exclusion reason if not working' },
  { lines: '170-200', task: 'Calculate minutes if working day' },
  { lines: '172-178', task: '  - Create business start/end times' },
  { lines: '180-187', task: '  - Calculate actual business minutes' },
  { lines: '189-199', task: '  - Log partial day info' },
  { lines: '202-203', task: 'Check if holiday for result' },
  { lines: '205-212', task: 'Build day result object' },
  { lines: '214-215', task: 'Add to breakdown and total' },
];

console.log('Day Processing Steps:');
dayProcessingSteps.forEach((step) => {
  console.log(`  ${step.lines}: ${step.task}`);
});

// Proposed extraction functions
console.log('\n=== Proposed Extraction Functions ===\n');

const extractionProposals = [
  {
    name: 'generateDateRange',
    purpose: 'Generate list of dates between start and end',
    input: 'startDate: Date, endDate: Date, timezone: string',
    output: 'string[] (array of date strings in YYYY-MM-DD format)',
    lines: '125-133',
    complexity: 'Low - simple iteration',
    reusability: 'High - useful for other date range operations',
  },
  {
    name: 'processSingleBusinessDay',
    purpose: 'Calculate business hours for a single day',
    input: `{
      dayDateStr: string,
      startDate: Date,
      endDate: Date,
      timezone: string,
      businessHours: BusinessHours | null,
      holidayDates: Date[],
      include_weekends: boolean
    }`,
    output: `{
      dayResult: DayBusinessHours,
      minutes: number
    }`,
    lines: '139-214',
    complexity: 'High - main complexity is here',
    reusability: 'Medium - specific to this calculation',
  },
  {
    name: 'buildBusinessHoursResult',
    purpose: 'Aggregate daily results into final output',
    input: 'breakdown: DayBusinessHours[], totalMinutes: number',
    output: 'CalculateBusinessHoursResult',
    lines: '218-231',
    complexity: 'Low - simple aggregation',
    reusability: 'Low - specific to this function',
  },
];

extractionProposals.forEach((proposal) => {
  console.log(`\n${proposal.name}:`);
  console.log(`  Purpose: ${proposal.purpose}`);
  console.log(`  Lines: ${proposal.lines}`);
  console.log(`  Complexity: ${proposal.complexity}`);
  console.log(`  Reusability: ${proposal.reusability}`);
  console.log(`  Input: ${proposal.input}`);
  console.log(`  Output: ${proposal.output}`);
});

// Complexity analysis
console.log('\n=== Complexity Reduction Strategy ===\n');

console.log('Current State:');
console.log('  - Total complexity: 17');
console.log('  - Main contributor: Day processing loop (lines 139-214)');
console.log('  - Nested conditions: isWorkingDay && businessHours check');

console.log('\nAfter Extraction:');
console.log('  - Main function: ~8 (orchestration only)');
console.log('  - processSingleBusinessDay: ~8 (focused logic)');
console.log('  - generateDateRange: ~3 (simple loop)');
console.log('  - buildBusinessHoursResult: ~2 (simple object creation)');
console.log('  - Total: Still 17 but distributed across functions');
console.log('  - Benefit: Each function has single responsibility');

console.log('\n=== Key Insights ===\n');
console.log('1. The day processing loop (139-214) is the main complexity');
console.log('2. It mixes multiple concerns: day info, work day check, time calculation');
console.log('3. Date range generation is reusable and simple to extract');
console.log('4. Result building is trivial but makes main function cleaner');
console.log('5. Must preserve debug logging in extracted functions');
console.log('6. Must maintain exact business logic (no behavior changes)');
