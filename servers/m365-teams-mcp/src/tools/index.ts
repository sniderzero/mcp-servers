import type { TokenProvider } from "../auth/types.js";
import { AUTH_TOOL_DEFINITIONS, handleAuthStatus, handleAuthLogin } from "./auth/authTools.js";
import { listTeamsDefinition, listTeams, getTeamDefinition, getTeam } from "./teams/teamsTools.js";
import {
  createTeamDefinition, createTeam,
  updateTeamDefinition, updateTeam,
  archiveTeamDefinition, archiveTeam,
  unarchiveTeamDefinition, unarchiveTeam,
  getPrimaryChannelDefinition, getPrimaryChannel,
  archiveChannelDefinition, archiveChannel,
  unarchiveChannelDefinition, unarchiveChannel,
  getChannelFilesFolderDefinition, getChannelFilesFolder,
  listAllChannelsDefinition, listAllChannels,
} from "./teams/teamLifecycleTools.js";
import {
  listTeamMembersDefinition, listTeamMembers,
  getTeamMemberDefinition, getTeamMember,
  addTeamMemberDefinition, addTeamMember,
  updateTeamMemberDefinition, updateTeamMember,
  removeTeamMemberDefinition, removeTeamMember,
  removeChatMemberDefinition, removeChatMember,
  getChatMemberDefinition, getChatMember,
} from "./teams/teamMembersTools.js";
import {
  listChannelsDefinition, listChannels,
  getChannelDefinition, getChannel,
  createChannelDefinition, createChannel,
  updateChannelDefinition, updateChannel,
  deleteChannelDefinition, deleteChannel,
  listChannelMembersDefinition, listChannelMembers,
  listChannelMessagesDefinition, listChannelMessages,
  sendChannelMessageDefinition, sendChannelMessage,
  replyToMessageDefinition, replyToMessage,
} from "./channels/channelsTools.js";
import {
  getChannelMessageDefinition, getChannelMessage,
  listChannelMessageRepliesDefinition, listChannelMessageReplies,
  deleteChannelMessageDefinition, deleteChannelMessage,
  setChannelMessageReactionDefinition, setChannelMessageReaction,
  unsetChannelMessageReactionDefinition, unsetChannelMessageReaction,
} from "./channels/channelMessageEnhancementsTools.js";
import {
  listChannelTabsDefinition, listChannelTabs,
  getChannelTabDefinition, getChannelTab,
  addChannelTabDefinition, addChannelTab,
  updateChannelTabDefinition, updateChannelTab,
  removeChannelTabDefinition, removeChannelTab,
  listChatTabsDefinition, listChatTabs,
  getChatTabDefinition, getChatTab,
  addChatTabDefinition, addChatTab,
  updateChatTabDefinition, updateChatTab,
  removeChatTabDefinition, removeChatTab,
} from "./tabs/tabsTools.js";
import {
  listChatsDefinition, listChats,
  createChatDefinition, createChat,
  sendChatMessageDefinition, sendChatMessage,
  listChatMembersDefinition, listChatMembers,
  addChatMemberDefinition, addChatMember,
} from "./chats/chatsTools.js";
import {
  getChatDefinition, getChat,
  updateChatDefinition, updateChat,
  listPinnedMessagesDefinition, listPinnedMessages,
  pinChatMessageDefinition, pinChatMessage,
  unpinChatMessageDefinition, unpinChatMessage,
} from "./chats/chatManagementTools.js";
import {
  listChatMessagesDefinition, listChatMessages,
  getChatMessageDefinition, getChatMessage,
  getChatMessageRepliesDefinition, getChatMessageReplies,
  deleteChatMessageDefinition, deleteChatMessage,
  setChatMessageReactionDefinition, setChatMessageReaction,
  unsetChatMessageReactionDefinition, unsetChatMessageReaction,
} from "./chats/chatMessagesTools.js";
import {
  getMyPresenceDefinition, getMyPresence,
  getPresenceDefinition, getPresence,
  setPresenceDefinition, setPresence,
} from "./presence/presenceTools.js";
import {
  getPresenceBatchDefinition, getPresenceBatch,
  clearPresenceDefinition, clearPresence,
  setStatusMessageDefinition, setStatusMessage,
  setUserPreferredPresenceDefinition, setUserPreferredPresence,
  clearUserPreferredPresenceDefinition, clearUserPreferredPresence,
} from "./presence/presenceEnhancementsTools.js";
import {
  createMeetingDefinition, createMeeting,
  getMeetingDefinition, getMeeting,
  updateMeetingDefinition, updateMeeting,
  deleteMeetingDefinition, deleteMeeting,
  listMeetingTranscriptsDefinition, listMeetingTranscripts,
  listMeetingRecordingsDefinition, listMeetingRecordings,
  getMeetingAttendanceDefinition, getMeetingAttendance,
} from "./meetings/meetingsTools.js";
import {
  notifyUserDefinition, notifyUser,
  notifyTeamDefinition, notifyTeam,
  notifyChatDefinition, notifyChat,
} from "./notifications/notificationsTools.js";
import {
  listTeamAppsDefinition, listTeamApps,
  addTeamAppDefinition, addTeamApp,
  removeTeamAppDefinition, removeTeamApp,
  upgradeTeamAppDefinition, upgradeTeamApp,
  listChatAppsDefinition, listChatApps,
  addChatAppDefinition, addChatApp,
  removeChatAppDefinition, removeChatApp,
} from "./apps/appsTools.js";
import {
  listTagsDefinition, listTags,
  createTagDefinition, createTag,
  getTagDefinition, getTag,
  updateTagDefinition, updateTag,
  deleteTagDefinition, deleteTag,
  listTagMembersDefinition, listTagMembers,
  addTagMemberDefinition, addTagMember,
  removeTagMemberDefinition, removeTagMember,
} from "./tags/tagsTools.js";
import {
  listSubscriptionsDefinition, listSubscriptions,
  createSubscriptionDefinition, createSubscription,
  getSubscriptionDefinition, getSubscription,
  updateSubscriptionDefinition, updateSubscription,
  deleteSubscriptionDefinition, deleteSubscription,
} from "./subscriptions/subscriptionsTools.js";

