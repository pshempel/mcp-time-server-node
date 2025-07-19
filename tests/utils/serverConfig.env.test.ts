import { EventEmitter } from 'events';
import { configureServer, getMaxListenersConfig } from '../../src/utils/serverConfig';

describe('serverConfig environment variable support', () => {
  const originalEnv = process.env;
  const originalDefaultMaxListeners = EventEmitter.defaultMaxListeners;
  const originalProcessMaxListeners = process.getMaxListeners();

  beforeEach(() => {
    // Reset to defaults before each test
    EventEmitter.defaultMaxListeners = 10;
    process.setMaxListeners(10);
    // Clear module cache to ensure fresh import
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original values
    process.env = originalEnv;
    EventEmitter.defaultMaxListeners = originalDefaultMaxListeners;
    process.setMaxListeners(originalProcessMaxListeners);
  });

  describe('MAX_LISTENERS environment variable', () => {
    test('should use MAX_LISTENERS from environment when set', () => {
      // Arrange
      process.env.MAX_LISTENERS = '30';

      // Act
      configureServer();

      // Assert
      const config = getMaxListenersConfig();
      expect(config.defaultMaxListeners).toBe(30);
      expect(config.processMaxListeners).toBe(30);
    });

    test('should use default value (20) when MAX_LISTENERS not set', () => {
      // Arrange
      delete process.env.MAX_LISTENERS;

      // Act
      configureServer();

      // Assert
      const config = getMaxListenersConfig();
      expect(config.defaultMaxListeners).toBe(20);
      expect(config.processMaxListeners).toBe(20);
    });

    test('should handle invalid MAX_LISTENERS gracefully', () => {
      // Arrange
      process.env.MAX_LISTENERS = 'invalid';

      // Act
      configureServer();

      // Assert - should fall back to default
      const config = getMaxListenersConfig();
      expect(config.defaultMaxListeners).toBe(20);
      expect(config.processMaxListeners).toBe(20);
    });

    test('should enforce minimum value of 10', () => {
      // Arrange
      process.env.MAX_LISTENERS = '5';

      // Act
      configureServer();

      // Assert - should use minimum of 10
      const config = getMaxListenersConfig();
      expect(config.defaultMaxListeners).toBe(10);
      expect(config.processMaxListeners).toBe(10);
    });

    test('should handle very large values', () => {
      // Arrange
      process.env.MAX_LISTENERS = '100';

      // Act
      configureServer();

      // Assert
      const config = getMaxListenersConfig();
      expect(config.defaultMaxListeners).toBe(100);
      expect(config.processMaxListeners).toBe(100);
    });

    test('should handle zero as invalid and use default', () => {
      // Arrange
      process.env.MAX_LISTENERS = '0';

      // Act
      configureServer();

      // Assert
      const config = getMaxListenersConfig();
      expect(config.defaultMaxListeners).toBe(20);
      expect(config.processMaxListeners).toBe(20);
    });

    test('should handle negative values as invalid', () => {
      // Arrange
      process.env.MAX_LISTENERS = '-10';

      // Act
      configureServer();

      // Assert
      const config = getMaxListenersConfig();
      expect(config.defaultMaxListeners).toBe(20);
      expect(config.processMaxListeners).toBe(20);
    });

    test('should parse decimal values as integers', () => {
      // Arrange
      process.env.MAX_LISTENERS = '25.7';

      // Act
      configureServer();

      // Assert
      const config = getMaxListenersConfig();
      expect(config.defaultMaxListeners).toBe(25);
      expect(config.processMaxListeners).toBe(25);
    });
  });
});
