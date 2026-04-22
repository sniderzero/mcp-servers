export class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefillTime: number;

  constructor(
    private readonly maxTokens: number = 10,
    private readonly refillRate: number = 8,
    private readonly refillIntervalMs: number = 1000,
  ) {
    this.tokens = maxTokens;
    this.lastRefillTime = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefillTime;
    const tokensToAdd = (elapsed / this.refillIntervalMs) * this.refillRate;
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefillTime = now;
  }

  async acquire(): Promise<void> {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }
    // Wait until one token is available
    const msPerToken = this.refillIntervalMs / this.refillRate;
    const waitMs = Math.ceil((1 - this.tokens) * msPerToken);
    await new Promise<void>((resolve) => setTimeout(resolve, waitMs));
    this.refill();
    this.tokens -= 1;
  }

  async backoffOn429(retryAfterMs?: number): Promise<void> {
    // Drain the bucket so subsequent calls must wait for refill
    this.tokens = 0;
    const waitMs = retryAfterMs ?? this.refillIntervalMs * 2;
    await new Promise<void>((resolve) => setTimeout(resolve, waitMs));
    this.refill();
  }
}

export function createRateLimiter(): TokenBucketRateLimiter {
  return new TokenBucketRateLimiter();
}
