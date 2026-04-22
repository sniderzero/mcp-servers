import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { TokenProvider } from "../../auth/types.js";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

async function graphRequest(
  token: string,
  method: string,
  path: string,
  body?: unknown
): Promise<unknown> {
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return { success: true };
  const data = await res.json();
  if (!res.ok) {
    const err = (data as { error?: { message?: string } }).error;
    throw new Error(`Graph API error ${res.status}: ${err?.message ?? JSON.stringify(data)}`);
  }
  return data;
}

function buildQueryString(params: Record<string, string | undefined>): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
    .join("&");
  return parts ? `?${parts}` : "";
}

const attendeeSchema = z.object({
  emailAddress: z.object({
    address: z.string(),
    name: z.string().optional(),
  }),
  type: z.enum(["required", "optional", "resource"]).optional(),
});

const dateTimeSchema = z.object({
  dateTime: z.string().describe("ISO 8601 datetime string"),
  timeZone: z.string().describe("IANA timezone (e.g. 'America/New_York')"),
});

export function registerEventTools(server: McpServer, provider: TokenProvider): void {
  // --- List Events ---
  server.tool(
    "m365_cal_list_events",
    "List calendar events within a date range using calendarView (expands recurring events). Requires startDateTime and endDateTime.",
    {
      startDateTime: z.string().describe("Start of date range (ISO 8601, e.g. '2024-01-01T00:00:00')"),
      endDateTime: z.string().describe("End of date range (ISO 8601, e.g. '2024-01-31T23:59:59')"),
      top: z.number().optional().describe("Maximum number of results to return"),
      select: z.string().optional().describe("Comma-separated list of fields to return"),
      filter: z.string().optional().describe("OData filter expression"),
      orderby: z.string().optional().describe("OData orderby expression"),
    },
    async ({ startDateTime, endDateTime, top, select, filter, orderby }) => {
      const token = await provider.getToken();
      const qs = buildQueryString({
        startDateTime,
        endDateTime,
        $top: top !== undefined ? String(top) : undefined,
        $select: select,
        $filter: filter,
        $orderby: orderby,
      });
      const data = await graphRequest(token, "GET", `/me/calendarView${qs}`);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  // --- Get Event ---
  server.tool(
    "m365_cal_get_event",
    "Get a specific calendar event by ID",
    {
      eventId: z.string().describe("The event ID"),
    },
    async ({ eventId }) => {
      const token = await provider.getToken();
      const data = await graphRequest(token, "GET", `/me/events/${eventId}`);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  // --- Create Event ---
  server.tool(
    "m365_cal_create_event",
    "Create a new calendar event",
    {
      subject: z.string().describe("Event subject/title"),
      start: dateTimeSchema.describe("Start date and time"),
      end: dateTimeSchema.describe("End date and time"),
      body: z.object({
        contentType: z.enum(["text", "html"]),
        content: z.string(),
      }).optional().describe("Event body/description"),
      location: z.object({ displayName: z.string() }).optional().describe("Event location"),
      attendees: z.array(attendeeSchema).optional().describe("List of attendees"),
      isOnlineMeeting: z.boolean().optional().describe("Whether this is an online meeting"),
      onlineMeetingProvider: z.string().optional().describe("Online meeting provider (e.g. 'teamsForBusiness')"),
      importance: z.enum(["low", "normal", "high"]).optional(),
      sensitivity: z.enum(["normal", "personal", "private", "confidential"]).optional(),
      isAllDay: z.boolean().optional().describe("Whether this is an all-day event"),
      recurrence: z.record(z.unknown()).optional().describe("Recurrence pattern object"),
    },
    async ({ subject, start, end, body, location, attendees, isOnlineMeeting, onlineMeetingProvider, importance, sensitivity, isAllDay, recurrence }) => {
      const token = await provider.getToken();
      const eventBody: Record<string, unknown> = { subject, start, end };
      if (body) eventBody.body = body;
      if (location) eventBody.location = location;
      if (attendees) eventBody.attendees = attendees;
      if (isOnlineMeeting !== undefined) eventBody.isOnlineMeeting = isOnlineMeeting;
      if (onlineMeetingProvider) eventBody.onlineMeetingProvider = onlineMeetingProvider;
      if (importance) eventBody.importance = importance;
      if (sensitivity) eventBody.sensitivity = sensitivity;
      if (isAllDay !== undefined) eventBody.isAllDay = isAllDay;
      if (recurrence) eventBody.recurrence = recurrence;
      const data = await graphRequest(token, "POST", "/me/events", eventBody);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  // --- Create All-Day Event ---
  server.tool(
    "m365_cal_create_all_day_event",
    "Create an all-day calendar event (convenience tool — sets isAllDay:true, start/end as date only)",
    {
      subject: z.string().describe("Event subject/title"),
      startDate: z.string().describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().describe("End date inclusive (YYYY-MM-DD)"),
      timeZone: z.string().optional().describe("IANA timezone (e.g. 'UTC'). Defaults to UTC."),
      body: z.object({
        contentType: z.enum(["text", "html"]),
        content: z.string(),
      }).optional(),
      location: z.object({ displayName: z.string() }).optional(),
      attendees: z.array(attendeeSchema).optional(),
      importance: z.enum(["low", "normal", "high"]).optional(),
    },
    async ({ subject, startDate, endDate, timeZone, body, location, attendees, importance }) => {
      const token = await provider.getToken();
      const tz = timeZone ?? "UTC";
      const eventBody: Record<string, unknown> = {
        subject,
        isAllDay: true,
        start: { dateTime: `${startDate}T00:00:00`, timeZone: tz },
        end: { dateTime: `${endDate}T00:00:00`, timeZone: tz },
      };
      if (body) eventBody.body = body;
      if (location) eventBody.location = location;
      if (attendees) eventBody.attendees = attendees;
      if (importance) eventBody.importance = importance;
      const data = await graphRequest(token, "POST", "/me/events", eventBody);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  // --- Update Event ---
  server.tool(
    "m365_cal_update_event",
    "Update an existing calendar event (all fields optional)",
    {
      eventId: z.string().describe("The event ID to update"),
      subject: z.string().optional(),
      start: dateTimeSchema.optional(),
      end: dateTimeSchema.optional(),
      body: z.object({
        contentType: z.enum(["text", "html"]),
        content: z.string(),
      }).optional(),
      location: z.object({ displayName: z.string() }).optional(),
      attendees: z.array(attendeeSchema).optional(),
      isOnlineMeeting: z.boolean().optional(),
      onlineMeetingProvider: z.string().optional(),
      importance: z.enum(["low", "normal", "high"]).optional(),
      sensitivity: z.enum(["normal", "personal", "private", "confidential"]).optional(),
      isAllDay: z.boolean().optional(),
      recurrence: z.record(z.unknown()).optional(),
    },
    async ({ eventId, subject, start, end, body, location, attendees, isOnlineMeeting, onlineMeetingProvider, importance, sensitivity, isAllDay, recurrence }) => {
      const token = await provider.getToken();
      const patch: Record<string, unknown> = {};
      if (subject !== undefined) patch.subject = subject;
      if (start !== undefined) patch.start = start;
      if (end !== undefined) patch.end = end;
      if (body !== undefined) patch.body = body;
      if (location !== undefined) patch.location = location;
      if (attendees !== undefined) patch.attendees = attendees;
      if (isOnlineMeeting !== undefined) patch.isOnlineMeeting = isOnlineMeeting;
      if (onlineMeetingProvider !== undefined) patch.onlineMeetingProvider = onlineMeetingProvider;
      if (importance !== undefined) patch.importance = importance;
      if (sensitivity !== undefined) patch.sensitivity = sensitivity;
      if (isAllDay !== undefined) patch.isAllDay = isAllDay;
      if (recurrence !== undefined) patch.recurrence = recurrence;
      const data = await graphRequest(token, "PATCH", `/me/events/${eventId}`, patch);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  // --- Delete Event ---
  server.tool(
    "m365_cal_delete_event",
    "Delete a calendar event by ID",
    {
      eventId: z.string().describe("The event ID to delete"),
    },
    async ({ eventId }) => {
      const token = await provider.getToken();
      const data = await graphRequest(token, "DELETE", `/me/events/${eventId}`);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  // --- Accept Event ---
  server.tool(
    "m365_cal_accept_event",
    "Accept a calendar event invitation",
    {
      eventId: z.string().describe("The event ID"),
      sendResponse: z.boolean().optional().describe("Whether to send a response to the organizer"),
      comment: z.string().optional().describe("Optional comment to include with the response"),
    },
    async ({ eventId, sendResponse, comment }) => {
      const token = await provider.getToken();
      const body: Record<string, unknown> = { sendResponse: sendResponse ?? true };
      if (comment) body.comment = comment;
      const data = await graphRequest(token, "POST", `/me/events/${eventId}/accept`, body);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  // --- Decline Event ---
  server.tool(
    "m365_cal_decline_event",
    "Decline a calendar event invitation",
    {
      eventId: z.string().describe("The event ID"),
      sendResponse: z.boolean().optional().describe("Whether to send a response to the organizer"),
      comment: z.string().optional().describe("Optional comment to include with the response"),
    },
    async ({ eventId, sendResponse, comment }) => {
      const token = await provider.getToken();
      const body: Record<string, unknown> = { sendResponse: sendResponse ?? true };
      if (comment) body.comment = comment;
      const data = await graphRequest(token, "POST", `/me/events/${eventId}/decline`, body);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  // --- Tentative Event ---
  server.tool(
    "m365_cal_tentative_event",
    "Tentatively accept a calendar event invitation",
    {
      eventId: z.string().describe("The event ID"),
      sendResponse: z.boolean().optional().describe("Whether to send a response to the organizer"),
      comment: z.string().optional().describe("Optional comment to include with the response"),
    },
    async ({ eventId, sendResponse, comment }) => {
      const token = await provider.getToken();
      const body: Record<string, unknown> = { sendResponse: sendResponse ?? true };
      if (comment) body.comment = comment;
      const data = await graphRequest(token, "POST", `/me/events/${eventId}/tentativelyAccept`, body);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  // --- Forward Event ---
  server.tool(
    "m365_cal_forward_event",
    "Forward a calendar event to new recipients",
    {
      eventId: z.string().describe("The event ID"),
      toRecipients: z.array(z.object({
        emailAddress: z.object({
          address: z.string(),
          name: z.string().optional(),
        }),
      })).describe("List of recipients to forward to"),
      comment: z.string().optional().describe("Optional comment to include with the forward"),
    },
    async ({ eventId, toRecipients, comment }) => {
      const token = await provider.getToken();
      const body: Record<string, unknown> = { toRecipients };
      if (comment) body.comment = comment;
      const data = await graphRequest(token, "POST", `/me/events/${eventId}/forward`, body);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  // --- Dismiss Reminder ---
  server.tool(
    "m365_cal_dismiss_reminder",
    "Dismiss a reminder for a calendar event",
    {
      eventId: z.string().describe("The event ID"),
    },
    async ({ eventId }) => {
      const token = await provider.getToken();
      const data = await graphRequest(token, "POST", `/me/events/${eventId}/dismissReminder`, {});
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  // --- List Instances (Recurring) ---
  server.tool(
    "m365_cal_list_instances",
    "List instances of a recurring event within a date range",
    {
      eventId: z.string().describe("The recurring event ID (series master)"),
      startDateTime: z.string().describe("Start of date range (ISO 8601)"),
      endDateTime: z.string().describe("End of date range (ISO 8601)"),
    },
    async ({ eventId, startDateTime, endDateTime }) => {
      const token = await provider.getToken();
      const qs = buildQueryString({ startDateTime, endDateTime });
      const data = await graphRequest(token, "GET", `/me/events/${eventId}/instances${qs}`);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  // --- Create Online Meeting Event ---
  server.tool(
    "m365_cal_create_online_meeting_event",
    "Create a Teams online meeting event (convenience tool — sets isOnlineMeeting:true, provider:teamsForBusiness)",
    {
      subject: z.string().describe("Event subject/title"),
      start: dateTimeSchema.describe("Start date and time"),
      end: dateTimeSchema.describe("End date and time"),
      body: z.object({
        contentType: z.enum(["text", "html"]),
        content: z.string(),
      }).optional(),
      location: z.object({ displayName: z.string() }).optional(),
      attendees: z.array(attendeeSchema).optional(),
      importance: z.enum(["low", "normal", "high"]).optional(),
    },
    async ({ subject, start, end, body, location, attendees, importance }) => {
      const token = await provider.getToken();
      const eventBody: Record<string, unknown> = {
        subject,
        start,
        end,
        isOnlineMeeting: true,
        onlineMeetingProvider: "teamsForBusiness",
      };
      if (body) eventBody.body = body;
      if (location) eventBody.location = location;
      if (attendees) eventBody.attendees = attendees;
      if (importance) eventBody.importance = importance;
      const data = await graphRequest(token, "POST", "/me/events", eventBody);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  // --- List Shared Events ---
  server.tool(
    "m365_cal_list_shared_events",
    "List calendar events from another user's calendar (requires delegated access)",
    {
      userId: z.string().describe("The user ID or UPN of the shared calendar owner"),
      startDateTime: z.string().describe("Start of date range (ISO 8601)"),
      endDateTime: z.string().describe("End of date range (ISO 8601)"),
      top: z.number().optional().describe("Maximum number of results"),
      select: z.string().optional().describe("Comma-separated list of fields to return"),
    },
    async ({ userId, startDateTime, endDateTime, top, select }) => {
      const token = await provider.getToken();
      const qs = buildQueryString({
        startDateTime,
        endDateTime,
        $top: top !== undefined ? String(top) : undefined,
        $select: select,
      });
      const data = await graphRequest(token, "GET", `/users/${userId}/calendarView${qs}`);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );
}
