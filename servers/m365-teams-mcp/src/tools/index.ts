import type { TokenProvider } from "../auth/types.js";
import { listTeamsDefinition, listTeams, getTeamDefinition, getTeam } from "./teams/teamsTools.js";
import {
  listChannelsDefinition,
  listChannels,
  getChannelDefinition,
  getChannel,
  createChannelDefinition,
  createChannel,
  updateChannelDefinition,
  updateChannel,
  deleteChannelDefinition,
  deleteChannel,
  listChannelMembersDefinition,
  listChannelMembers,
  listChannelMessagesDefinition,
  listChannelMessages,
  sendChannelMessageDefinition,
  sendChannelMessage,
  replyToMessageDefinition,
  replyToMessage,
} from "./channels/channelsTools.js";
import {
  listChatsDefinition,
  listChats,
  createChatDefinition,
  createChat,
  sendChatMessageDefinition,
  sendChatMessage,
  listChatMembersDefinition,
  listChatMembers,
  addChatMemberDefinition,
  addChatMember,
} from "./chats/chatsTools.js";
import {
  getMyPresenceDefinition,
  getMyPresence,
  getPresenceDefinition,
  getPresence,
  setPresenceDefinition,
  setPresence,
} from "./presence/presenceTools.js";

type ToolHandler = (args: Record<string, unknown>, provider: TokenProvider) => Promise<unknown>;

export const ALL_TOOL_DEFINITIONS = [
  // Teams
  listTeamsDefinition,
  getTeamDefinition,
  // Channels
  listChannelsDefinition,
  getChannelDefinition,
  createChannelDefinition,
  updateChannelDefinition,
  deleteChannelDefinition,
  listChannelMembersDefinition,
  // Channel Messages
  listChannelMessagesDefinition,
  sendChannelMessageDefinition,
  replyToMessageDefinition,
  // Chats
  listChatsDefinition,
  createChatDefinition,
  sendChatMessageDefinition,
  listChatMembersDefinition,
  addChatMemberDefinition,
  // Presence
  getMyPresenceDefinition,
  getPresenceDefinition,
  setPresenceDefinition,
];

const TOOL_HANDLERS: Record<string, ToolHandler> = {
  m365_teams_list_teams: listTeams,
  m365_teams_get_team: getTeam,
  m365_teams_list_channels: listChannels,
  m365_teams_get_channel: getChannel,
  m365_teams_create_channel: createChannel,
  m365_teams_update_channel: updateChannel,
  m365_teams_delete_channel: deleteChannel,
  m365_teams_list_channel_members: listChannelMembers,
  m365_teams_list_channel_messages: listChannelMessages,
  m365_teams_send_channel_message: sendChannelMessage,
  m365_teams_reply_to_message: replyToMessage,
  m365_teams_list_chats: listChats,
  m365_teams_create_chat: createChat,
  m365_teams_send_chat_message: sendChatMessage,
  m365_teams_list_chat_members: listChatMembers,
  m365_teams_add_chat_member: addChatMember,
  m365_teams_get_my_presence: getMyPresence,
  m365_teams_get_presence: getPresence,
  m365_teams_set_presence: setPresence,
};

export function getToolHandler(name: string): ToolHandler | undefined {
  return TOOL_HANDLERS[name];
}
