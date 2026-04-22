import { describe, it, expect } from "vitest";
import { HarvestClient } from "../../src/clients/harvest.js";

const INTEGRATION = process.env.GREENHOUSE_TEST_API_KEY;

describe.skipIf(!INTEGRATION)("Harvest integration", () => {
  const client = new HarvestClient(INTEGRATION!);

  it("lists candidates", async () => {
    const result = await client.get<{ id: number; first_name: string }[]>(
      "/candidates",
      { per_page: 1 }
    );
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("lists jobs", async () => {
    const result = await client.get<{ id: number; name: string }[]>("/jobs", {
      per_page: 1,
    });
    expect(Array.isArray(result.data)).toBe(true);
  });
});
