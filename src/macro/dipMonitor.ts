import YahooFinance from "yahoo-finance2";
import { FredClient } from "./fred";
import { ema } from "./trend";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export interface PriceStructure {
  price: number;
  change3d: number;
  drawdown20d: number;
  ema200: number;
  pctVs200: number;
  above200: boolean;
  ema50: number;
  pctVs50: number;
  above50: boolean;
}

export function computePriceStructure(closes: number[]): PriceStructure {
  const price = closes[closes.length - 1];
  const ema200 = ema(closes, 200);
  const ema50 = ema(closes, 50);
  const c3 = closes[closes.length - 4] ?? price;
  const last20 = closes.slice(-20);
  const high20 = Math.max(...last20);
  return {
    price,
    change3d: ((price - c3) / c3) * 100,
    drawdown20d: ((price - high20) / high20) * 100,
    ema200,
    pctVs200: ((price - ema200) / ema200) * 100,
    above200: price > ema200,
    ema50,
    pctVs50: ((price - ema50) / ema50) * 100,
    above50: price > ema50,
  };
}

export interface ReentrySignals {
  dayChange: number;
  volRatio: number; // today's volume vs 5-day average
  strongUpDay: boolean; // up >=1.25% on above-average volume
  reclaimed50: boolean; // dipped below 50d recently, now back above
}

// Pure + testable: re-entry confirmation from price + volume.
export function computeReentrySignals(
  closes: number[],
  volumes: number[],
  ema50: number,
): ReentrySignals {
  const n = closes.length;
  const price = closes[n - 1];
  const prev = closes[n - 2] ?? price;
  const dayChange = ((price - prev) / prev) * 100;

  const prior5Vol = volumes.slice(n - 6, n - 1); // 5 days before today
  const volAvg5 = prior5Vol.length
    ? prior5Vol.reduce((a, b) => a + b, 0) / prior5Vol.length
    : 0;
  const volRatio = volAvg5 > 0 ? volumes[n - 1] / volAvg5 : 1; // 1 = neutral if volume missing

  const strongUpDay = dayChange >= 1.25 && volRatio > 1;
  const recentLow = Math.min(...closes.slice(n - 6, n - 1)); // prior 5 closes
  const reclaimed50 = price > ema50 && recentLow < ema50;

  return { dayChange, volRatio, strongUpDay, reclaimed50 };
}

export interface DipReadout extends PriceStructure, ReentrySignals {
  symbol: string;
  hySpread: number;
  hyChange: number;
  hyWidening: boolean;
  vix: number;
  vix5dHigh: number;
  vixChange: number;
}

export async function runDipMonitor(
  fred: FredClient,
  symbol = "^GSPC",
): Promise<DipReadout> {
  const period1 = new Date();
  period1.setMonth(period1.getMonth() - 14);
  const chart = await yf.chart(symbol, { period1, interval: "1d" });
  const valid = chart.quotes.filter((q) => q.close != null);
  const closes = valid.map((q) => q.close as number);
  const volumes = valid.map((q) => q.volume ?? 0);

  const ps = computePriceStructure(closes);
  const re = computeReentrySignals(closes, volumes, ps.ema50);

  const hy = await fred.getObservations("BAMLH0A0HYM2", 6);
  const hySpread = hy[0]?.value ?? NaN;
  const hyChange = hySpread - (hy[1]?.value ?? hySpread);

  const vx = await fred.getObservations("VIXCLS", 6);
  const vix = vx[0]?.value ?? NaN;
  const vixChange = vix - (vx[1]?.value ?? vix);
  const vix5dHigh = Math.max(...vx.slice(0, 5).map((o) => o.value));

  return {
    symbol,
    ...ps,
    ...re,
    hySpread,
    hyChange,
    hyWidening: hyChange > 0.05,
    vix,
    vix5dHigh,
    vixChange,
  };
}

export function formatDipReadout(r: DipReadout): string {
  const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
  const sg = (n: number, d = 2) => `${n >= 0 ? "+" : ""}${n.toFixed(d)}`;
  const L: string[] = [];
  L.push(`Daily dip monitor — ${r.symbol}`);
  L.push("");
  L.push("Price structure");
  L.push(
    `  price ${r.price.toFixed(0)} | 3-day ${pct(r.change3d)} | off 20d high ${pct(r.drawdown20d)}`,
  );
  L.push(
    `  vs 200-day ${r.ema200.toFixed(0)}: ${pct(r.pctVs200)}  → ${r.above200 ? "above — trend intact (dip)" : "BELOW — trend break (warning)"}`,
  );
  L.push(
    `  vs 50-day  ${r.ema50.toFixed(0)}: ${pct(r.pctVs50)}  → ${r.above50 ? "above — holding" : "below — lost short-term support"}`,
  );
  L.push("");
  L.push("Re-entry signals");
  L.push(
    `  today ${sg(r.dayChange, 1)}% on ${r.volRatio.toFixed(1)}× avg volume  → ${r.strongUpDay ? "strong up day ✓ (volume-backed)" : "no thrust yet"}`,
  );
  L.push(
    `  50-day reclaim: ${r.reclaimed50 ? "yes (dipped below, now back above)" : "no"}`,
  );
  L.push("");
  L.push("Credit — the key tell");
  L.push(
    `  HY spread ${r.hySpread.toFixed(2)}% | Δ1d ${sg(r.hyChange)}  → ${r.hyWidening ? "WIDENING — confirming stress" : "calm — not confirming risk-off"}`,
  );
  L.push(
    `  line in the sand: > 4% = selloff has teeth (now ${r.hySpread < 4 ? "below" : "ABOVE"})`,
  );
  L.push("");
  L.push("Volatility");
  L.push(
    `  VIX ${r.vix.toFixed(1)} | 5-day high ${r.vix5dHigh.toFixed(1)} | Δ1d ${sg(r.vixChange, 1)}  → ${r.vix < r.vix5dHigh - 2 ? "off peak — fading (washout?)" : "near peak — still bid"}`,
  );
  L.push("");
  const breakdown = !r.above200 || r.hySpread >= 4 || r.hyChange > 0.15;
  const reEntry =
    !breakdown &&
    r.above200 &&
    (r.strongUpDay || r.reclaimed50) &&
    !r.hyWidening;
  if (breakdown) {
    L.push(
      "READ: breakdown risk — trend or credit confirming. Favor defense; wait, do not add.",
    );
  } else if (reEntry) {
    const why = [
      r.strongUpDay ? "volume-backed up day" : "",
      r.reclaimed50 ? "50d reclaim" : "",
    ]
      .filter(Boolean)
      .join(" + ");
    L.push(
      `READ: RE-ENTRY signal — ${why}, credit calm. Confirmation present; this is where you add.`,
    );
  } else {
    L.push(
      "READ: dip-like — trend intact, credit calm. Watch for re-entry confirmation (volume-backed up day, 50d reclaim).",
    );
  }
  return L.join("\n");
}
