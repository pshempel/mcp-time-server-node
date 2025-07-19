import { SlidingWindowRateLimiter } from '../../src/utils/rateLimit';

describe('SlidingWindowRateLimiter', () => {
  let rateLimiter: SlidingWindowRateLimiter;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should create rate limiter with default values', () => {
      rateLimiter = new SlidingWindowRateLimiter();
      expect(rateLimiter).toBeDefined();
      // Default: 100 requests per 60000ms (1 minute)
    });

    it('should create rate limiter with custom values', () => {
      rateLimiter = new SlidingWindowRateLimiter(50, 30000);
      expect(rateLimiter).toBeDefined();
      // Custom: 50 requests per 30000ms (30 seconds)
    });

    it('should read from environment variables', () => {
      process.env.RATE_LIMIT = '200';
      process.env.RATE_LIMIT_WINDOW = '120000';

      rateLimiter = new SlidingWindowRateLimiter();
      // Should use 200 requests per 120000ms (2 minutes)

      delete process.env.RATE_LIMIT;
      delete process.env.RATE_LIMIT_WINDOW;
    });
  });

  describe('checkLimit', () => {
    beforeEach(() => {
      rateLimiter = new SlidingWindowRateLimiter(5, 10000); // 5 requests per 10 seconds
      jest.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    });

    it('should allow requests under the limit', () => {
      expect(rateLimiter.checkLimit()).toBe(true);
      expect(rateLimiter.checkLimit()).toBe(true);
      expect(rateLimiter.checkLimit()).toBe(true);
      expect(rateLimiter.checkLimit()).toBe(true);
      expect(rateLimiter.checkLimit()).toBe(true);
    });

    it('should deny requests over the limit', () => {
      // Use up all 5 requests
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.checkLimit()).toBe(true);
      }

      // 6th request should be denied
      expect(rateLimiter.checkLimit()).toBe(false);
    });

    it('should allow requests after window expires', () => {
      // Use up all 5 requests
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkLimit();
      }

      // Should be denied
      expect(rateLimiter.checkLimit()).toBe(false);

      // Move time forward 11 seconds (past the 10 second window)
      jest.advanceTimersByTime(11000);

      // Should be allowed again
      expect(rateLimiter.checkLimit()).toBe(true);
    });

    it('should use sliding window algorithm', () => {
      // Make 3 requests
      rateLimiter.checkLimit();
      rateLimiter.checkLimit();
      rateLimiter.checkLimit();

      // Move forward 5 seconds
      jest.advanceTimersByTime(5000);

      // Make 2 more requests (total 5)
      rateLimiter.checkLimit();
      rateLimiter.checkLimit();

      // Should be denied (at limit)
      expect(rateLimiter.checkLimit()).toBe(false);

      // Move forward 6 seconds (11 seconds total from start)
      jest.advanceTimersByTime(6000);

      // First 3 requests are now outside window
      // Should allow 3 more requests
      expect(rateLimiter.checkLimit()).toBe(true);
      expect(rateLimiter.checkLimit()).toBe(true);
      expect(rateLimiter.checkLimit()).toBe(true);

      // But not a 4th (since we still have 2 in the window)
      expect(rateLimiter.checkLimit()).toBe(false);
    });
  });

  describe('getCurrentUsage', () => {
    beforeEach(() => {
      rateLimiter = new SlidingWindowRateLimiter(10, 60000);
      jest.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    });

    it('should return current usage count', () => {
      expect(rateLimiter.getCurrentUsage()).toBe(0);

      rateLimiter.checkLimit();
      expect(rateLimiter.getCurrentUsage()).toBe(1);

      rateLimiter.checkLimit();
      rateLimiter.checkLimit();
      expect(rateLimiter.getCurrentUsage()).toBe(3);
    });

    it('should exclude expired requests from count', () => {
      rateLimiter.checkLimit();
      rateLimiter.checkLimit();
      expect(rateLimiter.getCurrentUsage()).toBe(2);

      // Move forward past window
      jest.advanceTimersByTime(61000);

      expect(rateLimiter.getCurrentUsage()).toBe(0);
    });
  });

  describe('getRetryAfter', () => {
    beforeEach(() => {
      rateLimiter = new SlidingWindowRateLimiter(3, 10000); // 3 per 10 seconds
      jest.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    });

    it('should return 0 when under limit', () => {
      rateLimiter.checkLimit();
      expect(rateLimiter.getRetryAfter()).toBe(0);
    });

    it('should return time until oldest request expires', () => {
      // Use up all requests
      rateLimiter.checkLimit(); // at 0ms
      jest.advanceTimersByTime(2000);
      rateLimiter.checkLimit(); // at 2000ms
      jest.advanceTimersByTime(1000);
      rateLimiter.checkLimit(); // at 3000ms

      // Now at limit
      expect(rateLimiter.checkLimit()).toBe(false);

      // Oldest request at 0ms, current time 3000ms
      // Expires at 10000ms, so 7000ms to wait
      expect(rateLimiter.getRetryAfter()).toBe(7);
    });

    it('should handle edge case of no requests', () => {
      expect(rateLimiter.getRetryAfter()).toBe(0);
    });
  });

  describe('reset', () => {
    beforeEach(() => {
      rateLimiter = new SlidingWindowRateLimiter(5, 10000);
    });

    it('should clear all request history', () => {
      rateLimiter.checkLimit();
      rateLimiter.checkLimit();
      rateLimiter.checkLimit();

      expect(rateLimiter.getCurrentUsage()).toBe(3);

      rateLimiter.reset();

      expect(rateLimiter.getCurrentUsage()).toBe(0);
      expect(rateLimiter.checkLimit()).toBe(true);
    });
  });

  describe('memory management', () => {
    it('should clean up old timestamps automatically', () => {
      rateLimiter = new SlidingWindowRateLimiter(1000, 60000);
      jest.setSystemTime(new Date('2025-01-01T00:00:00Z'));

      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        rateLimiter.checkLimit();
      }

      expect(rateLimiter.getCurrentUsage()).toBe(100);

      // Move forward past window
      jest.advanceTimersByTime(61000);

      // Make one more request to trigger cleanup
      rateLimiter.checkLimit();

      // Should only have 1 request in memory
      expect(rateLimiter.getCurrentUsage()).toBe(1);
    });
  });

  describe('getInfo', () => {
    beforeEach(() => {
      rateLimiter = new SlidingWindowRateLimiter(10, 60000);
      jest.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    });

    it('should return rate limiter information', () => {
      rateLimiter.checkLimit();
      rateLimiter.checkLimit();
      rateLimiter.checkLimit();

      const info = rateLimiter.getInfo();

      expect(info).toEqual({
        limit: 10,
        window: 60000,
        current: 3,
        remaining: 7,
        retryAfter: 0,
      });
    });

    it('should show retry after when at limit', () => {
      // Use up all 10 requests
      for (let i = 0; i < 10; i++) {
        rateLimiter.checkLimit();
      }

      const info = rateLimiter.getInfo();

      expect(info).toEqual({
        limit: 10,
        window: 60000,
        current: 10,
        remaining: 0,
        retryAfter: 60,
      });
    });
  });
});
