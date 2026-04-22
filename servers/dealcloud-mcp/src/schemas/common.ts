import { z } from "zod";

export const paginationParams = z.object({
  limit: z.number().min(1).max(10000).optional().describe("Maximum records to return (default: 100, max: 10000)"),
  skip: z.number().min(0).optional().describe("Number of records to skip for pagination (default: 0)"),
});
