import fs from "node:fs";
import { loadAndRank } from "../src/scoring/rankMomentum";

async function main() {
  const raw = JSON.parse(fs.readFileSync("data/universe.json", "utf-8"));
  const symbols: string[] = (
    Array.isArray(raw)
      ? raw.map((x: unknown) =>
          typeof x === "string" ? x : (x as { symbol?: string }).symbol,
        )
      : Object.keys(raw)
  ).filter((s: unknown): s is string => typeof s === "string");

  const ranked = await loadAndRank(symbols);

  const fmt = (r: { symbol: string; momentum: number | null; z: number }) =>
    `  ${r.symbol.padEnd(6)} mom ${(r.momentum ?? 0).toFixed(1).padStart(7)}%  z ${r.z >= 0 ? "+" : ""}${r.z.toFixed(2)}`;

  console.log(
    `Momentum ranking — ${ranked.length} stocks (12-1 month, universe-relative z-score)\n`,
  );
  console.log("TOP 20 (strongest momentum):");
  ranked.slice(0, 20).forEach((r) => console.log(fmt(r)));
  console.log("\nBOTTOM 20 (weakest momentum):");
  ranked.slice(-20).forEach((r) => console.log(fmt(r)));
}

main();
