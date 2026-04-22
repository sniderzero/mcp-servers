import { describe, it, expect } from "vitest";
import { AuditLogClient } from "../../src/clients/auditlog.js";

const INTEGRATION = process.env.GREENHOUSE_TEST_API_KEY;
const AUDIT_USER = process.env.GREENHOUSE_AUDIT_USER_ID;

describe.skipIf(!INTEGRATION || !AUDIT_USER)("Audit Log integration", () => {
  const client = new AuditLogClient(INTEGRATION!, AUDIT_USER!);

  it("lists events", async () => {
    const result = await client.get<{ events: unknown[] }>("/events/", {
      page_size: 1,
    });
    expect(result).toBeDefined();
  });
});
