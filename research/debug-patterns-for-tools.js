#!/usr/bin/env node

/**
 * Research: Debug Patterns for Remaining Tools
 *
 * Purpose: Identify where debug statements should be added to
 * subtractTime, formatTime, and nextOccurrence tools
 *
 * Date: 2025-08-08
 */

const fs = require('fs');
const path = require('path');

// Tools that need debug
const toolsToAnalyze = [
  {
    name: 'subtractTime',
    file: 'src/tools/subtractTime.ts',
    namespace: 'timing',
    debugPoints: [],
  },
  {
    name: 'formatTime',
    file: 'src/tools/formatTime.ts',
    namespace: 'timing',
    debugPoints: [],
  },
  {
    name: 'nextOccurrence',
    file: 'src/tools/nextOccurrence.ts',
    namespace: 'recurrence',
    debugPoints: [],
  },
];

// Patterns that indicate where debug should be added
const DEBUG_PATTERNS = {
  functionEntry: /^export\s+function\s+(\w+)/,
  functionDefinition: /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
  constFunction: /^(?:export\s+)?const\s+(\w+)\s*=/,
  validation: /validate|Validate/,
  parsing: /parse|Parse/,
  calculation: /calculate|Calculate/,
  formatting: /format|Format/,
  caching: /withCache|cache/,
  errorHandling: /catch|throw|error/i,
  returnStatement: /^\s*return\s+/,
  conditionalLogic: /^\s*if\s*\(/,
  switchStatement: /^\s*switch\s*\(/,
  mapping: /map|Map/,
};

function analyzeFile(toolInfo) {
  const content = fs.readFileSync(toolInfo.file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Check for function entries
    if (DEBUG_PATTERNS.functionEntry.test(line)) {
      const match = line.match(DEBUG_PATTERNS.functionEntry);
      toolInfo.debugPoints.push({
        line: lineNum,
        type: 'entry',
        function: match[1],
        message: `${match[1]} called with params: %O`,
        code: line.trim(),
      });
    }

    // Check for internal functions
    if (DEBUG_PATTERNS.functionDefinition.test(line) && !line.includes('export')) {
      const match = line.match(DEBUG_PATTERNS.functionDefinition);
      if (match) {
        toolInfo.debugPoints.push({
          line: lineNum,
          type: 'internal_function',
          function: match[1],
          message: `${match[1]} called`,
          code: line.trim(),
        });
      }
    }

    // Check for validation
    if (DEBUG_PATTERNS.validation.test(line) && line.includes('(')) {
      toolInfo.debugPoints.push({
        line: lineNum,
        type: 'validation',
        message: 'Validation check',
        code: line.trim(),
      });
    }

    // Check for parsing operations
    if (DEBUG_PATTERNS.parsing.test(line) && line.includes('(')) {
      toolInfo.debugPoints.push({
        line: lineNum,
        type: 'parsing',
        message: 'Parsing operation',
        code: line.trim(),
      });
    }

    // Check for calculations
    if (DEBUG_PATTERNS.calculation.test(line) && line.includes('(')) {
      toolInfo.debugPoints.push({
        line: lineNum,
        type: 'calculation',
        message: 'Calculation step',
        code: line.trim(),
      });
    }

    // Check for formatting
    if (DEBUG_PATTERNS.formatting.test(line) && line.includes('(') && !line.includes('function')) {
      toolInfo.debugPoints.push({
        line: lineNum,
        type: 'formatting',
        message: 'Formatting operation',
        code: line.trim(),
      });
    }

    // Check for return statements in main functions
    if (DEBUG_PATTERNS.returnStatement.test(line) && !line.includes('=>')) {
      // Look back to find the function context
      let funcName = 'unknown';
      for (let i = index; i >= 0; i--) {
        const prevLine = lines[i];
        const funcMatch = prevLine.match(/function\s+(\w+)|const\s+(\w+)\s*=/);
        if (funcMatch) {
          funcName = funcMatch[1] || funcMatch[2];
          break;
        }
      }

      if (funcName === toolInfo.name || funcName.includes(toolInfo.name)) {
        toolInfo.debugPoints.push({
          line: lineNum,
          type: 'return',
          function: funcName,
          message: `${funcName} returning: %O`,
          code: line.trim(),
        });
      }
    }
  });

  return toolInfo;
}

// Analyze each tool
console.log('=== Debug Pattern Analysis for Remaining Tools ===\n');

toolsToAnalyze.forEach((tool) => {
  console.log(`\n## ${tool.name} (${tool.namespace} namespace)`);
  console.log(`File: ${tool.file}`);

  try {
    analyzeFile(tool);

    if (tool.debugPoints.length === 0) {
      console.log('No obvious debug points found - manual analysis needed');
    } else {
      console.log(`\nIdentified ${tool.debugPoints.length} potential debug points:`);

      // Group by type
      const byType = {};
      tool.debugPoints.forEach((point) => {
        if (!byType[point.type]) {
          byType[point.type] = [];
        }
        byType[point.type].push(point);
      });

      Object.entries(byType).forEach(([type, points]) => {
        console.log(`\n### ${type.toUpperCase()} (${points.length} points)`);
        points.forEach((point) => {
          console.log(`  Line ${point.line}: ${point.message || point.code}`);
        });
      });
    }
  } catch (error) {
    console.error(`Error analyzing ${tool.file}: ${error.message}`);
  }
});

// Generate summary
console.log('\n\n## Summary of Debug Points Needed\n');

toolsToAnalyze.forEach((tool) => {
  const entryPoints = tool.debugPoints.filter((p) => p.type === 'entry').length;
  const validationPoints = tool.debugPoints.filter((p) => p.type === 'validation').length;
  const returnPoints = tool.debugPoints.filter((p) => p.type === 'return').length;

  console.log(`${tool.name}:`);
  console.log(`  - Namespace: ${tool.namespace}`);
  console.log(`  - Entry points: ${entryPoints}`);
  console.log(`  - Validation points: ${validationPoints}`);
  console.log(`  - Return points: ${returnPoints}`);
  console.log(`  - Total: ${tool.debugPoints.length}`);
});

// Look at existing patterns in similar tools
console.log('\n\n## Reference: Debug Patterns in Similar Tools\n');

const referenceTools = [
  { name: 'addTime', file: 'src/tools/addTime.ts' },
  { name: 'calculateDuration', file: 'src/tools/calculateDuration.ts' },
];

referenceTools.forEach((tool) => {
  try {
    const content = fs.readFileSync(tool.file, 'utf8');
    const debugCalls = content.match(/debug\.\w+\([^)]+\)/g) || [];

    console.log(`\n${tool.name} has ${debugCalls.length} debug calls:`);

    // Extract unique patterns
    const patterns = new Set();
    debugCalls.forEach((call) => {
      const match = call.match(/debug\.(\w+)\('([^']+)'/);
      if (match) {
        patterns.add(`${match[1]}: ${match[2]}`);
      }
    });

    Array.from(patterns)
      .slice(0, 5)
      .forEach((pattern) => {
        console.log(`  - ${pattern}`);
      });
  } catch (error) {
    console.error(`Could not read ${tool.file}`);
  }
});

console.log('\n=== Analysis Complete ===');
