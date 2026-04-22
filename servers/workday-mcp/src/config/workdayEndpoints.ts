export const WORKDAY_API_VERSIONS: Record<string, string> = {
  Financial_Management: "v44.2",
  Resource_Management: "v42.1",
  Human_Resources: "v44.0",
};

/**
 * Returns the WSDL URL for a Workday SOAP service.
 * tenantUrl may use /ccx/api/v1/, /ccx/service/, or other paths.
 * SOAP WSDLs always live under /ccx/service/<tenant>/<service>/<version>?wsdl
 */
export function getWsdlUrl(tenantUrl: string, service: string): string {
  const version = WORKDAY_API_VERSIONS[service] ?? "v44.2";
  const url = new URL(tenantUrl.startsWith("http") ? tenantUrl : `https://${tenantUrl}`);
  // Tenant name is always the last path segment
  const segments = url.pathname.replace(/\/+$/, "").split("/");
  const tenantName = segments[segments.length - 1];
  return `${url.origin}/ccx/service/${tenantName}/${service}/${version}?wsdl`;
}

/**
 * Returns the REST base URL for a Workday REST endpoint.
 * tenantUrl: e.g. https://wd2-impl-services1.workday.com/ccx/service/mycompany
 * endpoint: e.g. "/financial-management/v1/businessUnits"
 */
export function getRestUrl(tenantUrl: string, endpoint: string): string {
  const base = tenantUrl.replace(/\/$/, "");
  return `${base}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
}
