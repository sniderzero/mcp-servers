import { z } from "zod";

export const idParam = z.object({
  id: z.number().describe("The unique ID of the resource"),
});

export const paginationParams = z.object({
  page: z.number().optional().describe("Page number (default: 1)"),
  per_page: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe("Items per page (default: 30, max: 100)"),
});

export const parentChildIds = z.object({
  parent_id: z.number().describe("The ID of the parent resource"),
  id: z.number().describe("The ID of the child resource"),
});

export const parentIdParam = z.object({
  parent_id: z.number().describe("The ID of the parent resource"),
});

export const parentIdWithPagination = parentIdParam.merge(paginationParams);

export const queryParam = z.object({
  query: z
    .string()
    .describe(
      'Filter query string using FreshService query syntax (e.g., "priority:3 AND status:2")'
    ),
});

export const includeParam = z.object({
  include: z
    .string()
    .optional()
    .describe("Comma-separated list of related resources to include in response"),
});
