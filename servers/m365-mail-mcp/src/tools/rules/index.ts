import { graphFetch } from "../../graph/client.js";
import type { TokenProvider } from "../../auth/types.js";

// ── Tool Definitions ──────────────────────────────────────────────────────────

export const RULES_TOOL_DEFINITIONS = [
  {
    name: "m365_mail_list_rules",
    description: "List inbox message rules.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "m365_mail_create_rule",
    description: "Create a new inbox message rule.",
    inputSchema: {
      type: "object" as const,
      properties: {
        displayName: { type: "string", description: "Name of the rule." },
        isEnabled: { type: "boolean", description: "Whether the rule is enabled. Defaults to true." },
        sequence: { type: "number", description: "Execution sequence order of the rule." },
        conditions: {
          type: "object",
          description: "Conditions that trigger the rule (e.g. {senderContains: ['boss@example.com']}).",
        },
        actions: {
          type: "object",
          description: "Actions to take when conditions are met (e.g. {moveToFolder: 'folderId', markAsRead: true}).",
        },
      },
      required: ["displayName", "conditions", "actions"],
    },
  },
  {
    name: "m365_mail_update_rule",
    description: "Update an existing inbox message rule.",
    inputSchema: {
      type: "object" as const,
      properties: {
        ruleId: { type: "string", description: "The ID of the rule to update." },
        displayName: { type: "string", description: "New name for the rule." },
        isEnabled: { type: "boolean", description: "Whether the rule is enabled." },
        sequence: { type: "number", description: "Execution sequence order." },
        conditions: { type: "object", description: "Updated conditions." },
        actions: { type: "object", description: "Updated actions." },
      },
      required: ["ruleId"],
    },
  },
  {
    name: "m365_mail_delete_rule",
    description: "Delete an inbox message rule.",
    inputSchema: {
      type: "object" as const,
      properties: {
        ruleId: { type: "string", description: "The ID of the rule to delete." },
      },
      required: ["ruleId"],
    },
  },
];

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function handleMailListRules(args: unknown, provider: TokenProvider): Promise<unknown> {
  return graphFetch("/me/mailFolders/inbox/messageRules", provider);
}

export async function handleMailCreateRule(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as {
    displayName: string;
    isEnabled?: boolean;
    sequence?: number;
    conditions: unknown;
    actions: unknown;
  };
  return graphFetch("/me/mailFolders/inbox/messageRules", provider, {
    method: "POST",
    body: JSON.stringify({
      displayName: a.displayName,
      isEnabled: a.isEnabled ?? true,
      sequence: a.sequence,
      conditions: a.conditions,
      actions: a.actions,
    }),
  });
}

export async function handleMailUpdateRule(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as {
    ruleId: string;
    displayName?: string;
    isEnabled?: boolean;
    sequence?: number;
    conditions?: unknown;
    actions?: unknown;
  };

  const body: Record<string, unknown> = {};
  if (a.displayName !== undefined) body.displayName = a.displayName;
  if (a.isEnabled !== undefined) body.isEnabled = a.isEnabled;
  if (a.sequence !== undefined) body.sequence = a.sequence;
  if (a.conditions !== undefined) body.conditions = a.conditions;
  if (a.actions !== undefined) body.actions = a.actions;

  return graphFetch(`/me/mailFolders/inbox/messageRules/${a.ruleId}`, provider, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function handleMailDeleteRule(args: unknown, provider: TokenProvider): Promise<unknown> {
  const a = args as { ruleId: string };
  await graphFetch(`/me/mailFolders/inbox/messageRules/${a.ruleId}`, provider, { method: "DELETE" });
  return { success: true };
}
