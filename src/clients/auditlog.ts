import { getJwt } from "../auth/auditlog.js";
import { fetchWithRetry } from "../utils/rate-limit.js";
import { GreenhouseApiError } from "../utils/errors.js";

export class AuditLogClient {
  private readonly baseUrl = "https://auditlog.us.greenhouse.io";

  constructor(
    private readonly harvestKey: string,
    private readonly userId: string,
  ) {}

  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const token = await getJwt(this.harvestKey, this.userId);
    let url = `${this.baseUrl}${path}`;
    if (params) {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null) continue;
        if (Array.isArray(v)) {
          v.forEach(item => qs.append(`${k}[]`, String(item)));
        } else {
          qs.set(k, String(v));
        }
      }
      const qstr = qs.toString();
      if (qstr) url += `?${qstr}`;
    }
    const response = await fetchWithRetry(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new GreenhouseApiError(response.status, await response.text());
    return response.json() as Promise<T>;
  }
}
