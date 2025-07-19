/**
 * Sliding window rate limiter for MCP server
 * Tracks requests in a time window and enforces limits
 */
export class SlidingWindowRateLimiter {
  private requests: number[] = [];
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit?: number, windowMs?: number) {
    // Read from environment or use defaults
    this.limit = limit ?? parseInt(process.env.RATE_LIMIT ?? '100', 10);
    this.windowMs = windowMs ?? parseInt(process.env.RATE_LIMIT_WINDOW ?? '60000', 10);
  }

  /**
   * Check if a request is allowed under the rate limit
   * @returns true if allowed, false if rate limited
   */
  checkLimit(): boolean {
    const now = Date.now();
    this.cleanupOldRequests(now);

    if (this.requests.length >= this.limit) {
      return false;
    }

    this.requests.push(now);
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
    this.requests = this.requests.filter((timestamp) => timestamp > cutoff);
  }
}
