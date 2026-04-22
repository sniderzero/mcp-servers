import { describe, it, expect } from "vitest";
import { OnboardingClient } from "../../src/clients/onboarding.js";

const ACCESS_KEY = process.env.GREENHOUSE_ONBOARDING_ACCESS_KEY;
const SECRET_KEY = process.env.GREENHOUSE_ONBOARDING_SECRET_KEY ?? "";

describe.skipIf(!ACCESS_KEY)("Onboarding integration", () => {
  const client = new OnboardingClient(ACCESS_KEY!, SECRET_KEY);

  it("lists employees", async () => {
    const result = await client.query(
      "{ employees { id first_name } rateLimit { remaining resetAt } }"
    );
    expect(result.data).toBeDefined();
  });
});
