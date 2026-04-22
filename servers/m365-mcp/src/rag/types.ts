export interface CatalogEntry {
  id: string;
  description: string;
  examples: string[];
  service: "mail" | "calendar" | "teams" | "sharepoint" | "todo" | "planner" | "users";
  endpoint: string;
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  scopes: string[];
  body_template?: Record<string, unknown>;
  query_params?: Record<string, string>;
  notes?: string;
  tags: string[];
}

export interface SearchResult extends CatalogEntry {
  score: number;
}

export interface EmbeddingsIndex {
  model: string;
  dimensions: number;
  entries: Record<string, number[]>;
}

export interface EntityProperty {
  type: string;
  description: string;
  filterable?: boolean;
  searchable?: boolean;
  sortable?: boolean;
}

export interface EntitySchema {
  description: string;
  properties: Record<string, EntityProperty>;
}
