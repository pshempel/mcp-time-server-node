import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

/**
 * Tests for Debug Coverage in Remaining Tools
 *
 * These tests verify that debug statements are properly added to:
 * - subtractTime (timing namespace)
 * - formatTime (timing namespace)
 * - nextOccurrence (recurrence namespace)
 *
 * Test Strategy:
 * 1. Mock stderr to capture debug output
 * 2. Enable specific DEBUG patterns
 * 3. Call the tool functions
 * 4. Verify expected debug output appears
 */

describe('Debug Coverage for Tools', () => {
  const originalEnv = process.env;
  const originalStderr = process.stderr.write;
  let stderrOutput: string[] = [];

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
    stderrOutput = [];

    // Mock stderr to capture debug output
    process.stderr.write = jest.fn((chunk: string | Uint8Array) => {
      stderrOutput.push(chunk.toString());
      return true;
    }) as any;

    // Clear module cache to ensure fresh imports
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    process.stderr.write = originalStderr;
    jest.resetModules();
  });

  describe('subtractTime debug coverage', () => {
    it('should log entry with timing namespace', async () => {
      process.env.DEBUG = 'mcp:timing';

      const { subtractTime } = await import('../../src/tools/subtractTime');

      const result = subtractTime({
        time: '2025-01-01T12:00:00Z',
        amount: 2,
        unit: 'hours',
      });

      const output = stderrOutput.join('');

      // Should contain timing namespace output
      expect(output).toContain('mcp:timing');
      expect(output).toContain('subtractTime called');

      // Verify the result is correct
      expect(result.original).toBe('2025-01-01T12:00:00.000Z');
      expect(result.result).toBe('2025-01-01T10:00:00.000Z');
    });

    it('should log delegation to addTime', async () => {
      process.env.DEBUG = 'mcp:timing';

      const { subtractTime } = await import('../../src/tools/subtractTime');

      subtractTime({
        time: '2025-01-01T12:00:00Z',
        amount: 5,
        unit: 'days',
      });

      const output = stderrOutput.join('');

      // Should show it's delegating to addTime with negated amount
      expect(output).toContain('subtractTime called');
      expect(output).toContain('Delegating to addTime with negated amount');
    });

    it('should not log when DEBUG is not set', async () => {
      delete process.env.DEBUG;

      const { subtractTime } = await import('../../src/tools/subtractTime');

      subtractTime({
        time: '2025-01-01T12:00:00Z',
        amount: 1,
        unit: 'hours',
      });

      const output = stderrOutput.join('');
      expect(output).toBe('');
    });
  });

  describe('formatTime debug coverage', () => {
    it('should log entry with timing namespace', async () => {
      process.env.DEBUG = 'mcp:timing';

      const { formatTime } = await import('../../src/tools/formatTime');

      const result = formatTime({
        time: '2025-01-01T12:00:00Z',
        format: 'custom',
        custom_format: 'yyyy-MM-dd',
      });

      const output = stderrOutput.join('');

      // Should contain timing namespace output
      expect(output).toContain('mcp:timing');
      expect(output).toContain('formatTime called');

      // Verify the result is correct
      expect(result.formatted).toBe('2025-01-01');
    });

    it('should log format validation with validation namespace', async () => {
      process.env.DEBUG = 'mcp:validation';

      const { formatTime } = await import('../../src/tools/formatTime');

      formatTime({
        time: '2025-01-01T12:00:00Z',
        format: 'custom',
        custom_format: 'yyyy-MM-dd HH:mm:ss',
      });

      const output = stderrOutput.join('');

      // Should contain validation of format string
      expect(output).toContain('mcp:validation');
      expect(output).toContain('isValidFormatString');
    });

    it('should log parsing with parse namespace', async () => {
      process.env.DEBUG = 'mcp:parse';

      const { formatTime } = await import('../../src/tools/formatTime');

      formatTime({
        time: '2025-01-01T12:00:00Z',
        format: 'relative',
      });

      const output = stderrOutput.join('');

      // Should contain parse output
      expect(output).toContain('mcp:parse');
      expect(output).toContain('parseTimeWithFallback');
    });

    it('should log relative formatting logic', async () => {
      process.env.DEBUG = 'mcp:timing';

      const { formatTime } = await import('../../src/tools/formatTime');

      formatTime({
        time: new Date().toISOString(),
        format: 'relative',
      });

      const output = stderrOutput.join('');

      // Should contain formatting logic
      expect(output).toContain('mcp:timing');
      expect(output).toContain('formatRelativeTime');
    });

    it('should log return value', async () => {
      process.env.DEBUG = 'mcp:timing';

      const { formatTime } = await import('../../src/tools/formatTime');

      const result = formatTime({
        time: '2025-01-01T12:00:00Z',
        format: 'custom',
        custom_format: 'yyyy',
      });

      const output = stderrOutput.join('');

      // Should log the return
      expect(output).toContain('formatTime returning');
      expect(result.formatted).toBe('2025');
    });
  });

  describe('nextOccurrence debug coverage', () => {
    it('should log entry with recurrence namespace', async () => {
      process.env.DEBUG = 'mcp:recurrence';

      const { nextOccurrence } = await import('../../src/tools/nextOccurrence');

      const result = nextOccurrence({
        pattern: 'daily',
        time: '09:00',
      });

      const output = stderrOutput.join('');

      // Should contain recurrence namespace output
      expect(output).toContain('mcp:recurrence');
      expect(output).toContain('nextOccurrence called');

      // Result should be valid
      expect(result).toHaveProperty('next');
      expect(result).toHaveProperty('unix');
      expect(result).toHaveProperty('days_until');
    });

    it('should log parameter mapping', async () => {
      process.env.DEBUG = 'mcp:recurrence';

      const { nextOccurrence } = await import('../../src/tools/nextOccurrence');

      nextOccurrence({
        pattern: 'weekly',
        day_of_week: 1,
        time: '10:00',
      });

      const output = stderrOutput.join('');

      // Should log parameter mapping
      expect(output).toContain('mapToRecurrenceParams');
      expect(output).toContain('pattern: weekly');
    });

    it('should log calculation steps', async () => {
      process.env.DEBUG = 'mcp:recurrence';

      const { nextOccurrence } = await import('../../src/tools/nextOccurrence');

      nextOccurrence({
        pattern: 'monthly',
        day_of_month: 15,
      });

      const output = stderrOutput.join('');

      // Should log calculation steps
      expect(output).toContain('calculateNextOccurrence');
      expect(output).toContain('calculateDaysUntil');
    });

    it('should log parsing with parse namespace when start_from is provided', async () => {
      process.env.DEBUG = 'mcp:parse';

      const { nextOccurrence } = await import('../../src/tools/nextOccurrence');

      nextOccurrence({
        pattern: 'daily',
        start_from: '2025-02-01T00:00:00Z',
      });

      const output = stderrOutput.join('');

      // Should contain parse output
      expect(output).toContain('mcp:parse');
      expect(output).toContain('Parsing start_from');
    });

    it('should log validation with validation namespace', async () => {
      process.env.DEBUG = 'mcp:validation';

      const { nextOccurrence } = await import('../../src/tools/nextOccurrence');

      nextOccurrence({
        pattern: 'daily',
        timezone: 'America/New_York',
      });

      const output = stderrOutput.join('');

      // Should contain validation output
      expect(output).toContain('mcp:validation');
      expect(output).toContain('Validating timezone');
    });

    it('should log return value', async () => {
      process.env.DEBUG = 'mcp:recurrence';

      const { nextOccurrence } = await import('../../src/tools/nextOccurrence');

      const result = nextOccurrence({
        pattern: 'daily',
      });

      const output = stderrOutput.join('');

      // Should log the return
      expect(output).toContain('nextOccurrence returning');
      expect(result).toHaveProperty('next');
    });
  });

  describe('Cross-namespace isolation', () => {
    it('subtractTime should only show in timing namespace', async () => {
      process.env.DEBUG = 'mcp:recurrence';

      const { subtractTime } = await import('../../src/tools/subtractTime');

      subtractTime({
        time: '2025-01-01T12:00:00Z',
        amount: 1,
        unit: 'hours',
      });

      const output = stderrOutput.join('');

      // Should NOT contain timing output when only recurrence is enabled
      expect(output).not.toContain('subtractTime');
    });

    it('nextOccurrence should only show in recurrence namespace', async () => {
      process.env.DEBUG = 'mcp:timing';

      const { nextOccurrence } = await import('../../src/tools/nextOccurrence');

      nextOccurrence({
        pattern: 'daily',
      });

      const output = stderrOutput.join('');

      // Should NOT contain recurrence output when only timing is enabled
      expect(output).not.toContain('nextOccurrence');
    });
  });
});
