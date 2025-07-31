import { SlidingWindowRateLimiter } from '../../src/utils/rateLimit';

describe('SlidingWindowRateLimiter Environment Variables', () => {
  // Save original env vars
  const originalRateLimit = process.env.RATE_LIMIT;
  const originalRateLimitWindow = process.env.RATE_LIMIT_WINDOW;

  afterEach(() => {
    // Restore original env vars
    if (originalRateLimit !== undefined) {
      process.env.RATE_LIMIT = originalRateLimit;
    } else {
      delete process.env.RATE_LIMIT;
    }

    if (originalRateLimitWindow !== undefined) {
      process.env.RATE_LIMIT_WINDOW = originalRateLimitWindow;
    } else {
      delete process.env.RATE_LIMIT_WINDOW;
    }
  });

  describe('environment variable handling', () => {
    it('should use environment variables when no constructor params provided', () => {
      process.env.RATE_LIMIT = '200';
      process.env.RATE_LIMIT_WINDOW = '120000';

      const rateLimiter = new SlidingWindowRateLimiter();
      const info = rateLimiter.getInfo();

      expect(info.limit).toBe(200);
      expect(info.window).toBe(120000);
    });

    it('should use defaults when environment variables are not set', () => {
      delete process.env.RATE_LIMIT;
      delete process.env.RATE_LIMIT_WINDOW;

      const rateLimiter = new SlidingWindowRateLimiter();
      const info = rateLimiter.getInfo();

      expect(info.limit).toBe(100);
      expect(info.window).toBe(60000);
    });

    it('should prefer constructor parameters over environment variables', () => {
      process.env.RATE_LIMIT = '200';
      process.env.RATE_LIMIT_WINDOW = '120000';

      const rateLimiter = new SlidingWindowRateLimiter(50, 30000);
      const info = rateLimiter.getInfo();

      expect(info.limit).toBe(50);
      expect(info.window).toBe(30000);
    });

    it('should handle invalid environment variable values gracefully', () => {
      process.env.RATE_LIMIT = 'invalid';
      process.env.RATE_LIMIT_WINDOW = 'notanumber';

      const rateLimiter = new SlidingWindowRateLimiter();
      const info = rateLimiter.getInfo();

      // Should fall back to defaults when parsing fails
      expect(info.limit).toBe(100);
      expect(info.window).toBe(60000);
    });

    it('should handle empty string environment variables', () => {
      process.env.RATE_LIMIT = '';
      process.env.RATE_LIMIT_WINDOW = '';

      const rateLimiter = new SlidingWindowRateLimiter();
      const info = rateLimiter.getInfo();

      // Empty strings should fall back to defaults
      expect(info.limit).toBe(100);
      expect(info.window).toBe(60000);
    });

    it('should handle negative values in environment variables', () => {
      process.env.RATE_LIMIT = '-50';
      process.env.RATE_LIMIT_WINDOW = '-30000';

      const rateLimiter = new SlidingWindowRateLimiter();
      const info = rateLimiter.getInfo();

      // Negative values should be rejected and fall back to defaults
      expect(info.limit).toBe(100);
      expect(info.window).toBe(60000);
    });

    it('should handle zero values in environment variables', () => {
      process.env.RATE_LIMIT = '0';
      process.env.RATE_LIMIT_WINDOW = '0';

      const rateLimiter = new SlidingWindowRateLimiter();
      const info = rateLimiter.getInfo();

      // Zero values should be rejected and fall back to defaults
      expect(info.limit).toBe(100);
      expect(info.window).toBe(60000);
    });

    it('should handle floating point values in environment variables', () => {
      process.env.RATE_LIMIT = '100.5';
      process.env.RATE_LIMIT_WINDOW = '60000.7';

      const rateLimiter = new SlidingWindowRateLimiter();
      const info = rateLimiter.getInfo();

      // parseInt should truncate to integers
      expect(info.limit).toBe(100);
      expect(info.window).toBe(60000);
    });
  });
});
