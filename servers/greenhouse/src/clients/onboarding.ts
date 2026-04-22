import { buildBasicAuthHeader } from "../auth/onboarding.js";
import { GreenhouseApiError } from "../utils/errors.js";

export interface GraphQLResponse<T = unknown> {
  data: T;
  rateLimit?: { remaining: number; resetAt: string };
}

export class OnboardingClient {
  private readonly url = "https://onboarding-api.greenhouse.io/graphql";
  private readonly authHeader: string;

  constructor(accessKey: string, secretKey: string) {
    this.authHeader = buildBasicAuthHeader(accessKey, secretKey);
  }

  async query<T>(query: string, variables?: Record<string, unknown>): Promise<GraphQLResponse<T>> {
    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) throw new GreenhouseApiError(response.status, await response.text());

    const json = await response.json() as {
      data: T;
      errors?: unknown[];
      extensions?: { rateLimit?: { remaining: number; resetAt: string } };
    };
    if (json.errors?.length) {
      throw new GreenhouseApiError(200, json.errors, "GraphQL errors");
    }

    return { data: json.data, rateLimit: json.extensions?.rateLimit };
  }
}
