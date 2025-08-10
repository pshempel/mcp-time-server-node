#!/usr/bin/env npx tsx
/**
 * Research: Debug Logger Repetition Analysis
 *
 * Analyzes the current state of debug logging to understand:
 * 1. How much repetitive debug code exists
 * 2. Common patterns that could be extracted
 * 3. Potential savings from decorator-based approach
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

async function analyzeDebugPatterns() {
  console.log('=== Debug Logger Repetition Analysis ===\n');

  const toolFiles = await glob('src/tools/*.ts');
  const utilFiles = await glob('src/utils/*.ts');
  const allFiles = [...toolFiles, ...utilFiles];

  let totalDebugLines = 0;
  let totalTryCatchBlocks = 0;
  let filesWithDebug = 0;
  let filesWithoutDebug = 0;

  const patterns = {
    entryLog: 0, // debug.tools('functionName called with...')
    successLog: 0, // debug.tools('functionName succeeded')
    errorLog: 0, // debug.tools('functionName failed:', error)
    cacheLog: 0, // debug.cache('Cache hit/miss...')
    tryCatchWithDebug: 0,
    tryCatchWithoutDebug: 0,
  };

  console.log('Files analyzed:');
  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const fileName = path.basename(file);

    // Count debug statements
    const debugCount = (content.match(/debug\./g) || []).length;
    if (debugCount > 0) {
      filesWithDebug++;
      console.log(`  ${fileName}: ${debugCount} debug statements`);
    } else {
      filesWithoutDebug++;
      console.log(`  ${fileName}: NO debug statements ⚠️`);
    }
    totalDebugLines += debugCount;

    // Analyze patterns
    if (content.includes('called with')) patterns.entryLog++;
    if (content.includes('succeeded') || content.includes('success')) patterns.successLog++;
    if (content.includes('failed:') || content.includes('error:')) patterns.errorLog++;
    if (content.includes('Cache hit') || content.includes('Cache miss')) patterns.cacheLog++;

    // Count try-catch blocks
    const tryMatches = content.match(/try\s*{/g) || [];
    totalTryCatchBlocks += tryMatches.length;

    // Check if try-catch blocks have debug
    const tryBlocks = content.split(/try\s*{/);
    for (let i = 1; i < tryBlocks.length; i++) {
      const catchIndex = tryBlocks[i].indexOf('catch');
      if (catchIndex !== -1) {
        const catchBlock = tryBlocks[i].substring(catchIndex);
        if (catchBlock.includes('debug.')) {
          patterns.tryCatchWithDebug++;
        } else {
          patterns.tryCatchWithoutDebug++;
        }
      }
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total files analyzed: ${allFiles.length}`);
  console.log(`Files with debug: ${filesWithDebug}`);
  console.log(`Files WITHOUT debug: ${filesWithoutDebug} ⚠️`);
  console.log(`Total debug statements: ${totalDebugLines}`);
  console.log(`Total try-catch blocks: ${totalTryCatchBlocks}`);

  console.log('\n=== Pattern Analysis ===');
  console.log(`Entry logs (called with...): ${patterns.entryLog}`);
  console.log(`Success logs: ${patterns.successLog}`);
  console.log(`Error logs: ${patterns.errorLog}`);
  console.log(`Cache logs: ${patterns.cacheLog}`);
  console.log(`Try-catch WITH debug: ${patterns.tryCatchWithDebug}`);
  console.log(`Try-catch WITHOUT debug: ${patterns.tryCatchWithoutDebug} ⚠️`);

  console.log('\n=== Repetitive Code Estimate ===');
  // Each debug statement is typically 1-2 lines
  const avgLinesPerDebug = 1.5;
  const estimatedDebugLines = totalDebugLines * avgLinesPerDebug;

  // Try-catch blocks are typically 4-8 lines
  const avgLinesPerTryCatch = 6;
  const estimatedTryCatchLines = totalTryCatchBlocks * avgLinesPerTryCatch;

  console.log(`Estimated lines for debug statements: ~${Math.round(estimatedDebugLines)}`);
  console.log(`Estimated lines for try-catch blocks: ~${Math.round(estimatedTryCatchLines)}`);
  console.log(
    `Total repetitive lines: ~${Math.round(estimatedDebugLines + estimatedTryCatchLines)}`
  );

  console.log('\n=== Decorator-Based Solution Benefits ===');
  console.log('With decorators, we could:');
  console.log('1. Auto-log function entry/exit (eliminate entry/success logs)');
  console.log('2. Auto-wrap in try-catch with error logging');
  console.log('3. Auto-log cache operations');
  console.log('4. Reduce ~150-200 lines of repetitive code');
  console.log('5. Ensure CONSISTENT debug coverage (no missed functions)');

  console.log('\n=== Example Transformation ===');
  console.log('BEFORE (18 lines with manual debug):');
  console.log(`
export function addTime(params: AddTimeParams): AddTimeResult {
  debug.tools('addTime called with params: %O', params);
  
  try {
    // ... validation ...
    
    const result = withCache(
      getCacheKey(params),
      CacheTTL.DATE_CALCULATION,
      () => {
        // ... logic ...
        debug.tools('addTime calculation successful');
        return result;
      }
    );
    
    debug.tools('addTime completed successfully');
    return result;
  } catch (error) {
    debug.tools('addTime failed:', error);
    throw error;
  }
}`);

  console.log('\nAFTER (5 lines with decorator):');
  console.log(`
@withDebug('tools')
@withErrorHandling
export function addTime(params: AddTimeParams): AddTimeResult {
  // ... validation ...
  return withCache(getCacheKey(params), CacheTTL.DATE_CALCULATION, () => {
    // ... logic ...
    return result;
  });
}`);
}

analyzeDebugPatterns().catch(console.error);
