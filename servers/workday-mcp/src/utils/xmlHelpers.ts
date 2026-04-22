export const WD_NS = "urn:com.workday/bsvc";

/**
 * Safely traverse a nested object using a dot-separated path.
 * Handles the xml2js / soap parser output where array wrappers may appear.
 */
export function extractValue(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;

    const record = current as Record<string, unknown>;
    current = record[part];

    // xml2js wraps single elements in arrays — unwrap if needed
    if (Array.isArray(current) && current.length === 1) {
      current = current[0];
    }
  }

  // Extract text node from xml2js format: { _: "value", $: { ... } }
  if (current !== null && typeof current === "object") {
    const record = current as Record<string, unknown>;
    if ("_" in record) return record["_"];
  }

  return current;
}

/**
 * Extract an array from a SOAP response path.
 * Handles the single-item-as-object quirk from xml2js parsing.
 */
export function extractArray(obj: unknown, path: string): unknown[] {
  const value = extractValue(obj, path);

  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value;

  // Single item returned as an object — wrap in array
  return [value];
}

/**
 * Build a Workday reference object in the format expected by SOAP operations.
 * The `soap` package uses its own xml2js conventions for input serialization:
 *   - `$value` for element text content
 *   - `attributes` for XML attributes
 * (NOT the legacy xml2js `_` / `$` keys — those produce invalid XML.)
 */
export function buildReference(type: string, id: string): Record<string, unknown> {
  return {
    ID: [
      {
        $value: id,
        attributes: { "wd:type": type },
      },
    ],
  };
}
