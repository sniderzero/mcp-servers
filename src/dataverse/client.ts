const DV_API_VERSION = "v9.2";

export function dvApiBase(envUrl: string): string {
  return `${envUrl.replace(/\/$/, "")}/api/data/${DV_API_VERSION}`;
}

export async function dvFetch<T>(
  envUrl: string,
  endpoint: string,
  token: string,
  options?: RequestInit
): Promise<T> {
  const base = dvApiBase(envUrl);
  const url = endpoint.startsWith("http") ? endpoint : `${base}/${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
      Accept: "application/json",
      "Content-Type": "application/json",
      Prefer: "odata.include-annotations=*",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Dataverse ${res.status}: ${body}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

/** Follows @odata.nextLink to collect all pages */
export async function dvFetchAll<T>(
  envUrl: string,
  endpoint: string,
  token: string
): Promise<T[]> {
  const all: T[] = [];
  let url: string | undefined = endpoint;

  while (url) {
    const page: { value: T[]; "@odata.nextLink"?: string } = await dvFetch(
      envUrl,
      url,
      token
    );
    if (page.value) all.push(...page.value);
    url = page["@odata.nextLink"];
  }

  return all;
}
