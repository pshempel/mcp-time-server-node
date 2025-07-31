/**
 * Sliding window rate limiter for MCP server
 * Tracks requests in a time window and enforces limits
 */
import { debug } from './debug';

export class SlidingWindowRateLimiter {
  private requests: number[] = [];
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit?: number, windowMs?: number) {
    // Default values
    const DEFAULT_LIMIT = 100;
    const DEFAULT_WINDOW_MS = 60000;

    // If constructor params provided, use them
    if (limit !== undefined) {
      this.limit = limit;
    } else {
      // Try to parse from environment
      const envLimit = process.env.RATE_LIMIT;
      if (envLimit) {
        const parsed = parseInt(envLimit, 10);
        // Validate parsed value
        if (!isNaN(parsed) && parsed > 0) {
          this.limit = parsed;
        } else {
          this.limit = DEFAULT_LIMIT;
        }
      } else {
        this.limit = DEFAULT_LIMIT;
      }
    }

    // Same logic for windowMs
    if (windowMs !== undefined) {
      this.windowMs = windowMs;
    } else {
      // Try to parse from environment
      const envWindow = process.env.RATE_LIMIT_WINDOW;
      if (envWindow) {
        const parsed = parseInt(envWindow, 10);
        // Validate parsed value
        if (!isNaN(parsed) && parsed > 0) {
          this.windowMs = parsed;
        } else {
          this.windowMs = DEFAULT_WINDOW_MS;
        }
      } else {
        this.windowMs = DEFAULT_WINDOW_MS;
      }
    }

    debug.rateLimit('Creating rate limiter - limit: %d, window: %dms', this.limit, this.windowMs);
  }

  /**
   * Check if a request is allowed under the rate limit
   * @returns true if allowed, false if rate limited
   */
  checkLimit(): boolean {
    const now = Date.now();
    this.cleanupOldRequests(now);

    if (this.requests.length >= this.limit) {
      debug.rateLimit(
        'Rate limit exceeded - usage: %d/%d, retry after: %ds',
        this.requests.length,
        this.limit,
        this.getRetryAfter(),
      );
      return false;
    }

    this.requests.push(now);
    debug.rateLimit('Request allowed - usage: %d/%d', this.requests.length, this.limit);
    return true;
  }

  /**
   * Get current usage count within the window
   */
  getCurrentUsage(): number {
    const now = Date.now();
    this.cleanupOldRequests(now);
    return this.requests.length;
  }

  /**
   * Get seconds until the rate limit resets
   * @returns seconds to wait, or 0 if under limit
   */
  getRetryAfter(): number {
    const now = Date.now();
    this.cleanupOldRequests(now);

    if (this.requests.length < this.limit) {
      return 0;
    }

    if (this.requests.length === 0) {
      return 0;
    }

    // Time until the oldest request expires
    const oldestRequest = this.requests[0];
    const expiresAt = oldestRequest + this.windowMs;
    const msToWait = expiresAt - now;

    return Math.ceil(msToWait / 1000);
  }

  /**
   * Reset the rate limiter, clearing all request history
   */
  reset(): void {
    this.requests = [];
  }

  /**
   * Get information about the current rate limit state
   */
  getInfo(): {
    limit: number;
    window: number;
    current: number;
    remaining: number;
    retryAfter: number;
  } {
    const current = this.getCurrentUsage();
    return {
      limit: this.limit,
      window: this.windowMs,
      current,
      remaining: Math.max(0, this.limit - current),
      retryAfter: this.getRetryAfter(),
    };
  }

  /**
   * Remove requests outside the current window
   */
  private cleanupOldRequests(now: number): void {
    const cutoff = now - this.windowMs;
    const oldCount = this.requests.length;
    this.requests = this.requests.filter((timestamp) => timestamp > cutoff);

    if (oldCount > this.requests.length) {
      debug.rateLimit('Cleaned up %d old requests', oldCount - this.requests.length);
    }
  }
}
