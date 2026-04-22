const BUDGET_PER_MINUTE = 400;
const MIN_INTERVAL_MS = Math.ceil(60_000 / BUDGET_PER_MINUTE); // ~150ms

export class RateLimiter {
  private remaining: number = BUDGET_PER_MINUTE;
  private retryAfterTimestamp: number = 0;
  private backoffMs: number = 1_000;
  private lastRequestTime: number = 0;

  updateFromHeaders(headers: Headers): void {
    const remaining = headers.get("x-rate-limit-remaining") ?? headers.get("x-ratelimit-remaining");
    if (remaining !== null) {
      this.remaining = parseInt(remaining, 10);
      this.backoffMs = 1_000; // reset backoff on successful response
    }
  }

  async waitIfNeeded(): Promise<void> {
    // Honour retry-after from 429
    if (this.retryAfterTimestamp > Date.now()) {
      const waitMs = this.retryAfterTimestamp - Date.now();
      await this.sleep(waitMs);
      return;
    }

    // Basic per-minute budget throttle
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < MIN_INTERVAL_MS) {
      await this.sleep(MIN_INTERVAL_MS - elapsed);
    }

    // If remaining is low, slow down
    if (this.remaining < BUDGET_PER_MINUTE * 0.1) {
      const delayMs = Math.min(2_000, Math.max(200, (1 - this.remaining / BUDGET_PER_MINUTE) * 3_000));
      await this.sleep(delayMs);
    }

    this.lastRequestTime = Date.now();
  }

  markRateLimited(retryAfterSeconds: number): void {
    // Exponential backoff: double each time, cap at 30s
    this.backoffMs = Math.min(this.backoffMs * 2, 30_000);
    const waitSeconds = Math.max(retryAfterSeconds, this.backoffMs / 1_000);
    this.retryAfterTimestamp = Date.now() + waitSeconds * 1_000;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
