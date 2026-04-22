import type { FeatureExtractionPipeline } from "@huggingface/transformers";
import type { CatalogEntry, SearchResult, EmbeddingsIndex } from "./types.js";

// Module-level cache for the pipeline instance
let extractor: FeatureExtractionPipeline | null = null;

/**
 * Lazy-load the HuggingFace transformers feature-extraction pipeline.
 * Uses the quantized Xenova/all-MiniLM-L6-v2 model (q8) for smaller/faster inference.
 */
export async function initModel(): Promise<void> {
  if (extractor) return;

  process.stderr.write("Loading embedding model Xenova/all-MiniLM-L6-v2...\n");
  const mod = await import("@huggingface/transformers");
  const create = mod.pipeline as (
    task: string,
    model: string,
    options: Record<string, unknown>,
  ) => Promise<FeatureExtractionPipeline>;
  extractor = await create("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
    dtype: "q8",
  });
  process.stderr.write("Embedding model loaded.\n");
}

/**
 * Embed a single text string using the feature-extraction pipeline.
 * Returns a plain number[] embedding vector (normalized, mean-pooled).
 */
export async function embedText(text: string): Promise<number[]> {
  await initModel();

  const output = await extractor!(text, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data as Float32Array);
}

/**
 * Compute cosine similarity between two embedding vectors.
 * Since embeddings are normalized (norm=1), this is simply the dot product.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

/**
 * Search the catalog using semantic similarity.
 * Embeds the query, computes cosine similarity against all catalog entry embeddings,
 * applies optional filters, and returns the top K results sorted by score descending.
 */
export async function search(
  query: string,
  catalog: CatalogEntry[],
  embeddings: EmbeddingsIndex,
  topK: number,
  filters?: { service?: string; method?: string },
): Promise<SearchResult[]> {
  const queryEmbedding = await embedText(query);

  const scored: SearchResult[] = [];

  for (const entry of catalog) {
    // Apply optional filters
    if (filters?.service && entry.service !== filters.service) continue;
    if (filters?.method && entry.method !== filters.method) continue;

    const entryEmbedding = embeddings.entries[entry.id];
    if (!entryEmbedding) continue;

    const score = cosineSimilarity(queryEmbedding, entryEmbedding);
    scored.push({ ...entry, score });
  }

  // Sort by score descending and return top K
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
