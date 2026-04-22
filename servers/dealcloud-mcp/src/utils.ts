import { DealCloudApiError } from "./client.js";

type CallToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

export async function handleApiCall<T>(fn: () => Promise<T>): Promise<CallToolResult> {
  try {
    const result = await fn();
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    if (error instanceof DealCloudApiError) {
      return {
        content: [{ type: "text", text: `DealCloud API Error (${error.statusCode}): ${error.message}` }],
        isError: true,
      };
    }
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}
