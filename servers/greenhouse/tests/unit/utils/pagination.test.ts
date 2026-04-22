import { describe, it, expect } from "vitest";
import { parseLinkHeader } from "../../../src/utils/pagination.js";

describe("parseLinkHeader", () => {
  it("parses full link header", () => {
    const header =
      '<https://example.com/next>; rel="next", <https://example.com/prev>; rel="prev", <https://example.com/last>; rel="last"';
    const result = parseLinkHeader(header);
    expect(result.next).toBe("https://example.com/next");
    expect(result.prev).toBe("https://example.com/prev");
    expect(result.last).toBe("https://example.com/last");
  });

  it("parses only next link", () => {
    const result = parseLinkHeader('<https://example.com/next>; rel="next"');
    expect(result.next).toBe("https://example.com/next");
    expect(result.prev).toBeUndefined();
  });

  it("returns empty object for null", () => {
    expect(parseLinkHeader(null)).toEqual({});
  });

  it("returns empty object for empty string", () => {
    expect(parseLinkHeader("")).toEqual({});
  });

  it("handles URL with special characters", () => {
    const url = "https://example.com/api?foo=bar&baz=qux%20encoded";
    const result = parseLinkHeader(`<${url}>; rel="next"`);
    expect(result.next).toBe(url);
  });
});
