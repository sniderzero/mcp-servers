export interface FreshServiceConfig {
  apiKey: string;
  domain: string;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
}

export interface FreshServiceError {
  description: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export interface ApiResponse<T> {
  data: T;
  headers: Headers;
}

export interface CrudToolsConfig {
  resourceName: string;
  resourceNamePlural: string;
  apiPath: string;
  responseKey: string;
  responsePluralKey: string;
  createSchema: Record<string, unknown>;
  updateSchema: Record<string, unknown>;
  description: string;
  supportsRestore?: boolean;
  listParams?: Record<string, unknown>;
}

export interface NestedCrudToolsConfig {
  parentName: string;
  childName: string;
  childNamePlural: string;
  apiPathTemplate: string;
  responseKey: string;
  responsePluralKey: string;
  createSchema: Record<string, unknown>;
  updateSchema?: Record<string, unknown>;
  description: string;
}
