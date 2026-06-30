import { YahooProvider } from "./src/provider";
import { evaluateQuality, defaultConfig } from "./src/quality";
import { loadSeed } from "./src/seed";
import { cached } from "./src/cache";
import fs from "node:fs";

const DAY = 24 * 60 * 60 * 1000;

async function main() {
  const universe = loadSeed();
  const provider = new YahooProvider();
  console.log(`Universe: ${universe.length} symbols`);

  const stocks = await cached("universe-stocks", DAY, () => {
    console.log(`Fetching via ${provider.name}...`);
    return provider.getMany(universe);
  });

  const reasonCounts = new Map<string, number>();
  const passedSymbols: string[] = [];

  for (const s of stocks) {
    const q = evaluateQuality(s, defaultConfig);
    if (q.passed) {
      passedSymbols.push(s.symbol);
      continue;
    }
    for (const r of q.reasons)
      reasonCounts.set(r, (reasonCounts.get(r) ?? 0) + 1);
  }

  console.log(
    `\nUniverse: ${passedSymbols.length}/${stocks.length} passed (${stocks.length - passedSymbols.length} rejected).`,
  );
  for (const [r, n] of [...reasonCounts].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${r}`);
  }

  // Persist the passed universe so the scoring layer can read it.
  fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync(
    "data/universe.json",
    JSON.stringify(passedSymbols, null, 2),
  );
  console.log(`\nWrote ${passedSymbols.length} symbols to data/universe.json`);
}

main();
