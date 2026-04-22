import { describe, it, expect } from "vitest";
import { McpError } from "@modelcontextprotocol/sdk/types.js";
import {
  classifySoapFault,
  classifyRestError,
  normalizeError,
  FaultType,
} from "../../utils/errorHandler.js";

describe("classifySoapFault", () => {
  it("classifies 401 as AUTH_EXPIRED", () => {
    expect(classifySoapFault({ statusCode: 401 })).toBe(FaultType.AUTH_EXPIRED);
  });

  it("classifies 429 as RETRYABLE", () => {
    expect(classifySoapFault({ statusCode: 429 })).toBe(FaultType.RETRYABLE);
  });

  it("classifies 503 as RETRYABLE", () => {
    expect(classifySoapFault({ statusCode: 503 })).toBe(FaultType.RETRYABLE);
  });

  it("classifies VALIDATION_ERROR faultcode as PERMANENT", () => {
    expect(classifySoapFault({ faultcode: "VALIDATION_ERROR" })).toBe(FaultType.PERMANENT);
  });

  it("classifies Client faultcode as PERMANENT", () => {
    expect(classifySoapFault({ faultcode: "Client.InvalidInput" })).toBe(FaultType.PERMANENT);
  });

  it("classifies Server faultcode as RETRYABLE", () => {
    expect(classifySoapFault({ faultcode: "Server.InternalError" })).toBe(FaultType.RETRYABLE);
  });

  it("classifies 500 as RETRYABLE", () => {
    expect(classifySoapFault({ statusCode: 500 })).toBe(FaultType.RETRYABLE);
  });

  it("classifies 502 as RETRYABLE", () => {
    expect(classifySoapFault({ statusCode: 502 })).toBe(FaultType.RETRYABLE);
  });

  it("classifies unknown faultcode as PERMANENT", () => {
    expect(classifySoapFault({ faultcode: "SomethingElse" })).toBe(FaultType.PERMANENT);
  });

  it("classifies empty fault as PERMANENT", () => {
    expect(classifySoapFault({})).toBe(FaultType.PERMANENT);
  });
});

describe("classifyRestError", () => {
  it("classifies 401 as AUTH_EXPIRED", () => {
    expect(classifyRestError({ status: 401 })).toBe(FaultType.AUTH_EXPIRED);
  });

  it("classifies 429 as RETRYABLE", () => {
    expect(classifyRestError({ status: 429 })).toBe(FaultType.RETRYABLE);
  });

  it("classifies 503 as RETRYABLE", () => {
    expect(classifyRestError({ status: 503 })).toBe(FaultType.RETRYABLE);
  });

  it("classifies ETIMEDOUT as RETRYABLE", () => {
    expect(classifyRestError({ code: "ETIMEDOUT" })).toBe(FaultType.RETRYABLE);
  });

  it("classifies ECONNRESET as RETRYABLE", () => {
    expect(classifyRestError({ code: "ECONNRESET" })).toBe(FaultType.RETRYABLE);
  });

  it("classifies ECONNREFUSED as RETRYABLE", () => {
    expect(classifyRestError({ code: "ECONNREFUSED" })).toBe(FaultType.RETRYABLE);
  });

  it("classifies 500+ as RETRYABLE", () => {
    expect(classifyRestError({ status: 502 })).toBe(FaultType.RETRYABLE);
  });

  it("classifies 400 as PERMANENT", () => {
    expect(classifyRestError({ status: 400 })).toBe(FaultType.PERMANENT);
  });

  it("classifies unknown as PERMANENT", () => {
    expect(classifyRestError({})).toBe(FaultType.PERMANENT);
  });
});

describe("normalizeError", () => {
  it("returns McpError unchanged", () => {
    const err = new McpError(1, "test");
    expect(normalizeError(err)).toBe(err);
  });

  it("wraps a generic Error as McpError", () => {
    const err = new Error("something broke");
    const result = normalizeError(err);
    expect(result).toBeInstanceOf(McpError);
    expect(result.message).toContain("something broke");
  });

  it("wraps a 401 error with auth expired message", () => {
    const err = Object.assign(new Error("unauthorized"), { statusCode: 401 });
    const result = normalizeError(err);
    expect(result.message).toContain("Authentication expired");
  });

  it("wraps a 429 error with rate limit message", () => {
    const err = Object.assign(new Error("too many"), { status: 429 });
    const result = normalizeError(err);
    expect(result.message).toContain("Rate limit exceeded");
  });

  it("wraps a SOAP faultcode error", () => {
    const err = Object.assign(new Error("bad request"), { faultcode: "Client.Validation" });
    const result = normalizeError(err);
    expect(result.message).toContain("SOAP fault");
    expect(result.message).toContain("Client.Validation");
  });

  it("wraps non-Error values as string", () => {
    const result = normalizeError("string error");
    expect(result).toBeInstanceOf(McpError);
    expect(result.message).toContain("string error");
  });
});
