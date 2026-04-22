export type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

export function ok(data: unknown): ToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

export function err(message: string): ToolResult {
  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}

function formatGraphError(error: unknown): string {
  if (error instanceof Error) {
    const e = error as Error & {
      statusCode?: number;
      code?: string;
      body?: string;
    };

    if (e.statusCode !== undefined) {
      switch (e.statusCode) {
        case 401:
          return (
            `Authentication error (401): ${e.message}\n` +
            `To re-authenticate, delete ~/.m365-mcp/token-cache.json and retry.`
          );
        case 403:
          return (
            `Permission denied (403): ${e.message}\n` +
            `The Azure App Registration may need additional API permissions.`
          );
        case 404:
          return `Not found (404): ${e.message}`;
        case 429:
          return (
            `Rate limited (429): Microsoft Graph is throttling requests.\n` +
            `Wait a moment and retry.`
          );
        case 503:
          return `Service unavailable (503): Microsoft 365 service is temporarily unavailable.`;
        default:
          return `Graph API error (${e.statusCode})${e.code ? ` [${e.code}]` : ""}: ${e.message}`;
      }
    }

    return `Error: ${e.message}`;
  }

  return `Unexpected error: ${String(error)}`;
}

export async function handleApiCall<T>(fn: () => Promise<T>): Promise<ToolResult> {
  try {
    const result = await fn();
    return ok(result);
  } catch (error) {
    return err(formatGraphError(error));
  }
}
