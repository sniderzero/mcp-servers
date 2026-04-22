export function parseLinkHeader(header: string | null): { next?: string } {
  if (!header) return {};
  const result: { next?: string } = {};
  for (const part of header.split(",")) {
    const match = part.match(/<([^>]+)>;\s*rel="([^"]+)"/);
    if (match && match[2] === "next") result.next = match[1];
  }
  return result;
}
