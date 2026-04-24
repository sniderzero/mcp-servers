import type { TokenProvider } from "../../auth/types.js";

const GRAPH = "https://graph.microsoft.com/v1.0";

async function graphGet(token: string, path: string): Promise<unknown> {
  const res = await fetch(`${GRAPH}${path}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Graph GET ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function graphPost(token: string, path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${GRAPH}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Graph POST ${path} failed: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : { success: true };
}

async function graphPatch(token: string, path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${GRAPH}${path}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Graph PATCH ${path} failed: ${res.status} ${await res.text()}`);
  return { success: true };
}

async function graphDelete(token: string, path: string): Promise<unknown> {
  const res = await fetch(`${GRAPH}${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Graph DELETE ${path} failed: ${res.status} ${await res.text()}`);
  return { success: true };
}

// ── m365_teams_create_meeting ─────────────────────────────────────────────────

export const createMeetingDefinition = {
  name: "m365_teams_create_meeting",
  description: "Create an online meeting in Microsoft Teams.",
  inputSchema: {
    type: "object" as const,
    properties: {
      subject: { type: "string", description: "The meeting subject." },
      startDateTime: { type: "string", description: "Start time in ISO 8601 format." },
      endDateTime: { type: "string", description: "End time in ISO 8601 format." },
      attendeeEmails: {
        type: "array",
        items: { type: "string" },
        description: "Optional array of attendee email addresses (UPNs).",
      },
    },
    required: ["subject", "startDateTime", "endDateTime"],
  },
};

export async function createMeeting(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  const attendeeEmails = (args.attendeeEmails as string[] | undefined) ?? [];
  const body: Record<string, unknown> = {
    subject: args.subject,
    startDateTime: args.startDateTime,
    endDateTime: args.endDateTime,
    participants: {
      attendees: attendeeEmails.map((email) => ({ upn: email, role: "attendee" })),
    },
  };
  return graphPost(token, "/me/onlineMeetings", body);
}

// ── m365_teams_get_meeting ────────────────────────────────────────────────────

export const getMeetingDefinition = {
  name: "m365_teams_get_meeting",
  description: "Get details of an online meeting including its join URL.",
  inputSchema: {
    type: "object" as const,
    properties: {
      meetingId: { type: "string", description: "The ID of the online meeting." },
    },
    required: ["meetingId"],
  },
};

export async function getMeeting(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, `/me/onlineMeetings/${args.meetingId}`);
}

// ── m365_teams_update_meeting ─────────────────────────────────────────────────

export const updateMeetingDefinition = {
  name: "m365_teams_update_meeting",
  description: "Update the subject and/or times of an online meeting.",
  inputSchema: {
    type: "object" as const,
    properties: {
      meetingId: { type: "string", description: "The ID of the online meeting." },
      subject: { type: "string", description: "New subject for the meeting." },
      startDateTime: { type: "string", description: "New start time in ISO 8601 format." },
      endDateTime: { type: "string", description: "New end time in ISO 8601 format." },
    },
    required: ["meetingId"],
  },
};

export async function updateMeeting(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  const body: Record<string, unknown> = {};
  if (args.subject) body.subject = args.subject;
  if (args.startDateTime) body.startDateTime = args.startDateTime;
  if (args.endDateTime) body.endDateTime = args.endDateTime;
  return graphPatch(token, `/me/onlineMeetings/${args.meetingId}`, body);
}

// ── m365_teams_delete_meeting ─────────────────────────────────────────────────

export const deleteMeetingDefinition = {
  name: "m365_teams_delete_meeting",
  description: "Delete an online meeting.",
  inputSchema: {
    type: "object" as const,
    properties: {
      meetingId: { type: "string", description: "The ID of the online meeting to delete." },
    },
    required: ["meetingId"],
  },
};

export async function deleteMeeting(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphDelete(token, `/me/onlineMeetings/${args.meetingId}`);
}

// ── m365_teams_list_meeting_transcripts ──────────────────────────────────────

export const listMeetingTranscriptsDefinition = {
  name: "m365_teams_list_meeting_transcripts",
  description: "List transcripts for an online meeting.",
  inputSchema: {
    type: "object" as const,
    properties: {
      meetingId: { type: "string", description: "The ID of the online meeting." },
    },
    required: ["meetingId"],
  },
};

export async function listMeetingTranscripts(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, `/me/onlineMeetings/${args.meetingId}/transcripts`);
}

// ── m365_teams_list_meeting_recordings ───────────────────────────────────────

export const listMeetingRecordingsDefinition = {
  name: "m365_teams_list_meeting_recordings",
  description: "List recordings for an online meeting.",
  inputSchema: {
    type: "object" as const,
    properties: {
      meetingId: { type: "string", description: "The ID of the online meeting." },
    },
    required: ["meetingId"],
  },
};

export async function listMeetingRecordings(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, `/me/onlineMeetings/${args.meetingId}/recordings`);
}

// ── m365_teams_get_meeting_attendance ────────────────────────────────────────

export const getMeetingAttendanceDefinition = {
  name: "m365_teams_get_meeting_attendance",
  description: "Get attendance reports for an online meeting.",
  inputSchema: {
    type: "object" as const,
    properties: {
      meetingId: { type: "string", description: "The ID of the online meeting." },
    },
    required: ["meetingId"],
  },
};

export async function getMeetingAttendance(args: Record<string, unknown>, provider: TokenProvider) {
  const token = await provider.getToken();
  return graphGet(token, `/me/onlineMeetings/${args.meetingId}/attendanceReports`);
}