type ToolHandler = (args: Record<string, unknown>, provider: TokenProvider) => Promise<unknown>;

export const ALL_TOOL_DEFINITIONS = [
  // Auth
  ...AUTH_TOOL_DEFINITIONS,

  // Teams — list/get
  listTeamsDefinition,
  getTeamDefinition,

  // Teams — lifecycle
  createTeamDefinition,
  updateTeamDefinition,
  archiveTeamDefinition,
  unarchiveTeamDefinition,
  getPrimaryChannelDefinition,
  listAllChannelsDefinition,

  // Team Members
  listTeamMembersDefinition,
  getTeamMemberDefinition,
  addTeamMemberDefinition,
  updateTeamMemberDefinition,
  removeTeamMemberDefinition,

  // Channels
  listChannelsDefinition,
  getChannelDefinition,
  createChannelDefinition,
  updateChannelDefinition,
  deleteChannelDefinition,
  archiveChannelDefinition,
  unarchiveChannelDefinition,
  getChannelFilesFolderDefinition,

  // Channel Members
  listChannelMembersDefinition,

  // Channel Messages
  listChannelMessagesDefinition,
  sendChannelMessageDefinition,
  replyToMessageDefinition,
  getChannelMessageDefinition,
  listChannelMessageRepliesDefinition,
  deleteChannelMessageDefinition,
  setChannelMessageReactionDefinition,
  unsetChannelMessageReactionDefinition,

  // Channel Tabs
  listChannelTabsDefinition,
  getChannelTabDefinition,
  addChannelTabDefinition,
  updateChannelTabDefinition,
  removeChannelTabDefinition,

  // Chats
  listChatsDefinition,
  getChatDefinition,
  createChatDefinition,
  updateChatDefinition,

  // Chat Members
  listChatMembersDefinition,
  getChatMemberDefinition,
  addChatMemberDefinition,
  removeChatMemberDefinition,

  // Chat Messages
  sendChatMessageDefinition,
  listChatMessagesDefinition,
  getChatMessageDefinition,
  getChatMessageRepliesDefinition,
  deleteChatMessageDefinition,
  setChatMessageReactionDefinition,
  unsetChatMessageReactionDefinition,

  // Pinned Messages
  listPinnedMessagesDefinition,
  pinChatMessageDefinition,
  unpinChatMessageDefinition,

  // Chat Tabs
  listChatTabsDefinition,
  getChatTabDefinition,
  addChatTabDefinition,
  updateChatTabDefinition,
  removeChatTabDefinition,

  // Presence
  getMyPresenceDefinition,
  getPresenceDefinition,
  setPresenceDefinition,
  getPresenceBatchDefinition,
  clearPresenceDefinition,
  setStatusMessageDefinition,
  setUserPreferredPresenceDefinition,
  clearUserPreferredPresenceDefinition,

  // Online Meetings
  createMeetingDefinition,
  getMeetingDefinition,
  updateMeetingDefinition,
  deleteMeetingDefinition,
  listMeetingTranscriptsDefinition,
  listMeetingRecordingsDefinition,
  getMeetingAttendanceDefinition,

  // Activity Notifications
  notifyUserDefinition,
  notifyTeamDefinition,
  notifyChatDefinition,

  // Apps
  listTeamAppsDefinition,
  addTeamAppDefinition,
  removeTeamAppDefinition,
  upgradeTeamAppDefinition,
  listChatAppsDefinition,
  addChatAppDefinition,
  removeChatAppDefinition,

  // Tags
  listTagsDefinition,
  createTagDefinition,
  getTagDefinition,
  updateTagDefinition,
  deleteTagDefinition,
  listTagMembersDefinition,
  addTagMemberDefinition,
  removeTagMemberDefinition,

  // Subscriptions
  listSubscriptionsDefinition,
  createSubscriptionDefinition,
  getSubscriptionDefinition,
  updateSubscriptionDefinition,
  deleteSubscriptionDefinition,
];

