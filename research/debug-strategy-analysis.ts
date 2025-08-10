#!/usr/bin/env npx tsx
/**
 * Research: Strategic Debug Placement Analysis
 *
 * Goal: Identify WHERE debug logging actually matters based on:
 * 1. Complexity (cyclomatic complexity > 5)
 * 2. Business logic (calculations, not just pass-through)
 * 3. Error-prone areas (parsing, validation)
 * 4. State decisions (cache, rate limiting)
 * 5. Data transformations
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface DebugNeed {
  file: string;
  function: string;
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  suggestedNamespace: string;
}

async function analyzeDebugNeeds() {
  console.log('=== Strategic Debug Placement Analysis ===\n');

  const debugNeeds: DebugNeed[] = [];

  // Analyze each tool for complexity and debug needs
  const toolFiles = await glob('src/tools/*.ts');

  for (const file of toolFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const fileName = path.basename(file, '.ts');

    // Skip index files
    if (fileName === 'index') continue;

    console.log(`\nAnalyzing ${fileName}:`);

    // Check for complex business logic patterns
    const hasBusinessLogic =
      content.includes('business') ||
      content.includes('holiday') ||
      content.includes('weekend') ||
      content.includes('working');

    const hasDateCalculations =
      content.includes('add(') ||
      content.includes('sub(') ||
      content.includes('differenceIn') ||
      content.includes('startOfDay') ||
      content.includes('endOfDay');

    const hasTimezoneConversion =
      content.includes('formatInTimeZone') ||
      content.includes('zonedTimeToUtc') ||
      content.includes('utcToZonedTime');

    const hasComplexParsing =
      content.includes('parseTimeInput') ||
      content.includes('parse(') ||
      content.includes('parseISO');

    const hasRecurrence =
      content.includes('recurrence') ||
      content.includes('pattern') ||
      content.includes('next occurrence');

    const hasCache = content.includes('withCache');

    // Count decision points (if statements, switch cases)
    const ifCount = (content.match(/if\s*\(/g) || []).length;
    const switchCount = (content.match(/switch\s*\(/g) || []).length;
    const ternaryCount = (content.match(/\?.*:/g) || []).length;
    const decisionPoints = ifCount + switchCount + ternaryCount;

    // Determine debug needs
    if (hasBusinessLogic) {
      debugNeeds.push({
        file: fileName,
        function: fileName,
        reason: 'Complex business logic calculations',
        priority: 'HIGH',
        suggestedNamespace: `mcp:business:${fileName}`,
      });
      console.log('  ✓ HIGH: Business logic calculations');
    }

    if (hasRecurrence) {
      debugNeeds.push({
        file: fileName,
        function: fileName,
        reason: 'Recurrence pattern calculations',
        priority: 'HIGH',
        suggestedNamespace: `mcp:recurrence:${fileName}`,
      });
      console.log('  ✓ HIGH: Recurrence patterns');
    }

    if (hasTimezoneConversion && decisionPoints > 5) {
      debugNeeds.push({
        file: fileName,
        function: fileName,
        reason: 'Timezone conversion with complex logic',
        priority: 'HIGH',
        suggestedNamespace: `mcp:timezone:${fileName}`,
      });
      console.log('  ✓ HIGH: Complex timezone logic');
    }

    if (hasComplexParsing) {
      debugNeeds.push({
        file: fileName,
        function: fileName,
        reason: 'Date/time parsing edge cases',
        priority: 'MEDIUM',
        suggestedNamespace: `mcp:parse:${fileName}`,
      });
      console.log('  ✓ MEDIUM: Date parsing');
    }

    if (decisionPoints > 10) {
      debugNeeds.push({
        file: fileName,
        function: fileName,
        reason: `High complexity (${decisionPoints} decision points)`,
        priority: 'HIGH',
        suggestedNamespace: `mcp:complex:${fileName}`,
      });
      console.log(`  ✓ HIGH: Complexity (${decisionPoints} decisions)`);
    } else if (decisionPoints > 5) {
      console.log(`  ○ MEDIUM: Moderate complexity (${decisionPoints} decisions)`);
    }

    if (hasCache) {
      console.log('  ○ LOW: Cache operations (handled by withCache)');
    }

    // Check current debug coverage
    const currentDebugCount = (content.match(/debug\./g) || []).length;
    if (currentDebugCount === 0 && (hasBusinessLogic || decisionPoints > 5)) {
      console.log(`  ⚠️  NO DEBUG but needs it!`);
    } else if (currentDebugCount > 0) {
      console.log(`  Current debug statements: ${currentDebugCount}`);
    }
  }

  console.log('\n=== Debug Strategy Recommendations ===\n');

  console.log('HIGH PRIORITY (Complex business logic, error-prone):');
  debugNeeds
    .filter((n) => n.priority === 'HIGH')
    .forEach((need) => {
      console.log(`  - ${need.file}: ${need.reason}`);
      console.log(`    Namespace: ${need.suggestedNamespace}`);
    });

  console.log('\nMEDIUM PRIORITY (Parsing, transformations):');
  debugNeeds
    .filter((n) => n.priority === 'MEDIUM')
    .forEach((need) => {
      console.log(`  - ${need.file}: ${need.reason}`);
      console.log(`    Namespace: ${need.suggestedNamespace}`);
    });

  console.log('\n=== Namespace Strategy ===\n');
  console.log('Proposed namespace hierarchy for selective debugging:');
  console.log('  mcp:*                 - Everything');
  console.log('  mcp:business:*        - All business logic');
  console.log('  mcp:business:hours    - Just business hours calculations');
  console.log('  mcp:business:days     - Just business days calculations');
  console.log('  mcp:timezone:*        - All timezone operations');
  console.log('  mcp:parse:*           - All parsing operations');
  console.log('  mcp:recurrence:*      - All recurrence calculations');
  console.log('  mcp:cache:*           - Cache hit/miss/expire');
  console.log('  mcp:error:*           - All error paths');
  console.log('  mcp:trace             - Request flow tracing');

  console.log('\n=== Implementation Approach ===\n');
  console.log('1. DO NOT add blanket debug to every function');
  console.log('2. DO add debug at:');
  console.log('   - Complex calculations (business hours, holidays)');
  console.log('   - Data transformations (timezone conversions)');
  console.log('   - Decision points that affect outcomes');
  console.log('   - Error recovery paths');
  console.log('   - Cache reasoning (why hit/miss)');
  console.log('3. Use decorators ONLY where it makes sense:');
  console.log('   - @withDebug({ namespace: "mcp:business:hours", logArgs: true })');
  console.log('   - @withErrorDebug({ namespace: "mcp:error:hours" })');
  console.log('4. Keep manual debug for specific decision points');

  console.log('\n=== Expected Usage ===\n');
  console.log('# Debug business hours calculations only:');
  console.log('DEBUG=mcp:business:hours npm start\n');
  console.log('# Debug all timezone operations:');
  console.log('DEBUG=mcp:timezone:* npm start\n');
  console.log('# Debug parsing and business logic:');
  console.log('DEBUG=mcp:parse:*,mcp:business:* npm start\n');
  console.log('# Trace a request through the system:');
  console.log('DEBUG=mcp:trace npm start\n');
}

analyzeDebugNeeds().catch(console.error);
