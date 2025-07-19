import { getConfig, resetConfigCache } from '../../src/utils/config';
import { getTimezoneOffset } from 'date-fns-tz';

// Mock date-fns-tz
jest.mock('date-fns-tz', () => ({
  getTimezoneOffset: jest.fn(),
}));

const mockedGetTimezoneOffset = getTimezoneOffset as jest.MockedFunction<typeof getTimezoneOffset>;

describe('TimeServerConfig', () => {
  // Save original env vars
  const originalEnv = process.env;
  const originalTZ = process.env.TZ;
  const originalDefaultTimezone = process.env.DEFAULT_TIMEZONE;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
    delete process.env.TZ;
    delete process.env.DEFAULT_TIMEZONE;

    // Reset mocks
    jest.clearAllMocks();

    // Mock timezone validation - valid timezones return a number, invalid return NaN
    mockedGetTimezoneOffset.mockImplementation((tz: string) => {
      const validTimezones = [
        'UTC',
        'America/New_York',
        'Asia/Tokyo',
        'Europe/London',
        'America/Indianapolis',
      ];
      if (validTimezones.includes(tz) || tz === '') {
        return 0; // Simplified - just return 0 for valid
      }
      return NaN; // Invalid timezone
    });

    // Reset config cache
    resetConfigCache();
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
    if (originalTZ !== undefined) {
      process.env.TZ = originalTZ;
    }
    if (originalDefaultTimezone !== undefined) {
      process.env.DEFAULT_TIMEZONE = originalDefaultTimezone;
    }
  });

  describe('System timezone detection', () => {
    it('should detect system timezone when no environment variables are set', () => {
      // Mock Intl.DateTimeFormat
      const mockResolvedOptions = jest.fn().mockReturnValue({ timeZone: 'America/Indianapolis' });
      global.Intl.DateTimeFormat = jest.fn().mockImplementation(() => ({
        resolvedOptions: mockResolvedOptions,
      })) as any;

      const config = getConfig();
      expect(config.defaultTimezone).toBe('America/Indianapolis');
    });

    it('should fall back to UTC if system timezone is invalid', () => {
      // Mock invalid system timezone
      const mockResolvedOptions = jest.fn().mockReturnValue({ timeZone: 'Invalid/Zone' });
      global.Intl.DateTimeFormat = jest.fn().mockImplementation(() => ({
        resolvedOptions: mockResolvedOptions,
      })) as any;

      const config = getConfig();
      expect(config.defaultTimezone).toBe('UTC');
    });

    it('should handle missing Intl.DateTimeFormat gracefully', () => {
      // Mock missing Intl
      const originalIntl = global.Intl;
      (global as any).Intl = undefined;

      const config = getConfig();
      expect(config.defaultTimezone).toBe('UTC');

      // Restore
      global.Intl = originalIntl;
    });
  });

  describe('Environment variable precedence', () => {
    it('should use DEFAULT_TIMEZONE when set and valid', () => {
      process.env.DEFAULT_TIMEZONE = 'America/New_York';

      const mockResolvedOptions = jest.fn().mockReturnValue({ timeZone: 'America/Indianapolis' });
      global.Intl.DateTimeFormat = jest.fn().mockImplementation(() => ({
        resolvedOptions: mockResolvedOptions,
      })) as any;

      const config = getConfig();
      expect(config.defaultTimezone).toBe('America/New_York');
    });

    it('should ignore DEFAULT_TIMEZONE if invalid', () => {
      process.env.DEFAULT_TIMEZONE = 'Invalid/Zone';

      const mockResolvedOptions = jest.fn().mockReturnValue({ timeZone: 'America/Indianapolis' });
      global.Intl.DateTimeFormat = jest.fn().mockImplementation(() => ({
        resolvedOptions: mockResolvedOptions,
      })) as any;

      const config = getConfig();
      expect(config.defaultTimezone).toBe('America/Indianapolis');
    });

    it('should ignore empty DEFAULT_TIMEZONE', () => {
      process.env.DEFAULT_TIMEZONE = '';

      const mockResolvedOptions = jest.fn().mockReturnValue({ timeZone: 'America/Indianapolis' });
      global.Intl.DateTimeFormat = jest.fn().mockImplementation(() => ({
        resolvedOptions: mockResolvedOptions,
      })) as any;

      const config = getConfig();
      expect(config.defaultTimezone).toBe('America/Indianapolis');
    });

    it('should respect TZ environment variable through Intl.DateTimeFormat', () => {
      // When TZ is set, Intl.DateTimeFormat returns it
      process.env.TZ = 'Asia/Tokyo';

      const mockResolvedOptions = jest.fn().mockReturnValue({ timeZone: 'Asia/Tokyo' });
      global.Intl.DateTimeFormat = jest.fn().mockImplementation(() => ({
        resolvedOptions: mockResolvedOptions,
      })) as any;

      const config = getConfig();
      expect(config.defaultTimezone).toBe('Asia/Tokyo');
    });

    it('should prioritize DEFAULT_TIMEZONE over TZ', () => {
      process.env.DEFAULT_TIMEZONE = 'Europe/London';
      process.env.TZ = 'Asia/Tokyo';

      const mockResolvedOptions = jest.fn().mockReturnValue({ timeZone: 'Asia/Tokyo' });
      global.Intl.DateTimeFormat = jest.fn().mockImplementation(() => ({
        resolvedOptions: mockResolvedOptions,
      })) as any;

      const config = getConfig();
      expect(config.defaultTimezone).toBe('Europe/London');
    });
  });

  describe('Caching behavior', () => {
    it('should cache the configuration', () => {
      const mockResolvedOptions = jest.fn().mockReturnValue({ timeZone: 'America/Indianapolis' });
      global.Intl.DateTimeFormat = jest.fn().mockImplementation(() => ({
        resolvedOptions: mockResolvedOptions,
      })) as any;

      // First call
      const config1 = getConfig();
      expect(config1.defaultTimezone).toBe('America/Indianapolis');
      expect(mockResolvedOptions).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const config2 = getConfig();
      expect(config2).toBe(config1); // Same object reference
      expect(mockResolvedOptions).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should allow cache reset', () => {
      const mockResolvedOptions = jest.fn().mockReturnValue({ timeZone: 'America/Indianapolis' });
      global.Intl.DateTimeFormat = jest.fn().mockImplementation(() => ({
        resolvedOptions: mockResolvedOptions,
      })) as any;

      // First call
      const config1 = getConfig();

      // Change environment
      process.env.DEFAULT_TIMEZONE = 'UTC';

      // Without reset, should still return cached
      const config2 = getConfig();
      expect(config2).toBe(config1);

      // After reset, should recompute
      resetConfigCache();
      const config3 = getConfig();
      expect(config3).not.toBe(config1);
      expect(config3.defaultTimezone).toBe('UTC');
    });
  });

  describe('Edge cases', () => {
    it('should handle Intl.DateTimeFormat throwing an error', () => {
      global.Intl.DateTimeFormat = jest.fn().mockImplementation(() => {
        throw new Error('DateTimeFormat error');
      }) as any;

      const config = getConfig();
      expect(config.defaultTimezone).toBe('UTC');
    });

    it('should handle resolvedOptions() throwing an error', () => {
      const mockResolvedOptions = jest.fn().mockImplementation(() => {
        throw new Error('resolvedOptions error');
      });
      global.Intl.DateTimeFormat = jest.fn().mockImplementation(() => ({
        resolvedOptions: mockResolvedOptions,
      })) as any;

      const config = getConfig();
      expect(config.defaultTimezone).toBe('UTC');
    });

    it('should handle unusual but valid timezone strings', () => {
      // Based on our research, these are technically valid
      mockedGetTimezoneOffset.mockImplementation((tz: string) => {
        if (tz === 'undefined' || tz === 'null') {
          return 0; // These weird strings are valid
        }
        return NaN;
      });

      process.env.DEFAULT_TIMEZONE = 'undefined';
      const config = getConfig();
      expect(config.defaultTimezone).toBe('undefined'); // Weird but valid
    });
  });

  describe('Configuration object', () => {
    it('should return a complete TimeServerConfig object', () => {
      const config = getConfig();
      expect(config).toHaveProperty('defaultTimezone');
      expect(typeof config.defaultTimezone).toBe('string');
    });

    it('should be immutable', () => {
      const config = getConfig();

      // Attempt to modify should throw
      expect(() => {
        (config as any).defaultTimezone = 'Modified';
      }).toThrow(TypeError);

      // Verify it's still the same
      expect(config.defaultTimezone).not.toBe('Modified');
    });
  });
});
