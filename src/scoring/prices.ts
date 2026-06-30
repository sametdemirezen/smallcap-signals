import YahooFinance from "yahoo-finance2";
import { cached } from "../cache";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// Daily closes for one symbol (~15 months > 1yr for 12-1 momentum). null on failure.
async function fetchCloses(symbol: string): Promise<number[] | null> {
  try {
    const period1 = new Date();
    period1.setMonth(period1.getMonth() - 15);
    const chart = await yf.chart(symbol, { period1, interval: "1d" });
    const closes = chart.quotes
      .map((q) => q.close)
      .filter((c): c is number => c != null);
    return closes.length ? closes : null;
  } catch {
    return null; // delisted / bad symbol / transient — skip gracefully, don't crash the batch
  }
}

// Run `fn` over items with at most `limit` in flight at once. Order preserved.
export async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const idx = next++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  );
  return results;
}

// Daily closes for each symbol, cached on disk (24h). Failures skipped.
// Cache key includes count so a subset smoke-test (e.g. 20) doesn't clobber the full set.
export async function getCloses(
  symbols: string[],
): Promise<Map<string, number[]>> {
  const data = await cached(
    `prices-${symbols.length}`,
    24 * 60 * 60 * 1000,
    async () => {
      const pairs = await mapPool(
        symbols,
        6,
        async (sym) => [sym, await fetchCloses(sym)] as const,
      );
      const obj: Record<string, number[]> = {};
      let ok = 0;
      for (const [sym, closes] of pairs) {
        if (closes) {
          obj[sym] = closes;
          ok++;
        }
      }
      console.log(`[prices] fetched ${ok}/${symbols.length} symbols`);
      return obj;
    },
  );
  return new Map(Object.entries(data));
}
