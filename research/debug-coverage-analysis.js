#!/usr/bin/env node

/**
 * Research: Debug Coverage Analysis
 *
 * Purpose: Identify functions/utilities missing debug statements
 * Date: 2025-08-08
 *
 * This script analyzes which files and functions lack debug coverage
 * after our Phase 1-2 refactoring.
 */

const fs = require('fs');
const path = require('path');

// Files to analyze (our main tools and utilities)
const filesToAnalyze = [
  // Tools
  'src/tools/getBusinessDays.ts',
  'src/tools/calculateBusinessHours.ts',
  'src/tools/addTime.ts',
  'src/tools/subtractTime.ts',
  'src/tools/convertTimezone.ts',
  'src/tools/calculateDuration.ts',
  'src/tools/getCurrentTime.ts',
  'src/tools/formatTime.ts',
  'src/tools/nextOccurrence.ts',
  'src/tools/daysUntil.ts',

  // Core utilities
  'src/utils/cacheKeyBuilder.ts',
  'src/utils/holidayAggregator.ts',
  'src/utils/parseTimeInput.ts',
  'src/utils/resolveTimezone.ts',
  'src/utils/businessUtils.ts',
  'src/utils/businessHoursHelpers.ts',
  'src/utils/withCache.ts',
  'src/utils/validation.ts',
];

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Find all exported functions (handle various TypeScript export patterns)
    const functionPatterns = [
      /export\s+(async\s+)?function\s+(\w+)/g,
      /export\s+const\s+(\w+)\s*=\s*(async\s+)?function/g,
      /export\s+const\s+(\w+)\s*=\s*(async\s+)?\([^)]*\)\s*=>/g,
      /function\s+(\w+)\s*\(/g, // Also catch internal functions
    ];

    const functions = [];

    functionPatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        // Extract function name from different capture groups
        const funcName = match[2] || match[1] || 'anonymous';
        if (funcName === 'async') continue; // Skip if we captured 'async' keyword

        const funcStart = match.index;

        // Find function body boundaries
        let braceCount = 0;
        let parenCount = 0;
        let inFunction = false;
        let funcEnd = funcStart;

        for (let i = funcStart; i < content.length; i++) {
          if (content[i] === '(') parenCount++;
          if (content[i] === ')') parenCount--;
          if (content[i] === '{' && parenCount === 0) {
            braceCount++;
            inFunction = true;
          } else if (content[i] === '}' && parenCount === 0) {
            braceCount--;
            if (inFunction && braceCount === 0) {
              funcEnd = i;
              break;
            }
          }
        }

        const funcBody = content.substring(funcStart, funcEnd + 1);

        // Skip if too short to be a real function
        if (funcBody.length < 50) continue;

        // Count debug statements in function
        const debugPattern =
          /debug\.(tools|business|cache|utils|decision|timing|error|trace|holidays|validation|parse|timezone|log)\(/g;
        const debugMatches = funcBody.match(debugPattern) || [];

        // Avoid duplicates
        if (!functions.find((f) => f.name === funcName)) {
          functions.push({
            name: funcName,
            debugCount: debugMatches.length,
            lines: funcBody.split('\n').length,
            complexity: estimateComplexity(funcBody),
          });
        }
      }
    });

    return {
      file: filePath,
      functions,
      totalDebugStatements: (content.match(/debug\./g) || []).length,
      hasImportDebug: content.includes('import { debug }') || content.includes("from './debug'"),
      lineCount: lines.length,
    };
  } catch (error) {
    return {
      file: filePath,
      error: error.message,
    };
  }
}

function estimateComplexity(funcBody) {
  // Simple complexity estimate based on control flow keywords
  const keywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', '&&', '||', '?'];
  let complexity = 1;

  keywords.forEach((keyword) => {
    const pattern = new RegExp(`\\b${keyword}\\b`, 'g');
    const matches = funcBody.match(pattern) || [];
    complexity += matches.length;
  });

  return complexity;
}

// Analyze all files
console.log('=== Debug Coverage Analysis ===\n');

const results = filesToAnalyze.map(analyzeFile);

// Report findings
console.log('## Files Missing Debug Import\n');
results
  .filter((r) => !r.error && !r.hasImportDebug && r.functions.length > 0)
  .forEach((r) => {
    console.log(`- ${r.file}`);
  });

console.log('\n## Functions Without Debug Statements\n');
results
  .filter((r) => !r.error)
  .forEach((r) => {
    const functionsWithoutDebug = r.functions.filter((f) => f.debugCount === 0 && f.complexity > 3);
    if (functionsWithoutDebug.length > 0) {
      console.log(`\n### ${r.file}`);
      functionsWithoutDebug.forEach((f) => {
        console.log(`  - ${f.name}: ${f.lines} lines, complexity ~${f.complexity}, NO DEBUG`);
      });
    }
  });

console.log('\n## Functions With Debug Coverage\n');
results
  .filter((r) => !r.error)
  .forEach((r) => {
    const functionsWithDebug = r.functions.filter((f) => f.debugCount > 0);
    if (functionsWithDebug.length > 0) {
      console.log(`\n### ${r.file}`);
      functionsWithDebug.forEach((f) => {
        console.log(`  - ${f.name}: ${f.debugCount} debug statements`);
      });
    }
  });

console.log('\n## Summary Statistics\n');
const totalFunctions = results.reduce((sum, r) => sum + (r.functions?.length || 0), 0);
const functionsWithDebug = results.reduce(
  (sum, r) => sum + (r.functions?.filter((f) => f.debugCount > 0).length || 0),
  0
);
const totalDebugStatements = results.reduce((sum, r) => sum + (r.totalDebugStatements || 0), 0);

console.log(`Total functions analyzed: ${totalFunctions}`);
console.log(
  `Functions with debug: ${functionsWithDebug} (${Math.round((functionsWithDebug / totalFunctions) * 100)}%)`
);
console.log(
  `Functions without debug: ${totalFunctions - functionsWithDebug} (${Math.round(((totalFunctions - functionsWithDebug) / totalFunctions) * 100)}%)`
);
console.log(`Total debug statements: ${totalDebugStatements}`);

console.log('\n## Priority Recommendations\n');
console.log('Based on complexity and missing debug coverage:\n');

// Find high-complexity functions without debug
const priorities = [];
results.forEach((r) => {
  if (r.error) return;
  r.functions.forEach((f) => {
    if (f.debugCount === 0 && f.complexity > 5) {
      priorities.push({
        file: r.file,
        function: f.name,
        complexity: f.complexity,
        lines: f.lines,
      });
    }
  });
});

priorities
  .sort((a, b) => b.complexity - a.complexity)
  .slice(0, 10)
  .forEach((p, i) => {
    console.log(
      `${i + 1}. ${p.file} - ${p.function}() [complexity: ${p.complexity}, lines: ${p.lines}]`
    );
  });

console.log('\n=== Analysis Complete ===');
