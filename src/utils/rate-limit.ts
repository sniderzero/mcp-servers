export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, init);

    if (response.status === 429) {
      if (attempt < maxRetries) {
        const retryAfter = parseInt(response.headers.get("Retry-After") ?? "30", 10);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      return response;
    }

    const remaining = parseInt(response.headers.get("X-RateLimit-Remaining") ?? "999", 10);
    if (remaining <= 5) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return response;
  }
  throw new Error("Max retries exceeded");
}
