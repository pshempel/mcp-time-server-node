#!/usr/bin/env npx tsx
/**
 * Research script to analyze complexity patterns in business functions
 * and design clear decomposition strategy
 */

console.log('=== Complexity Analysis for Business Functions ===\n');

console.log('CALCULATEBUSINESSHOURS RESPONSIBILITIES:');
console.log('=========================================');
console.log('1. VALIDATION LAYER (Lines 56-132, ~76 lines):');
console.log('   - String length validation');
console.log('   - Array length validation');
console.log('   - Timezone validation');
console.log('   - Business hours structure validation');
console.log('   - Weekly vs daily hours validation');
console.log('   - Individual day validation');
console.log('   Problem: Deep nesting, multiple validation types mixed');
console.log('');

console.log('2. DATE PREPARATION (Lines 152-187, ~35 lines):');
console.log('   - Parse start/end dates');
console.log('   - Validate date order');
console.log('   - Parse holidays');
console.log('   Problem: Already partially extracted, but error handling complex');
console.log('');

console.log('3. BUSINESS RULES (Lines 189-201, ~12 lines):');
console.log('   - getBusinessHoursForDay - determines hours for specific day');
console.log('   - Handles weekly schedule vs daily');
console.log('   - Falls back to defaults');
console.log('   Status: Good local helper, well-focused');
console.log('');

console.log('4. MAIN CALCULATION LOOP (Lines 203-299, ~96 lines):');
console.log('   Problems: Doing WAY too much in one loop:');
console.log('   a) Date iteration in business timezone');
console.log('   b) Day-of-week calculation');
console.log('   c) Weekend detection');
console.log('   d) Holiday detection');
console.log('   e) Business hours retrieval');
console.log('   f) Start/end day overlap handling');
console.log('   g) Minute calculations');
console.log('   h) Result accumulation');
console.log('');

console.log('PROPOSED DECOMPOSITION:');
console.log('=======================');
console.log('');

console.log('1. validateBusinessHoursParams(params)');
console.log('   - All parameter validation in one place');
console.log('   - Returns validated params or throws');
console.log('   - ~30 lines, complexity ~5');
console.log('');

console.log('2. validateBusinessHoursStructure(hours)');
console.log('   - Validates business hours object/weekly structure');
console.log('   - Extracted from main validation');
console.log('   - ~20 lines, complexity ~3');
console.log('');

console.log('3. getDatesInBusinessTimezone(startDate, endDate, timezone)');
console.log('   - Returns array of date strings in business TZ');
console.log('   - Handles DST correctly');
console.log('   - ~10 lines, complexity ~2');
console.log('');

console.log('4. isWorkDay(date, timezone, holidays, includeWeekends)');
console.log('   - Single responsibility: is this day workable?');
console.log('   - Checks weekend + holiday status');
console.log('   - ~10 lines, complexity ~3');
console.log('');

console.log('5. calculateDayBusinessMinutes(dayDate, businessHours, startDate, endDate, timezone)');
console.log('   - Calculates minutes for a single day');
console.log('   - Handles start/end day overlaps');
console.log('   - ~25 lines, complexity ~5');
console.log('');

console.log('6. buildDayResult(dateStr, dayName, minutes, isWeekend, isHoliday)');
console.log('   - Creates the DayBusinessHours object');
console.log('   - ~5 lines, complexity ~1');
console.log('');

console.log('MAIN FUNCTION AFTER REFACTORING:');
console.log('=================================');
console.log('function calculateBusinessHours(params) {');
console.log('  // Setup and cache (~5 lines)');
console.log('  return withCache(key, ttl, () => {');
console.log('    // Validate all params (~2 lines)');
console.log('    const validated = validateBusinessHoursParams(params);');
console.log('    ');
console.log('    // Parse dates and holidays (~3 lines)');
console.log('    const startDate = parseDateWithTimezone(...);');
console.log('    const endDate = parseDateWithTimezone(...);');
console.log('    const holidays = parseHolidayDates(...);');
console.log('    ');
console.log('    // Get dates to process (~1 line)');
console.log('    const datesToProcess = getDatesInBusinessTimezone(startDate, endDate, timezone);');
console.log('    ');
console.log('    // Process each day (~10 lines)');
console.log('    const breakdown = datesToProcess.map(dateStr => {');
console.log('      const dayInfo = getDayInfo(dateStr, timezone);');
console.log('      const isWorkable = isWorkDay(dateStr, holidays, includeWeekends);');
console.log('      ');
console.log('      let minutes = 0;');
console.log('      if (isWorkable) {');
console.log('        const businessHours = getBusinessHoursForDay(dayInfo.dayOfWeek);');
console.log('        minutes = calculateDayBusinessMinutes(...);');
console.log('      }');
console.log('      ');
console.log('      return buildDayResult(dateStr, dayInfo.name, minutes, ...);');
console.log('    });');
console.log('    ');
console.log('    // Calculate totals (~3 lines)');
console.log(
  '    const totalMinutes = breakdown.reduce((sum, day) => sum + day.business_minutes, 0);'
);
console.log('    return { total_business_minutes: totalMinutes, ... };');
console.log('  });');
console.log('}');
console.log('// Total: ~40 lines, Complexity: ~8');
console.log('');

console.log('BENEFITS:');
console.log('=========');
console.log('1. Each function has a single, clear purpose');
console.log('2. Functions are reusable (isWorkDay could be used elsewhere)');
console.log('3. Testing becomes much easier - test each piece independently');
console.log('4. Main function shows the algorithm clearly');
console.log('5. Complexity drops from 30 to ~8');
console.log('6. Each helper is under 30 lines');
console.log('');

console.log('SIMILAR APPROACH FOR getBusinessDays:');
console.log('======================================');
console.log('1. validateBusinessDaysParams()');
console.log('2. collectAllHolidays() - handles calendar + custom + legacy');
console.log('3. categorizeDay() - returns "business", "weekend", or "holiday"');
console.log('4. Main function just iterates and counts by category');
console.log('');

console.log('KEY PRINCIPLE: Each function should answer ONE question:');
console.log('- Is this valid? (validation)');
console.log('- What dates are we processing? (date range)');
console.log('- Is this a work day? (business rule)');
console.log('- How many minutes on this day? (calculation)');
console.log('- What category is this day? (categorization)');
