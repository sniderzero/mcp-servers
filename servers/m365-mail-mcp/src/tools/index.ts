import type { TokenProvider } from "../auth/types.js";
import {
  COMPOSE_TOOL_DEFINITIONS,
  handleMailSend,
  handleMailReply,
  handleMailReplyAll,
  handleMailForward,
  handleMailCreateDraft,
  handleMailUpdateDraft,
  handleMailSendDraft,
} from "./messages/compose.js";
import {
  READ_TOOL_DEFINITIONS,
  handleMailGetMessage,
  handleMailListInbox,
  handleMailListFolder,
  handleMailListUnread,
  handleMailListFlagged,
  handleMailListWithAttachments,
} from "./messages/read.js";
import {
  ACTIONS_TOOL_DEFINITIONS,
  handleMailMarkRead,
  handleMailMarkUnread,
  handleMailFlag,
  handleMailUnflag,
  handleMailDelete,
  handleMailMove,
  handleMailCopy,
} from "./messages/actions.js";
import {
  ATTACHMENTS_TOOL_DEFINITIONS,
  handleMailListAttachments,
  handleMailGetAttachment,
  handleMailAddAttachment,
} from "./attachments/index.js";
import {
  FOLDERS_TOOL_DEFINITIONS,
  handleMailListFolders,
  handleMailCreateFolder,
  handleMailUpdateFolder,
  handleMailDeleteFolder,
} from "./folders/index.js";
import {
  CATEGORIES_TOOL_DEFINITIONS,
  handleMailListCategories,
  handleMailSetCategories,
} from "./categories/index.js";
import {
  RULES_TOOL_DEFINITIONS,
  handleMailListRules,
  handleMailCreateRule,
  handleMailUpdateRule,
  handleMailDeleteRule,
} from "./rules/index.js";
import {
  SETTINGS_TOOL_DEFINITIONS,
  handleMailGetSettings,
} from "./settings/index.js";
import { AUTH_TOOL_DEFINITIONS, handleAuthStatus, handleAuthLogin } from "./auth/authTools.js";

// ── Read/Write Annotations ────────────────────────────────────────────────────

const READ_ONLY = { readOnlyHint: true, destructiveHint: false } as const;
const WRITE_OP = { readOnlyHint: false, destructiveHint: true } as const;

const READ_TOOLS = new Set([
  "m365_mail_auth_status",
  "m365_mail_get_message",
  "m365_mail_list_inbox",
  "m365_mail_list_folder",
  "m365_mail_list_unread",
  "m365_mail_list_flagged",
  "m365_mail_list_with_attachments",
  "m365_mail_list_attachments",
  "m365_mail_get_attachment",
  "m365_mail_list_folders",
  "m365_mail_list_categories",
  "m365_mail_list_rules",
  "m365_mail_get_settings",
]);

function annotateTools(defs: Array<Record<string, unknown>>) {
  return defs.map((def) => ({
    ...def,
    annotations: READ_TOOLS.has(def.name as string) ? READ_ONLY : WRITE_OP,
  }));
}

export const ALL_TOOL_DEFINITIONS = annotateTools([
  ...AUTH_TOOL_DEFINITIONS,
  ...COMPOSE_TOOL_DEFINITIONS,
  ...READ_TOOL_DEFINITIONS,
  ...ACTIONS_TOOL_DEFINITIONS,
  ...ATTACHMENTS_TOOL_DEFINITIONS,
  ...FOLDERS_TOOL_DEFINITIONS,
  ...CATEGORIES_TOOL_DEFINITIONS,
  ...RULES_TOOL_DEFINITIONS,
  ...SETTINGS_TOOL_DEFINITIONS,
]);

type ToolHandler = (args: unknown, provider: TokenProvider) => Promise<unknown>;

const TOOL_HANDLERS: Record<string, ToolHandler> = {
  // Auth
  m365_mail_auth_status: handleAuthStatus,
  m365_mail_auth_login: handleAuthLogin,
  // Compose & Send
  m365_mail_send: handleMailSend,
  m365_mail_reply: handleMailReply,
  m365_mail_reply_all: handleMailReplyAll,
  m365_mail_forward: handleMailForward,
  m365_mail_create_draft: handleMailCreateDraft,
  m365_mail_update_draft: handleMailUpdateDraft,
  m365_mail_send_draft: handleMailSendDraft,
  // Read
  m365_mail_get_message: handleMailGetMessage,
  m365_mail_list_inbox: handleMailListInbox,
  m365_mail_list_folder: handleMailListFolder,
  m365_mail_list_unread: handleMailListUnread,
  m365_mail_list_flagged: handleMailListFlagged,
  m365_mail_list_with_attachments: handleMailListWithAttachments,
  // Actions
  m365_mail_mark_read: handleMailMarkRead,
  m365_mail_mark_unread: handleMailMarkUnread,
  m365_mail_flag: handleMailFlag,
  m365_mail_unflag: handleMailUnflag,
  m365_mail_delete: handleMailDelete,
  m365_mail_move: handleMailMove,
  m365_mail_copy: handleMailCopy,
  // Attachments
  m365_mail_list_attachments: handleMailListAttachments,
  m365_mail_get_attachment: handleMailGetAttachment,
  m365_mail_add_attachment: handleMailAddAttachment,
  // Folders
  m365_mail_list_folders: handleMailListFolders,
  m365_mail_create_folder: handleMailCreateFolder,
  m365_mail_update_folder: handleMailUpdateFolder,
  m365_mail_delete_folder: handleMailDeleteFolder,
  // Categories
  m365_mail_list_categories: handleMailListCategories,
  m365_mail_set_categories: handleMailSetCategories,
  // Rules
  m365_mail_list_rules: handleMailListRules,
  m365_mail_create_rule: handleMailCreateRule,
  m365_mail_update_rule: handleMailUpdateRule,
  m365_mail_delete_rule: handleMailDeleteRule,
  // Settings
  m365_mail_get_settings: handleMailGetSettings,
};

export function getToolHandler(name: string): ToolHandler | undefined {
  return TOOL_HANDLERS[name];
}
