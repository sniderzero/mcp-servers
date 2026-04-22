import { type Tool } from "@modelcontextprotocol/sdk/types.js";
import { EvisortClient } from "../api/client.js";
import { fieldToolDefinitions, fieldToolHandlers } from "./fieldTools.js";
import { documentToolDefinitions, documentToolHandlers } from "./documentTools.js";
import { workflowToolDefinitions, workflowToolHandlers } from "./workflowTools.js";
import { ticketToolDefinitions, ticketToolHandlers } from "./ticketTools.js";
import { adminToolDefinitions, adminToolHandlers } from "./adminTools.js";
import { auditToolDefinitions, auditToolHandlers } from "./auditTools.js";

export const ALL_TOOL_DEFINITIONS: Tool[] = [
  ...fieldToolDefinitions,
  ...documentToolDefinitions,
  ...workflowToolDefinitions,
  ...ticketToolDefinitions,
  ...adminToolDefinitions,
  ...auditToolDefinitions,
];

export const TOOL_HANDLERS: Record<
  string,
  (client: EvisortClient, args: Record<string, unknown>) => Promise<unknown>
> = {
  ...fieldToolHandlers,
  ...documentToolHandlers,
  ...workflowToolHandlers,
  ...ticketToolHandlers,
  ...adminToolHandlers,
  ...auditToolHandlers,
};

const WRITE_TOOLS = new Set([
  "evisort_create_provisions",
  "evisort_upload_document",
  "evisort_upload_version",
  "evisort_update_document",
  "evisort_delete_document",
  "evisort_update_field_options",
  "evisort_create_ticket",
  "evisort_update_ticket",
  "evisort_advance_ticket",
  "evisort_complete_ticket",
  "evisort_cancel_ticket",
  "evisort_judge_ticket",
  "evisort_reassign_judgment",
  "evisort_upload_signed",
  "evisort_import_users",
  "evisort_import_summary",
  "evisort_acknowledge_import",
  "evisort_cancel_import",
]);

export const TOOL_ANNOTATIONS: Record<string, { readOnlyHint: boolean }> =
  Object.fromEntries(
    ALL_TOOL_DEFINITIONS.map((tool) => [
      tool.name,
      { readOnlyHint: !WRITE_TOOLS.has(tool.name) },
    ])
  );
