#!/usr/bin/env npx tsx
/**
 * Research: Verify Enhanced Debug API Design
 *
 * Tests our proposed auto-namespacing and decision tracking approach
 */

import debugLib from 'debug';

// Simulate our enhanced debug API
class EnhancedDebug {
  private cache = new Map<string, ReturnType<typeof debugLib>>();

  // Get caller context for auto-namespacing
  private getCallerContext(): string {
    const stack = new Error().stack;
    if (!stack) return 'unknown';

    // Parse stack to get calling function
    const lines = stack.split('\n');
    // Line 0: Error
    // Line 1: at getCallerContext
    // Line 2: at log/decision
    // Line 3: actual caller
    const callerLine = lines[3] || '';

    // Extract function name from stack
    const match = callerLine.match(/at (\w+)|at Object\.(\w+)/);
    if (match) {
      return match[1] || match[2] || 'anonymous';
    }
    return 'anonymous';
  }

  // Auto-namespaced log
  log(message: string, ...args: any[]) {
    const context = this.getCallerContext();
    const namespace = `mcp:auto:${context}`;

    if (!this.cache.has(namespace)) {
      this.cache.set(namespace, debugLib(namespace));
    }

    const debug = this.cache.get(namespace)!;
    debug(message, ...args);
  }

  // Decision logging with structure
  decision(description: string, context: Record<string, any>) {
    const caller = this.getCallerContext();
    const namespace = `mcp:decision:${caller}`;

    if (!this.cache.has(namespace)) {
      this.cache.set(namespace, debugLib(namespace));
    }

    const debug = this.cache.get(namespace)!;

    // Format decision for clarity
    const formatted = Object.entries(context)
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join(', ');

    debug('DECISION: %s | %s', description, formatted);
  }

  // Explicit namespaces
  business = debugLib('mcp:business');
  timezone = debugLib('mcp:timezone');
  parse = debugLib('mcp:parse');
  error = debugLib('mcp:error');
  trace = debugLib('mcp:trace');
}

// Test the enhanced API
const debug = new EnhancedDebug();

function calculateBusinessHours() {
  // Auto-namespaced
  debug.log('Starting business hours calculation');

  // Decision tracking
  debug.decision('Check if weekend', {
    date: '2025-01-15',
    dayOfWeek: 3,
    isWeekend: false,
  });

  // Explicit when needed
  debug.business('Complex business logic here');
}

function getBusinessDays() {
  debug.log('Processing business days');

  debug.decision('Holiday check', {
    date: '2025-12-25',
    country: 'US',
    isHoliday: true,
    holidayName: 'Christmas',
  });
}

function parseTimeInput() {
  debug.log('Parsing input: "%s"', '2025-01-15T10:00:00Z');

  debug.decision('Format detection', {
    input: '2025-01-15T10:00:00Z',
    detectedFormat: 'ISO8601',
    hasTimezone: true,
    timezone: 'UTC',
  });
}

// Test with different DEBUG settings
console.log('=== Testing Enhanced Debug API ===\n');

console.log('1. Test with DEBUG=mcp:* (see everything)');
process.env.DEBUG = 'mcp:*';
calculateBusinessHours();
getBusinessDays();

console.log('\n2. Test with DEBUG=mcp:decision:* (see only decisions)');
process.env.DEBUG = 'mcp:decision:*';
calculateBusinessHours();
getBusinessDays();

console.log('\n3. Test with DEBUG=mcp:auto:calculateBusinessHours (see only one function)');
process.env.DEBUG = 'mcp:auto:calculateBusinessHours';
calculateBusinessHours();
getBusinessDays();

console.log('\n4. Test with DEBUG=mcp:business (explicit namespace)');
process.env.DEBUG = 'mcp:business';
calculateBusinessHours();

console.log('\n=== API Simplicity Check ===');
console.log('Before: debug.tools("calculateBusinessHours called with params: %O", params);');
console.log('After:  debug.log("Starting calculation", params);');
console.log('\nBefore: Multiple manual namespace imports');
console.log('After:  Auto-namespaced by context');

console.log('\n=== Growth Path ===');
console.log('Start:     DEBUG=mcp:*');
console.log('Focus:     DEBUG=mcp:business:*');
console.log('Specific:  DEBUG=mcp:decision:calculateBusinessHours');
console.log('Combine:   DEBUG=mcp:error:*,mcp:decision:*');

console.log('\n✅ Simple API that scales with the codebase!');
