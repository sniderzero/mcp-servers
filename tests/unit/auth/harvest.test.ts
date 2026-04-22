import { describe, it, expect } from "vitest";
import { buildBasicAuthHeader } from "../../../src/auth/harvest.js";

describe("buildBasicAuthHeader", () => {
  it("encodes apiKey: as base64 Basic header", () => {
    const header = buildBasicAuthHeader("mykey");
    expect(header).toBe("Basic " + Buffer.from("mykey:").toString("base64"));
  });

  it("handles empty key", () => {
    const header = buildBasicAuthHeader("");
    expect(header).toBe("Basic " + Buffer.from(":").toString("base64"));
  });

  it("handles special characters", () => {
    const key = "key+with/special==chars";
    const header = buildBasicAuthHeader(key);
    expect(header).toMatch(/^Basic /);
    const decoded = Buffer.from(header.slice(6), "base64").toString();
    expect(decoded).toBe(`${key}:`);
  });
});
