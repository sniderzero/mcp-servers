export class RateLimiter {
  private remaining: number = Infinity;
  private total: number = Infinity;
  private retryAfter: number = 0;
  private retryAfterTimestamp: number = 0;

  updateFromHeaders(headers: Headers): void {
    const remaining = headers.get("x-ratelimit-remaining");
    const total = headers.get("x-ratelimit-total");
    const retryAfter = headers.get("retry-after");

    if (remaining !== null) this.remaining = parseInt(remaining, 10);
    if (total !== null) this.total = parseInt(total, 10);
    if (retryAfter !== null) {
      this.retryAfter = parseInt(retryAfter, 10);
      this.retryAfterTimestamp = Date.now() + this.retryAfter * 1000;
    }
  }

  async waitIfNeeded(): Promise<void> {
    // If we got a 429, wait for retry-after period
    if (this.retryAfterTimestamp > Date.now()) {
      const waitMs = this.retryAfterTimestamp - Date.now();
      await this.sleep(waitMs);
      return;
    }

    // If remaining is below 10% of total, add a delay
    if (this.total !== Infinity && this.remaining < this.total * 0.1) {
      const delayMs = Math.min(2000, Math.max(200, (1 - this.remaining / this.total) * 3000));
      await this.sleep(delayMs);
    }
  }

  markRateLimited(retryAfterSeconds: number): void {
    this.retryAfter = retryAfterSeconds;
    this.retryAfterTimestamp = Date.now() + retryAfterSeconds * 1000;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
