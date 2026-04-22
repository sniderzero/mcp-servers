export class GreenhouseApiError extends Error {
  constructor(public readonly status: number, body: unknown, context?: string) {
    let message = context ? `${context}: HTTP ${status}` : `Greenhouse API error ${status}`;
    if (typeof body === "string") {
      try {
        const parsed = JSON.parse(body) as {
          message?: string;
          errors?: Array<{ field?: string; message: string }>;
        };
        if (parsed.errors?.length) {
          const detail = parsed.errors
            .map(e => (typeof e === "string" ? e : (e.field ? `${e.field}: ${e.message}` : e.message)))
            .join("; ");
          message = context ? `${context}: ${detail}` : detail;
        } else if (parsed.message) {
          message = context ? `${context}: ${parsed.message}` : parsed.message;
        }
      } catch { /* use default */ }
    } else if (Array.isArray(body)) {
      message = `${message}: ${JSON.stringify(body)}`;
    }
    super(message);
    this.name = "GreenhouseApiError";
  }
}
