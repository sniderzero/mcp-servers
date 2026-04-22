/**
 * Pre-compute embeddings for all catalog entries.
 * Run: npm run build:embeddings
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const catalogDir = resolve(__dirname, "..", "catalog");
const outputPath = resolve(catalogDir, "embeddings.json");

interface CatalogEntry {
  id: string;
  description: string;
  examples: string[];
}

async function main() {
  console.log("Loading embedding model...");
  const { pipeline } = await import("@huggingface/transformers");
  const extractor = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2",
    { dtype: "q8" } as Record<string, unknown>
  );
  console.log("Model loaded.");

  // Load all catalog files
  const files = readdirSync(catalogDir).filter(
    (f) => f.endsWith(".json") && f !== "embeddings.json"
  );

  const allEntries: CatalogEntry[] = [];
  for (const file of files) {
    const data = JSON.parse(
      readFileSync(resolve(catalogDir, file), "utf-8")
    ) as CatalogEntry[];
    allEntries.push(...data);
    console.log(`  ${file}: ${data.length} entries`);
  }
  console.log(`Total: ${allEntries.length} entries`);

  // Compute embeddings
  const entries: Record<string, number[]> = {};
  for (let i = 0; i < allEntries.length; i++) {
    const entry = allEntries[i];
    const text = entry.description + " " + entry.examples.join(" ");
    const output = await extractor(text, { pooling: "mean", normalize: true });
    entries[entry.id] = Array.from(output.data as Float32Array);

    if ((i + 1) % 25 === 0 || i === allEntries.length - 1) {
      console.log(`  Embedded ${i + 1}/${allEntries.length}`);
    }
  }

  const index = {
    model: "Xenova/all-MiniLM-L6-v2",
    dimensions: 384,
    entries,
  };

  writeFileSync(outputPath, JSON.stringify(index));
  const sizeMB = (Buffer.byteLength(JSON.stringify(index)) / 1024 / 1024).toFixed(2);
  console.log(`\nWrote ${outputPath} (${sizeMB} MB, ${Object.keys(entries).length} entries)`);
}

main().catch((e) => {
  console.error("Failed to build embeddings:", e);
  process.exit(1);
});
