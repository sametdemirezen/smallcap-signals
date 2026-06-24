import { YahooProvider } from "./src/provider";
import { evaluateQuality, defaultConfig } from "./src/quality";
import { loadSeed } from "./src/seed";
import { cached } from "./src/cache";

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
  let passed = 0;
  for (const s of stocks) {
    const q = evaluateQuality(s, defaultConfig);
    if (q.passed) {
      passed++;
      continue;
    }
    for (const r of q.reasons)
      reasonCounts.set(r, (reasonCounts.get(r) ?? 0) + 1);
  }

  console.log(
    `\nUniverse: ${passed}/${stocks.length} passed (${stocks.length - passed} rejected).`,
  );
  for (const [r, n] of [...reasonCounts].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${r}`);
  }
}

main();
