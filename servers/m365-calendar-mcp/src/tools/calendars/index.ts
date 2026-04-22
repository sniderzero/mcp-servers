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

export function registerCalendarTools(server: McpServer, provider: TokenProvider): void {
  server.tool(
    "m365_cal_list_calendars",
    "List all calendars owned by or shared with the user",
    {},
    async () => {
      const token = await provider.getToken();
      const data = await graphRequest(token, "GET", "/me/calendars?$select=id,name,color,isDefaultCalendar,canEdit,owner");
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "m365_cal_get_calendar",
    "Get a specific calendar by ID",
    {
      calendarId: z.string().describe("The calendar ID"),
    },
    async ({ calendarId }) => {
      const token = await provider.getToken();
      const data = await graphRequest(token, "GET", `/me/calendars/${calendarId}?$select=id,name,color,isDefaultCalendar,canEdit,canShare,canViewPrivateItems,owner`);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "m365_cal_create_calendar",
    "Create a new calendar",
    {
      name: z.string().describe("Calendar name"),
      color: z.string().optional().describe("Calendar color (e.g. 'auto', 'lightBlue', 'lightGreen', 'lightOrange', 'lightGray', 'lightYellow', 'lightTeal', 'lightPink', 'lightBrown', 'lightRed', 'maxColor')"),
    },
    async ({ name, color }) => {
      const token = await provider.getToken();
      const body: Record<string, unknown> = { name };
      if (color) body.color = color;
      const data = await graphRequest(token, "POST", "/me/calendars", body);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "m365_cal_delete_calendar",
    "Delete a calendar by ID",
    {
      calendarId: z.string().describe("The calendar ID to delete"),
    },
    async ({ calendarId }) => {
      const token = await provider.getToken();
      const data = await graphRequest(token, "DELETE", `/me/calendars/${calendarId}`);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );
}
