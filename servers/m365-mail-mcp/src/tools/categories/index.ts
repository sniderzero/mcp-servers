import { graphFetch } from "../../graph/client.js";
import type { TokenProvider } from "../../auth/types.js";

// ── Tool Definitions ──────────────────────────────────────────────────────────

export const CATEGORIES_TOOL_DEFINITIONS = [
  {
    name: "m365_mail_list_categories",
    description: "List the user's Outlook master categories.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "m365_mail_set_categories",
    description: "Set categories on an email message.",
    inputSchema: {
      type: "object" as const,
      properties: {
        messageId: { type: "string", description: "The ID of the message." },
        categories: {
          type: "array",
          items: { type: "string" },
          description: "List of category names to set on the message.",
        },
      },
      required: ["messageId", "categories"],
    },
  },
];

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function handleMailListCategories(args: unknown, provider: TokenProvider): Promise<unknown> {
  return graphFetch("/me/outlook/masterCategories", provider);
}

export async function handleMailSetCategories(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as { messageId: string; categories: string[] };
  return graphFetch(`/me/messages/${a.messageId}`, provider, {
    method: "PATCH",
    body: JSON.stringify({ categories: a.categories }),
  });
}
