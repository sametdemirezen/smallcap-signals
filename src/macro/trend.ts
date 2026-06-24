import YahooFinance from "yahoo-finance2";
import type { SignalResult } from "./signals";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export function ema(values: number[], period: number): number {
  if (values.length < period)
    throw new Error(`need >= ${period} values, got ${values.length}`);
  const k = 2 / (period + 1);
  let e = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < values.length; i++) {
    e = values[i] * k + e * (1 - k);
  }
  return e;
}

export async function computeTrendSignal(
  symbol = "^GSPC",
  period = 200,
): Promise<SignalResult> {
  const period1 = new Date();
  period1.setMonth(period1.getMonth() - 14); // ~14 months -> > 200 trading days

  const chart = await yf.chart(symbol, { period1, interval: "1d" });
  const closes = chart.quotes
    .map((q) => q.close)
    .filter((c): c is number => c != null);

  if (closes.length < period) {
    return { name: "Trend", value: "insufficient data", vote: 0 };
  }

  const e = ema(closes, period);
  const price = closes[closes.length - 1];
  const vote = price > e ? 1 : price < e ? -1 : 0;
  const pct = ((price - e) / e) * 100;

  return {
    name: "Trend",
    value: `${symbol} ${price.toFixed(0)} vs EMA200 ${e.toFixed(0)} (${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%)`,
    vote,
  };
}
