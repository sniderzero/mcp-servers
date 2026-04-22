import { graphFetch } from "../../graph/client.js";
import type { TokenProvider } from "../../auth/types.js";

// ── Tool Definitions ──────────────────────────────────────────────────────────

export const SETTINGS_TOOL_DEFINITIONS = [
  {
    name: "m365_mail_get_settings",
    description: "Get the user's mailbox settings (automatic replies, timezone, language, etc.).",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
];

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function handleMailGetSettings(args: unknown, provider: TokenProvider): Promise<unknown> {
  return graphFetch("/me/mailboxSettings", provider);
}
