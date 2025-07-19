import { EventEmitter } from 'events';
import { configureServer, getMaxListenersConfig } from '../../src/utils/serverConfig';

describe('serverConfig', () => {
  let originalDefaultMaxListeners: number;
  let originalProcessMaxListeners: number;

  beforeEach(() => {
    // Save original values
    originalDefaultMaxListeners = EventEmitter.defaultMaxListeners;
    originalProcessMaxListeners = process.getMaxListeners();
  });

  afterEach(() => {
    // Restore original values
    EventEmitter.defaultMaxListeners = originalDefaultMaxListeners;
    process.setMaxListeners(originalProcessMaxListeners);
  });

  describe('configureServer', () => {
    it('should increase EventEmitter defaultMaxListeners to 20', () => {
      // Reset to default first
      EventEmitter.defaultMaxListeners = 10;

      configureServer();

      expect(EventEmitter.defaultMaxListeners).toBe(20);
    });

    it('should increase process maxListeners to 20', () => {
      // Reset to default first
      process.setMaxListeners(10);

      configureServer();

      expect(process.getMaxListeners()).toBe(20);
    });
  });

  describe('getMaxListenersConfig', () => {
    it('should return current configuration', () => {
      EventEmitter.defaultMaxListeners = 15;
      process.setMaxListeners(25);

      const config = getMaxListenersConfig();

      expect(config).toEqual({
        defaultMaxListeners: 15,
        processMaxListeners: 25,
      });
    });
  });

  describe('AbortSignal warning prevention', () => {
    it('should not emit warning with configured limits', () => {
      configureServer();

      const warnings: Error[] = [];
      const originalWarning = process.listeners('warning');

      process.removeAllListeners('warning');
      process.on('warning', (warning) => {
        warnings.push(warning);
      });

      try {
        // Create scenario that would trigger warning with default limits
        const abortController = new AbortController();
        const signal = abortController.signal;

        // Add 15 listeners (more than default 10, but less than our configured 20)
        for (let i = 0; i < 15; i++) {
          signal.addEventListener('abort', () => {});
        }

        // No warnings should be emitted
        const maxListenerWarnings = warnings.filter(
          (w) => w.name === 'MaxListenersExceededWarning',
        );

        expect(maxListenerWarnings).toHaveLength(0);
      } finally {
        process.removeAllListeners('warning');
        originalWarning.forEach((listener) => process.on('warning', listener));
      }
    });
  });
});
