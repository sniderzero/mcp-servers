export function buildBasicAuthHeader(accessKey: string, secretKey: string): string {
  const encoded = Buffer.from(`${accessKey}:${secretKey}`).toString("base64");
  return `Basic ${encoded}`;
}
