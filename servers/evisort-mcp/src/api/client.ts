import { EvisortAuth } from "../auth/evisortAuth.js";

export class EvisortClient {
  private auth: EvisortAuth;
  private baseUrl: string;
  private auditBaseUrl: string;

  constructor(auth: EvisortAuth, baseUrl: string, auditBaseUrl: string) {
    this.auth = auth;
    this.baseUrl = baseUrl;
    this.auditBaseUrl = auditBaseUrl;
  }

  private getUrl(path: string): string {
    if (path.startsWith("/auditlog")) {
      return `${this.auditBaseUrl}${path}`;
    }
    return `${this.baseUrl}${path}`;
  }

  private async headers(): Promise<Record<string, string>> {
    const token = await this.auth.getToken();
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  async get(
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<unknown> {
    const url = new URL(this.getUrl(path));
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: await this.headers(),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GET ${path} failed: ${response.status} ${text}`);
    }
    return response.json();
  }

  async post(path: string, body?: unknown): Promise<unknown> {
    const response = await fetch(this.getUrl(path), {
      method: "POST",
      headers: await this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`POST ${path} failed: ${response.status} ${text}`);
    }
    return response.json();
  }

  async postMultipart(
    path: string,
    formData: FormData
  ): Promise<unknown> {
    const token = await this.auth.getToken();
    const response = await fetch(this.getUrl(path), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `POST multipart ${path} failed: ${response.status} ${text}`
      );
    }
    return response.json();
  }

  async patch(path: string, body?: unknown): Promise<unknown> {
    const response = await fetch(this.getUrl(path), {
      method: "PATCH",
      headers: await this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`PATCH ${path} failed: ${response.status} ${text}`);
    }
    return response.json();
  }

  async delete(path: string): Promise<unknown> {
    const response = await fetch(this.getUrl(path), {
      method: "DELETE",
      headers: await this.headers(),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`DELETE ${path} failed: ${response.status} ${text}`);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  }
}
