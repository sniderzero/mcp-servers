import { describe, it, expect } from "vitest";
import { extractValue, extractArray, buildReference } from "../../utils/xmlHelpers.js";

describe("extractValue", () => {
  it("traverses a dot-separated path", () => {
    const obj = { a: { b: { c: "found" } } };
    expect(extractValue(obj, "a.b.c")).toBe("found");
  });

  it("unwraps single-element arrays", () => {
    const obj = { a: [{ b: "unwrapped" }] };
    expect(extractValue(obj, "a.b")).toBe("unwrapped");
  });

  it("extracts text node from xml2js format", () => {
    const obj = { field: { _: "textValue", $: { attr: "x" } } };
    expect(extractValue(obj, "field")).toBe("textValue");
  });

  it("returns undefined for null input", () => {
    expect(extractValue(null, "a.b")).toBeUndefined();
  });

  it("returns undefined for missing path", () => {
    expect(extractValue({ a: 1 }, "a.b.c")).toBeUndefined();
  });

  it("returns undefined for undefined input", () => {
    expect(extractValue(undefined, "a")).toBeUndefined();
  });

  it("returns undefined when traversing a non-object", () => {
    expect(extractValue({ a: "string" }, "a.b")).toBeUndefined();
  });

  it("does not unwrap multi-element arrays", () => {
    const obj = { items: [1, 2, 3] };
    expect(extractValue(obj, "items")).toEqual([1, 2, 3]);
  });
});

describe("extractArray", () => {
  it("returns array as-is when value is an array", () => {
    const obj = { items: [1, 2, 3] };
    expect(extractArray(obj, "items")).toEqual([1, 2, 3]);
  });

  it("wraps single object in an array", () => {
    const obj = { item: { id: 1 } };
    expect(extractArray(obj, "item")).toEqual([{ id: 1 }]);
  });

  it("returns empty array for null value", () => {
    expect(extractArray(null, "items")).toEqual([]);
  });

  it("returns empty array for undefined path", () => {
    expect(extractArray({ a: 1 }, "b")).toEqual([]);
  });

  it("handles nested dot-path to array", () => {
    const obj = { Response_Data: { Invoice: [{ id: 1 }, { id: 2 }] } };
    expect(extractArray(obj, "Response_Data.Invoice")).toEqual([{ id: 1 }, { id: 2 }]);
  });
});

describe("buildReference", () => {
  it("builds a Workday reference object", () => {
    const ref = buildReference("Supplier_ID", "SUP-001");
    expect(ref).toEqual({
      ID: [{ $value: "SUP-001", attributes: { "wd:type": "Supplier_ID" } }],
    });
  });

  it("works with different reference types", () => {
    const ref = buildReference("Currency_ID", "USD");
    const id = (ref.ID as Array<{ $value: string; attributes: Record<string, string> }>)[0];
    expect(id.$value).toBe("USD");
    expect(id.attributes["wd:type"]).toBe("Currency_ID");
  });
});
