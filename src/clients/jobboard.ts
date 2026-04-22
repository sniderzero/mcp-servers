export class JobBoardClient {
  private readonly base = "https://boards-api.greenhouse.io/v1/boards";

  constructor(private readonly defaultToken: string) {}

  private boardUrl(token?: string): string {
    return `${this.base}/${token ?? this.defaultToken}`;
  }

  async get<T>(path: string, params?: Record<string, unknown>, boardToken?: string): Promise<T> {
    let url = `${this.boardUrl(boardToken)}${path}`;
    if (params) {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) qs.set(k, String(v));
      }
      const qstr = qs.toString();
      if (qstr) url += `?${qstr}`;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Job Board API error ${response.status}: ${await response.text()}`);
    return response.json() as Promise<T>;
  }

  async post<T>(path: string, body: unknown, apiKey: string, boardToken?: string): Promise<T> {
    const url = `${this.boardUrl(boardToken)}${path}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Job Board API error ${response.status}: ${await response.text()}`);
    return response.json() as Promise<T>;
  }
}
