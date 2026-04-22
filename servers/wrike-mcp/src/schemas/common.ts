import { z } from "zod";

export const wrikeId = z.string().describe("Wrike resource ID");

export const paginationParams = z.object({
  pageSize: z.number().max(1000).optional().describe("Number of results per page (max: 1000)"),
  nextPageToken: z.string().optional().describe("Token for fetching the next page of results"),
});

export const optionalFields = z.object({
  fields: z
    .array(z.string())
    .optional()
    .describe("Additional fields to include in the response"),
});