const TOOL_HANDLERS: Record<string, ToolHandler> = {
  // Auth
  m365_teams_auth_status: handleAuthStatus,
  m365_teams_auth_login: handleAuthLogin,

  // Teams
  m365_teams_list_teams: listTeams,
  m365_teams_get_team: getTeam,
  m365_teams_create_team: createTeam,
  m365_teams_update_team: updateTeam,
  m365_teams_archive_team: archiveTeam,
  m365_teams_unarchive_team: unarchiveTeam,
  m365_teams_get_primary_channel: getPrimaryChannel,
  m365_teams_list_all_channels: listAllChannels,

  // Team Members
  m365_teams_list_team_members: listTeamMembers,
  m365_teams_get_team_member: getTeamMember,
  m365_teams_add_team_member: addTeamMember,
  m365_teams_update_team_member: updateTeamMember,
  m365_teams_remove_team_member: removeTeamMember,

  // Channels
  m365_teams_list_channels: listChannels,
  m365_teams_get_channel: getChannel,
  m365_teams_create_channel: createChannel,
  m365_teams_update_channel: updateChannel,
  m365_teams_delete_channel: deleteChannel,
  m365_teams_archive_channel: archiveChannel,
  m365_teams_unarchive_channel: unarchiveChannel,
  m365_teams_get_channel_files_folder: getChannelFilesFolder,

  // Channel Members
  m365_teams_list_channel_members: listChannelMembers,

  // Channel Messages
  m365_teams_list_channel_messages: listChannelMessages,
  m365_teams_send_channel_message: sendChannelMessage,
  m365_teams_reply_to_message: replyToMessage,
  m365_teams_get_channel_message: getChannelMessage,
  m365_teams_list_channel_message_replies: listChannelMessageReplies,
  m365_teams_delete_channel_message: deleteChannelMessage,
  m365_teams_set_channel_message_reaction: setChannelMessageReaction,
  m365_teams_unset_channel_message_reaction: unsetChannelMessageReaction,

  // Channel Tabs
  m365_teams_list_channel_tabs: listChannelTabs,
  m365_teams_get_channel_tab: getChannelTab,
  m365_teams_add_channel_tab: addChannelTab,
  m365_teams_update_channel_tab: updateChannelTab,
  m365_teams_remove_channel_tab: removeChannelTab,

  // Chats
  m365_teams_list_chats: listChats,
  m365_teams_get_chat: getChat,
  m365_teams_create_chat: createChat,
  m365_teams_update_chat: updateChat,

  // Chat Members
  m365_teams_list_chat_members: listChatMembers,
  m365_teams_get_chat_member: getChatMember,
  m365_teams_add_chat_member: addChatMember,
  m365_teams_remove_chat_member: removeChatMember,

  // Chat Messages
  m365_teams_send_chat_message: sendChatMessage,
  m365_teams_list_chat_messages: listChatMessages,
  m365_teams_get_chat_message: getChatMessage,
  m365_teams_get_chat_message_replies: getChatMessageReplies,
  m365_teams_delete_chat_message: deleteChatMessage,
  m365_teams_set_chat_message_reaction: setChatMessageReaction,
  m365_teams_unset_chat_message_reaction: unsetChatMessageReaction,

  // Pinned Messages
  m365_teams_list_pinned_messages: listPinnedMessages,
  m365_teams_pin_chat_message: pinChatMessage,
  m365_teams_unpin_chat_message: unpinChatMessage,

  // Chat Tabs
  m365_teams_list_chat_tabs: listChatTabs,
  m365_teams_get_chat_tab: getChatTab,
  m365_teams_add_chat_tab: addChatTab,
  m365_teams_update_chat_tab: updateChatTab,
  m365_teams_remove_chat_tab: removeChatTab,

  // Presence
  m365_teams_get_my_presence: getMyPresence,
  m365_teams_get_presence: getPresence,
  m365_teams_set_presence: setPresence,
  m365_teams_get_presence_batch: getPresenceBatch,
  m365_teams_clear_presence: clearPresence,
  m365_teams_set_status_message: setStatusMessage,
  m365_teams_set_user_preferred_presence: setUserPreferredPresence,
  m365_teams_clear_user_preferred_presence: clearUserPreferredPresence,

  // Online Meetings
  m365_teams_create_meeting: createMeeting,
  m365_teams_get_meeting: getMeeting,
  m365_teams_update_meeting: updateMeeting,
  m365_teams_delete_meeting: deleteMeeting,
  m365_teams_list_meeting_transcripts: listMeetingTranscripts,
  m365_teams_list_meeting_recordings: listMeetingRecordings,
  m365_teams_get_meeting_attendance: getMeetingAttendance,

  // Activity Notifications
  m365_teams_notify_user: notifyUser,
  m365_teams_notify_team: notifyTeam,
  m365_teams_notify_chat: notifyChat,

  // Apps
  m365_teams_list_team_apps: listTeamApps,
  m365_teams_add_team_app: addTeamApp,
  m365_teams_remove_team_app: removeTeamApp,
  m365_teams_upgrade_team_app: upgradeTeamApp,
  m365_teams_list_chat_apps: listChatApps,
  m365_teams_add_chat_app: addChatApp,
  m365_teams_remove_chat_app: removeChatApp,

  // Tags
  m365_teams_list_tags: listTags,
  m365_teams_create_tag: createTag,
  m365_teams_get_tag: getTag,
  m365_teams_update_tag: updateTag,
  m365_teams_delete_tag: deleteTag,
  m365_teams_list_tag_members: listTagMembers,
  m365_teams_add_tag_member: addTagMember,
  m365_teams_remove_tag_member: removeTagMember,

  // Subscriptions
  m365_teams_list_subscriptions: listSubscriptions,
  m365_teams_create_subscription: createSubscription,
  m365_teams_get_subscription: getSubscription,
  m365_teams_update_subscription: updateSubscription,
  m365_teams_delete_subscription: deleteSubscription,
};

export function getToolHandler(name: string): ToolHandler | undefined {
  return TOOL_HANDLERS[name];
}
