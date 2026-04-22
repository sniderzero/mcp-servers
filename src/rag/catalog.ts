import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { CatalogEntry, EmbeddingsIndex } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Project root: from build/rag/ up two levels to the project root */
const PROJECT_ROOT = resolve(__dirname, "..", "..");

const CATALOG_DIR = resolve(PROJECT_ROOT, "catalog");

const CATALOG_FILES = [
  "mail.json",
  "calendar.json",
  "teams.json",
  "sharepoint.json",
  "todo.json",
  "planner.json",
  "users.json",
] as const;

/**
 * Synchronously load all catalog JSON files and merge them into a single flat array.
 * Reads from the catalog/ directory at the project root.
 */
export function loadCatalog(): CatalogEntry[] {
  const entries: CatalogEntry[] = [];

  for (const file of CATALOG_FILES) {
    const filePath = resolve(CATALOG_DIR, file);
    const raw = readFileSync(filePath, "utf-8");
    const parsed: CatalogEntry[] = JSON.parse(raw);
    entries.push(...parsed);
  }

  return entries;
}

/**
 * Synchronously load the pre-computed embeddings index from catalog/embeddings.json.
 */
export function loadEmbeddings(): EmbeddingsIndex {
  const filePath = resolve(CATALOG_DIR, "embeddings.json");
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as EmbeddingsIndex;
}
