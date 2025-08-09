#!/usr/bin/env node

/**
 * Research: Debug Namespace Migration Mapping
 *
 * Purpose: Map each debug.tools call to its proper namespace
 * Date: 2025-08-08
 *
 * This script analyzes debug.tools calls and suggests the correct
 * namespace based on the function context and operation type.
 */

const fs = require('fs');
const path = require('path');

// Namespace mapping rules based on function/operation type
const NAMESPACE_RULES = {
  // Timing operations - date arithmetic, duration calculations
  timing: [
    'addTime',
    'subtractTime',
    'calculateDuration',
    'validateAmount',
    'validateUnit',
    'formatAddTimeResult',
    'formatUnixTimestampResult',
    'formatWithExplicitOffset',
  ],

  // Timezone operations - zone conversions, DST handling
  timezone: [
    'convertTimezone',
    'getCurrentTime',
    'validateTimezones',
    'parseDateForConversion',
    'formatOriginalTime',
    'extractOffsetString',
    'formatConvertedTime',
  ],

  // Parse operations - input interpretation, format detection
  parse: ['parseDateWithTimezone', 'daysUntil', 'parseTimeInput', 'detectFormat'],

  // Server/trace operations - request flow, tool execution
  trace: ['Executing tool', 'Tool .* executed', 'execution failed'],

  // Validation operations - parameter checking
  validation: ['validation passed', 'Invalid'],
};

// Files to analyze
const filesToAnalyze = [
  'src/tools/addTime.ts',
  'src/tools/calculateDuration.ts',
  'src/tools/convertTimezone.ts',
  'src/tools/daysUntil.ts',
  'src/tools/getCurrentTime.ts',
  'src/index.ts',
];

function suggestNamespace(context, message) {
  // Check each namespace rule
  for (const [namespace, patterns] of Object.entries(NAMESPACE_RULES)) {
    for (const pattern of patterns) {
      if (context.includes(pattern) || message.includes(pattern)) {
        return namespace;
      }
    }
  }

  // Default suggestions based on file path
  if (context.includes('addTime') || context.includes('subtract')) {
    return 'timing';
  }
  if (context.includes('timezone') || context.includes('convert')) {
    return 'timezone';
  }
  if (context.includes('parse') || context.includes('daysUntil')) {
    return 'parse';
  }
  if (context.includes('index.ts')) {
    return 'trace';
  }

  return 'unknown';
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const results = [];

  lines.forEach((line, index) => {
    if (line.includes('debug.tools')) {
      const lineNumber = index + 1;

      // Extract the debug message
      const messageMatch = line.match(/debug\.tools\(['"`](.*?)['"`]/);
      const message = messageMatch ? messageMatch[1] : '';

      // Get context (function name)
      let functionContext = 'unknown';
      for (let i = index; i >= 0 && i > index - 50; i--) {
        const funcMatch = lines[i].match(
          /(?:export\s+)?(?:async\s+)?function\s+(\w+)|(?:export\s+)?const\s+(\w+)\s*=/
        );
        if (funcMatch) {
          functionContext = funcMatch[1] || funcMatch[2];
          break;
        }
      }

      // Suggest namespace
      const suggestedNamespace = suggestNamespace(functionContext + ' ' + line, message);

      results.push({
        file: filePath,
        line: lineNumber,
        function: functionContext,
        message: message || '(complex message)',
        current: 'tools',
        suggested: suggestedNamespace,
        code: line.trim(),
      });
    }
  });

  return results;
}

// Analyze all files
console.log('=== Debug Namespace Migration Analysis ===\n');
console.log('Analyzing debug.tools calls and suggesting proper namespaces...\n');

const allResults = [];
let fileCount = 0;

filesToAnalyze.forEach((file) => {
  try {
    const results = analyzeFile(file);
    if (results.length > 0) {
      fileCount++;
      allResults.push(...results);
    }
  } catch (error) {
    console.error(`Error analyzing ${file}: ${error.message}`);
  }
});

// Group results by suggested namespace
const byNamespace = {};
allResults.forEach((result) => {
  if (!byNamespace[result.suggested]) {
    byNamespace[result.suggested] = [];
  }
  byNamespace[result.suggested].push(result);
});

// Output results grouped by suggested namespace
console.log('## Migration Plan by Namespace\n');

Object.entries(byNamespace).forEach(([namespace, items]) => {
  console.log(`### ${namespace.toUpperCase()} namespace (${items.length} calls)`);
  console.log('```typescript');

  // Group by file
  const byFile = {};
  items.forEach((item) => {
    if (!byFile[item.file]) {
      byFile[item.file] = [];
    }
    byFile[item.file].push(item);
  });

  Object.entries(byFile).forEach(([file, fileItems]) => {
    console.log(`\n// ${file}`);
    fileItems.forEach((item) => {
      console.log(`Line ${item.line}: debug.tools → debug.${namespace} // ${item.function}()`);
    });
  });

  console.log('```\n');
});

// Summary statistics
console.log('## Summary\n');
console.log(`Total debug.tools calls to migrate: ${allResults.length}`);
console.log(`Files affected: ${fileCount}`);
console.log('\nNamespace distribution:');
Object.entries(byNamespace).forEach(([namespace, items]) => {
  console.log(`  - ${namespace}: ${items.length} calls`);
});

// Generate sed commands for migration
console.log('\n## Migration Commands\n');
console.log('Use these commands to perform the migration:\n');

Object.entries(byNamespace).forEach(([namespace, items]) => {
  if (namespace === 'unknown') return;

  // Group items by file for sed commands
  const fileGroups = {};
  items.forEach((item) => {
    if (!fileGroups[item.file]) {
      fileGroups[item.file] = namespace;
    }
  });

  console.log(`### ${namespace.toUpperCase()} namespace`);
  Object.entries(fileGroups).forEach(([file, ns]) => {
    console.log(`sed -i 's/debug\\.tools/debug.${ns}/g' ${file}`);
  });
  console.log();
});

// Verification command
console.log('### Verify migration');
console.log('grep -r "debug\\.tools" src/ --include="*.ts" | wc -l');
console.log('# Should return 0 after migration (except debugEnhanced.ts)\n');

console.log('=== Analysis Complete ===');
