import { getHarvestToken } from "../auth/harvest.js";
import { fetchWithRetry } from "../utils/rate-limit.js";
import { parseLinkHeader } from "../utils/pagination.js";
import { GreenhouseApiError } from "../utils/errors.js";

export interface HarvestResponse<T = unknown> {
  data: T;
  pagination?: { next?: string };
}

export class HarvestClient {
  private readonly baseUrl = "https://harvest.greenhouse.io/v3";
  private resolvedUserId?: string;

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly defaultUserId?: string,
  ) {}

  async emailToUserId(email: string): Promise<string> {
    const token = await getHarvestToken(this.clientId, this.clientSecret);
    const url = `${this.baseUrl}/users?${new URLSearchParams({ primary_email: email })}`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new GreenhouseApiError(response.status, await response.text());
    const users = await response.json() as Array<{ id: number }>;
    if (!users.length) throw new Error(`No Greenhouse user found for email: ${email}`);
    return String(users[0].id);
  }

  private async resolveDefaultUserId(): Promise<string | undefined> {
    if (this.resolvedUserId) return this.resolvedUserId;
    const explicit = process.env.GREENHOUSE_HARVEST_USER_ID ?? this.defaultUserId;
    if (explicit) return explicit;
    const email = process.env.GREENHOUSE_HARVEST_USER_EMAIL;
    if (!email) return undefined;
    this.resolvedUserId = await this.emailToUserId(email);
    return this.resolvedUserId;
  }

  private async resolveOnBehalfOf(onBehalfOf?: string): Promise<string | undefined> {
    if (!onBehalfOf) return this.resolveDefaultUserId();
    if (onBehalfOf.includes("@")) return this.emailToUserId(onBehalfOf);
    return onBehalfOf;
  }

  private async request<T>(
    method: string,
    path: string,
    params?: Record<string, unknown>,
    body?: unknown,
    onBehalfOf?: string,
  ): Promise<HarvestResponse<T>> {
    let url = `${this.baseUrl}${path}`;
    if (params && method === "GET") {
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

    const userId = await this.resolveOnBehalfOf(onBehalfOf);
    const token = await getHarvestToken(this.clientId, this.clientSecret, userId);

    const response = await fetchWithRetry(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) throw new GreenhouseApiError(response.status, await response.text());

    const data = await response.json() as T;
    const pagination = parseLinkHeader(response.headers.get("Link"));
    return { data, pagination };
  }

  get<T>(path: string, params?: Record<string, unknown>, onBehalfOf?: string) {
    return this.request<T>("GET", path, params, undefined, onBehalfOf);
  }
  post<T>(path: string, body?: unknown, onBehalfOf?: string) {
    return this.request<T>("POST", path, undefined, body, onBehalfOf);
  }
  patch<T>(path: string, body?: unknown, onBehalfOf?: string) {
    return this.request<T>("PATCH", path, undefined, body, onBehalfOf);
  }
  delete<T>(path: string, onBehalfOf?: string) {
    return this.request<T>("DELETE", path, undefined, undefined, onBehalfOf);
  }
}
