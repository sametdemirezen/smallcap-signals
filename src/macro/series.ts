import type { MonitorSeries } from "./monitor";

// The raw FRED series that feed the regime SCORE, annotated for humans.
// `critical` here shows our ACTUAL vote thresholds (from signals.ts).
export const SCORING_SERIES: MonitorSeries[] = [
  {
    id: "BAMLH0A0HYM2",
    label: "HY credit spread",
    unit: "%",
    what: "Extra yield on junk bonds vs Treasuries (risk appetite)",
    bull: "tight / low → strong risk appetite",
    bear: "widening → money fleeing risk",
    critical: "vote: <4% on, >6% off",
  },
  {
    id: "VIXCLS",
    label: "VIX",
    unit: "",
    what: "Implied volatility of S&P options (fear index)",
    bull: "low → calm market",
    bear: "high / spiking → fear",
    critical: "vote: <15 on, >25 off",
  },
  {
    id: "T10Y2Y",
    label: "Yield curve 10Y-2Y",
    unit: "%",
    what: "10y minus 2y Treasury yield (recession gauge)",
    bull: "positive / steep → healthy",
    bear: "inverted (<0) → recession warning",
    critical: "vote: >0.5 on, <0 off",
  },
  {
    id: "DFF",
    label: "Fed funds rate",
    unit: "%",
    what: "Policy rate — the price of money",
    bull: "falling (cuts) → easing tailwind",
    bear: "rising (hikes) → tightening headwind",
    critical: "vote: 6m direction",
  },
  {
    id: "WALCL",
    label: "Fed balance sheet",
    unit: "$M",
    what: "Fed's assets — the quantity of money (QE/QT)",
    bull: "growing (QE) → liquidity added",
    bear: "shrinking (QT) → liquidity drained",
    critical: "vote: net-liq 3m direction",
  },
  {
    id: "CFNAI",
    label: "Growth (CFNAI)",
    unit: "",
    what: "Chicago Fed activity index (85 indicators, 0 = trend)",
    bull: "> 0 → above-trend growth",
    bear: "< -0.7 → recessionary",
    critical: "vote: >0 on, <-0.7 off",
  },
];
