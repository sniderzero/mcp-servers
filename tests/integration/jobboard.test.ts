import { describe, it, expect } from "vitest";
import { JobBoardClient } from "../../src/clients/jobboard.js";

const BOARD_TOKEN = process.env.GREENHOUSE_BOARD_TOKEN;

describe.skipIf(!BOARD_TOKEN)("Job Board integration", () => {
  const client = new JobBoardClient(BOARD_TOKEN!);

  it("lists jobs", async () => {
    const result = await client.get<{ jobs: unknown[] }>("/jobs");
    expect(Array.isArray((result as any).jobs)).toBe(true);
  });
});
