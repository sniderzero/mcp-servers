export class RateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number; // tokens per ms
  private lastRefill: number;
  private retryAfterTimestamp: number = 0;

  constructor(requestsPerSecond: number = 5) {
    this.maxTokens = requestsPerSecond;
    this.tokens = requestsPerSecond;
    this.refillRate = requestsPerSecond / 1000;
    this.lastRefill = Date.now();
  }

  async waitIfNeeded(): Promise<void> {
    if (this.retryAfterTimestamp > Date.now()) {
      const waitMs = this.retryAfterTimestamp - Date.now();
      await this.sleep(waitMs);
    }

    this.refill();
    if (this.tokens < 1) {
      const waitMs = (1 - this.tokens) / this.refillRate;
      await this.sleep(waitMs);
      this.refill();
    }
    this.tokens -= 1;
  }

  markRateLimited(retryAfterSeconds: number): void {
    this.retryAfterTimestamp = Date.now() + retryAfterSeconds * 1000;
    this.tokens = 0;
  }

  updateFromHeaders(headers: Headers): void {
    const remaining = headers.get("X-Rate-Limit-Remaining");
    const reset = headers.get("X-Rate-Limit-Reset");

    if (remaining !== null) {
      const rem = parseInt(remaining, 10);
      if (rem < this.tokens) {
        this.tokens = rem;
      }
    }

    if (reset !== null) {
      const resetTime = new Date(reset).getTime();
      if (resetTime > Date.now() && remaining !== null && parseInt(remaining, 10) === 0) {
        this.retryAfterTimestamp = resetTime;
      }
    }
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
