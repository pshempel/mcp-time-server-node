import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

/**
 * Tests for Debug Namespace Isolation
 *
 * These tests verify that debug namespaces work in isolation,
 * allowing developers to debug specific subsystems without noise
 * from other areas.
 *
 * Test Strategy:
 * 1. Mock stderr to capture debug output
 * 2. Enable specific DEBUG patterns
 * 3. Call functions from different namespaces
 * 4. Verify only expected namespace output appears
 */

describe('Debug Namespace Isolation', () => {
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

  describe('Namespace Existence', () => {
    it('should have all required namespaces', async () => {
      const { debug } = await import('../../src/utils/debug');

      // Core namespaces from strategy
      expect(debug.business).toBeDefined();
      expect(debug.timezone).toBeDefined();
      expect(debug.parse).toBeDefined();
      expect(debug.error).toBeDefined();
      expect(debug.trace).toBeDefined();
      expect(debug.cache).toBeDefined();
      expect(debug.holidays).toBeDefined();
      expect(debug.timing).toBeDefined();
      expect(debug.recurrence).toBeDefined();

      // Legacy namespaces (should exist but be phased out)
      // tools namespace has been removed - migration complete
      expect(debug.server).toBeDefined();
      expect(debug.utils).toBeDefined();
      expect(debug.validation).toBeDefined();
    });
  });

  describe('Business Namespace Isolation', () => {
    it('should show ONLY business logic debug when DEBUG=mcp:business', async () => {
      process.env.DEBUG = 'mcp:business';

      const { debug } = await import('../../src/utils/debug');

      // Call various namespaces
      debug.business('Business calculation happening');
      debug.timezone('Timezone conversion happening');
      debug.timing('Timing calculation happening');
      debug.cache('Cache operation happening');

      const output = stderrOutput.join('');

      // Should contain business output
      expect(output).toContain('mcp:business');
      expect(output).toContain('Business calculation happening');

      // Should NOT contain other namespaces
      expect(output).not.toContain('mcp:timezone');
      expect(output).not.toContain('mcp:timing');
      expect(output).not.toContain('mcp:cache');
    });
  });

  describe('Timezone Namespace Isolation', () => {
    it('should show ONLY timezone debug when DEBUG=mcp:timezone', async () => {
      process.env.DEBUG = 'mcp:timezone';

      const { debug } = await import('../../src/utils/debug');

      // Call various namespaces
      debug.business('Business calculation happening');
      debug.timezone('Timezone conversion happening');
      debug.timing('Timing calculation happening');
      debug.parse('Parse operation happening');

      const output = stderrOutput.join('');

      // Should contain timezone output
      expect(output).toContain('mcp:timezone');
      expect(output).toContain('Timezone conversion happening');

      // Should NOT contain other namespaces
      expect(output).not.toContain('mcp:business');
      expect(output).not.toContain('mcp:timing');
      expect(output).not.toContain('mcp:parse');
    });
  });

  describe('Timing Namespace Isolation', () => {
    it('should show ONLY timing debug when DEBUG=mcp:timing', async () => {
      process.env.DEBUG = 'mcp:timing';

      const { debug } = await import('../../src/utils/debug');

      // Call various namespaces
      debug.timing('Duration calculation');
      debug.business('Business hours check');
      debug.timezone('Zone conversion');
      debug.cache('Cache hit');

      const output = stderrOutput.join('');

      // Should contain timing output
      expect(output).toContain('mcp:timing');
      expect(output).toContain('Duration calculation');

      // Should NOT contain other namespaces
      expect(output).not.toContain('mcp:business');
      expect(output).not.toContain('mcp:timezone');
      expect(output).not.toContain('mcp:cache');
    });
  });

  describe('Parse Namespace Isolation', () => {
    it('should show ONLY parse debug when DEBUG=mcp:parse', async () => {
      process.env.DEBUG = 'mcp:parse';

      const { debug } = await import('../../src/utils/debug');

      // Call various namespaces
      debug.parse('Parsing user input');
      debug.timing('Calculating duration');
      debug.business('Checking business hours');
      debug.error('Error occurred');

      const output = stderrOutput.join('');

      // Should contain parse output
      expect(output).toContain('mcp:parse');
      expect(output).toContain('Parsing user input');

      // Should NOT contain other namespaces
      expect(output).not.toContain('mcp:timing');
      expect(output).not.toContain('mcp:business');
      expect(output).not.toContain('mcp:error');
    });
  });

  describe('Multiple Namespace Selection', () => {
    it('should show multiple namespaces when specified', async () => {
      process.env.DEBUG = 'mcp:business,mcp:timezone';

      const { debug } = await import('../../src/utils/debug');

      // Call various namespaces
      debug.business('Business logic');
      debug.timezone('Timezone logic');
      debug.timing('Timing logic');
      debug.cache('Cache logic');

      const output = stderrOutput.join('');

      // Should contain business and timezone
      expect(output).toContain('mcp:business');
      expect(output).toContain('Business logic');
      expect(output).toContain('mcp:timezone');
      expect(output).toContain('Timezone logic');

      // Should NOT contain timing or cache
      expect(output).not.toContain('mcp:timing');
      expect(output).not.toContain('mcp:cache');
    });
  });

  describe('Trace Namespace for Request Flow', () => {
    it('should show ONLY trace debug when DEBUG=mcp:trace', async () => {
      process.env.DEBUG = 'mcp:trace';

      const { debug } = await import('../../src/utils/debug');

      // Call various namespaces
      debug.trace('Tool execution started');
      debug.business('Business calculation');
      debug.timing('Time calculation');
      debug.error('Error occurred');

      const output = stderrOutput.join('');

      // Should contain trace output
      expect(output).toContain('mcp:trace');
      expect(output).toContain('Tool execution started');

      // Should NOT contain other namespaces
      expect(output).not.toContain('mcp:business');
      expect(output).not.toContain('mcp:timing');
      expect(output).not.toContain('mcp:error');
    });
  });

  describe('Error Namespace Isolation', () => {
    it('should show ONLY errors when DEBUG=mcp:error', async () => {
      process.env.DEBUG = 'mcp:error';

      const { debug } = await import('../../src/utils/debug');

      // Call various namespaces
      debug.error('Error in processing');
      debug.business('Normal business flow');
      debug.timing('Normal timing flow');
      debug.trace('Normal trace flow');

      const output = stderrOutput.join('');

      // Should contain error output
      expect(output).toContain('mcp:error');
      expect(output).toContain('Error in processing');

      // Should NOT contain normal flow namespaces
      expect(output).not.toContain('mcp:business');
      expect(output).not.toContain('mcp:timing');
      expect(output).not.toContain('mcp:trace');
    });
  });

  describe('Wildcard Patterns', () => {
    it('should show all namespaces with DEBUG=mcp:*', async () => {
      process.env.DEBUG = 'mcp:*';

      const { debug } = await import('../../src/utils/debug');

      // Call various namespaces
      debug.business('Business');
      debug.timezone('Timezone');
      debug.timing('Timing');
      debug.parse('Parse');
      debug.cache('Cache');
      debug.error('Error');
      debug.trace('Trace');

      const output = stderrOutput.join('');

      // Should contain ALL namespaces
      expect(output).toContain('mcp:business');
      expect(output).toContain('mcp:timezone');
      expect(output).toContain('mcp:timing');
      expect(output).toContain('mcp:parse');
      expect(output).toContain('mcp:cache');
      expect(output).toContain('mcp:error');
      expect(output).toContain('mcp:trace');
    });

    it('should show nothing when DEBUG is not set', async () => {
      delete process.env.DEBUG;

      const { debug } = await import('../../src/utils/debug');

      // Call various namespaces
      debug.business('Business');
      debug.timezone('Timezone');
      debug.timing('Timing');

      const output = stderrOutput.join('');

      // Should be empty
      expect(output).toBe('');
    });
  });

  describe('Migration Complete', () => {
    it('should NOT have debug.tools namespace anymore', async () => {
      const { debug } = await import('../../src/utils/debug');

      // The tools namespace should be undefined since migration is complete
      expect((debug as any).tools).toBeUndefined();

      // This test confirms that the migration away from debug.tools is complete
    });
  });
});
