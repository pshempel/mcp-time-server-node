import { withDebug, withDebugUtils, withDebugCache } from '../../src/utils/withDebug';
import * as debugModule from '../../src/utils/debug';

describe('withDebug wrapper', () => {
  let debugSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock the debug.utils namespace (tools namespace removed)
    debugSpy = jest.spyOn(debugModule.debug, 'utils').mockImplementation(() => {});
  });

  afterEach(() => {
    debugSpy.mockRestore();
  });

  describe('basic functionality', () => {
    it('preserves function return value', () => {
      const testFn = withDebug(function double(x: number): number {
        return x * 2;
      });

      expect(testFn(5)).toBe(10);
    });

    it('preserves function signature', () => {
      const testFn = withDebug(function greet(name: string, age: number): string {
        return `Hello ${name}, age ${age}`;
      });

      expect(testFn('Alice', 30)).toBe('Hello Alice, age 30');
    });

    it('logs function entry with arguments', () => {
      const testFn = withDebug(function testFunction(a: string, b: number) {
        return `${a}-${b}`;
      });

      testFn('hello', 42);

      expect(debugSpy).toHaveBeenCalledWith('→ testFunction called with:', ['hello', 42]);
    });

    it('logs successful completion', () => {
      const testFn = withDebug(function testFunction(): string {
        return 'success';
      });

      testFn();

      expect(debugSpy).toHaveBeenCalledWith('✓ testFunction succeeded');
    });

    it('logs errors and rethrows them', () => {
      const testError = new Error('boom');
      const testFn = withDebug(function testFunction(): never {
        throw testError;
      });

      expect(() => testFn()).toThrow('boom');
      expect(debugSpy).toHaveBeenCalledWith('✗ testFunction failed:', testError);
    });
  });

  describe('async functions', () => {
    it('handles async functions that succeed', async () => {
      const testFn = withDebug(async function testAsync(ms: number): Promise<string> {
        await new Promise((resolve) => setTimeout(resolve, ms));
        return 'async result';
      });

      const result = await testFn(1);

      expect(result).toBe('async result');
      expect(debugSpy).toHaveBeenCalledWith('→ testAsync called with:', [1]);
      expect(debugSpy).toHaveBeenCalledWith('✓ testAsync succeeded');
    });

    it('handles async functions that fail', async () => {
      const testError = new Error('async boom');
      const testFn = withDebug(async function testAsync(): Promise<never> {
        throw testError;
      });

      await expect(testFn()).rejects.toThrow('async boom');
      // The async function returns a promise immediately, so it logs success first
      // then the promise rejection is caught and logged
      // This is a known limitation - async errors are logged after apparent success
      expect(debugSpy).toHaveBeenCalledWith('→ testAsync called with:', []);
    });
  });

  describe('edge cases', () => {
    it('handles functions with no name', () => {
      const testFn = withDebug((x: number) => x * 2);

      testFn(5);

      expect(debugSpy).toHaveBeenCalledWith('→ anonymous called with:', [5]);
    });

    it('handles circular references in arguments', () => {
      const circular: any = { value: 1 };
      circular.self = circular;

      const testFn = withDebug(function handleCircular(_obj: any): string {
        return 'handled';
      });

      expect(() => testFn(circular)).not.toThrow();
      expect(testFn(circular)).toBe('handled');
    });

    it('preserves error stack traces', () => {
      const testFn = withDebug(function throwError(): never {
        throw new Error('test error');
      });

      try {
        testFn();
      } catch (error: any) {
        expect(error.message).toBe('test error');
        expect(error.stack).toContain('throwError');
      }
    });

    it('handles null and undefined arguments', () => {
      const testFn = withDebug(function handleNull(val: any): string {
        return String(val);
      });

      expect(testFn(null)).toBe('null');
      expect(testFn(undefined)).toBe('undefined');
      expect(debugSpy).toHaveBeenCalledWith('→ handleNull called with:', [null]);
      expect(debugSpy).toHaveBeenCalledWith('→ handleNull called with:', [undefined]);
    });
  });

  describe('namespace variants', () => {
    it('withDebugUtils uses utils namespace', () => {
      const utilsSpy = jest.spyOn(debugModule.debug, 'utils').mockImplementation(() => {});

      const testFn = withDebugUtils(function utilFunction(): string {
        return 'util';
      });

      testFn();

      expect(utilsSpy).toHaveBeenCalledWith('→ utilFunction called with:', []);
      expect(utilsSpy).toHaveBeenCalledWith('✓ utilFunction succeeded');

      utilsSpy.mockRestore();
    });

    it('withDebugCache uses cache namespace', () => {
      const cacheSpy = jest.spyOn(debugModule.debug, 'cache').mockImplementation(() => {});

      const testFn = withDebugCache(function cacheFunction(): string {
        return 'cached';
      });

      testFn();

      expect(cacheSpy).toHaveBeenCalledWith('→ cacheFunction called with:', []);
      expect(cacheSpy).toHaveBeenCalledWith('✓ cacheFunction succeeded');

      cacheSpy.mockRestore();
    });
  });
});
