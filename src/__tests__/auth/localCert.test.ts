import { describe, it, expect } from "vitest";
import * as tls from "tls";
import { generateSelfSignedCert } from "../../auth/localCert.js";

describe("generateSelfSignedCert", () => {
  it("returns key and cert as PEM strings", () => {
    const { key, cert } = generateSelfSignedCert();
    expect(key).toContain("-----BEGIN EC PRIVATE KEY-----");
    expect(cert).toContain("-----BEGIN CERTIFICATE-----");
    expect(cert).toContain("-----END CERTIFICATE-----");
  });

  it("produces a valid TLS secure context", () => {
    const { key, cert } = generateSelfSignedCert();
    // If the cert is malformed, createSecureContext will throw
    expect(() => tls.createSecureContext({ key, cert })).not.toThrow();
  });

  it("generates different certs on each call", () => {
    const a = generateSelfSignedCert();
    const b = generateSelfSignedCert();
    expect(a.key).not.toBe(b.key);
    expect(a.cert).not.toBe(b.cert);
  });
});
