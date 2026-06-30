import fs from "node:fs";
import { getCloses } from "../src/scoring/prices";

async function main() {
  const raw = JSON.parse(fs.readFileSync("data/universe.json", "utf-8"));
  // Robust to shapes: ["AAPL",...] | [{symbol:"AAPL"},...] | {"AAPL":{...}}
  const symbols: string[] = (
    Array.isArray(raw)
      ? raw.map((x: unknown) =>
          typeof x === "string" ? x : (x as { symbol?: string }).symbol,
        )
      : Object.keys(raw)
  ).filter((s: unknown): s is string => typeof s === "string");

  const limit = process.argv[2]
    ? parseInt(process.argv[2], 10)
    : symbols.length;
  const subset = symbols.slice(0, limit);
  console.log(
    `Fetching price history for ${subset.length} symbols (of ${symbols.length} in universe)...`,
  );

  const t0 = Date.now();
  const closes = await getCloses(subset);
  console.log(
    `\nDone in ${((Date.now() - t0) / 1000).toFixed(1)}s. Got ${closes.size}/${subset.length} symbols.`,
  );

  console.log("\nSample:");
  for (const sym of subset.slice(0, 3)) {
    const c = closes.get(sym);
    console.log(
      c
        ? `  ${sym}: ${c.length} closes, latest ${c[c.length - 1].toFixed(2)}`
        : `  ${sym}: (failed)`,
    );
  }
}
main();
