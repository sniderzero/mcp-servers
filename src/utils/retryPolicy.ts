import { FaultType, classifyRestError } from "./errorHandler.js";

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onAuthExpired?: () => Promise<void>;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, "onAuthExpired">> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getFaultType(error: unknown): FaultType {
  if (error instanceof Error) {
    const anyErr = error as Error & { status?: number; statusCode?: number; code?: string };
    return classifyRestError({
      status: anyErr.status ?? anyErr.statusCode,
      code: anyErr.code,
    });
  }
  return FaultType.PERMANENT;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const maxRetries = options?.maxRetries ?? DEFAULT_OPTIONS.maxRetries;
  const baseDelayMs = options?.baseDelayMs ?? DEFAULT_OPTIONS.baseDelayMs;
  const maxDelayMs = options?.maxDelayMs ?? DEFAULT_OPTIONS.maxDelayMs;
  const onAuthExpired = options?.onAuthExpired;

  let authRetried = false;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const faultType = getFaultType(error);

      if (faultType === FaultType.PERMANENT) {
        throw error;
      }

      if (faultType === FaultType.AUTH_EXPIRED) {
        if (authRetried || !onAuthExpired) {
          throw error;
        }
        authRetried = true;
        process.stderr.write(`[workday-mcp] Auth expired, refreshing token...\n`);
        await onAuthExpired();
        // Retry once immediately after auth refresh
        continue;
      }

      // RETRYABLE
      if (attempt >= maxRetries) {
        throw error;
      }

      const backoffMs = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
      process.stderr.write(
        `[workday-mcp] Retryable error on attempt ${attempt + 1}/${maxRetries}, retrying in ${backoffMs}ms: ${error instanceof Error ? error.message : String(error)}\n`,
      );
      await delay(backoffMs);
    }
  }

  // Should never reach here
  throw new Error("withRetry: exhausted retries");
}
