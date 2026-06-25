import { FredClient } from "./fred";

export interface MonitorSeries {
  id: string;
  label: string;
  unit: string;
  what: string; // what it is, in one line
  bull: string; // reading that is risk-on (bullish)
  bear: string; // reading that is risk-off (bearish)
  critical: string; // key thresholds
}

// Informational only — NEVER feeds the regime score. You interpret these.
const MONITOR_SERIES: MonitorSeries[] = [
  {
    id: "PCEPILFE",
    label: "Core PCE",
    unit: "",
    what: "Fed's preferred inflation gauge (ex food & energy)",
    bull: "cooling toward 2% → dovish Fed → easier policy",
    bear: "hot / re-accelerating → hawkish Fed → tighter",
    critical: "~2% YoY target; >3% YoY = worry",
  },
  {
    id: "CPIAUCSL",
    label: "CPI",
    unit: "",
    what: "Headline consumer price inflation",
    bull: "falling → eases rate pressure",
    bear: "rising → keeps Fed tight",
    critical: "~2% YoY target; >4% YoY = hot",
  },
  {
    id: "T5YIFR",
    label: "Inflation exp 5y5y",
    unit: "%",
    what: "Market's expected avg inflation 5y out (forward breakeven)",
    bull: "anchored near 2% → Fed has room",
    bear: ">2.5% and rising → un-anchoring risk",
    critical: "~2% anchored; >2.5% = watch",
  },
  {
    id: "UNRATE",
    label: "Unemployment",
    unit: "%",
    what: "Share of labor force unemployed",
    bull: "low & stable → strong economy",
    bear: "rising → slowdown / recession risk",
    critical: "+0.5pp off lows = Sahm warning",
  },
  {
    id: "ICSA",
    label: "Jobless claims",
    unit: "",
    what: "Weekly new unemployment claims (leading labor signal)",
    bull: "low / falling → strong labor market",
    bear: "rising trend → labor weakening",
    critical: "<250k healthy; >300k = softening",
  },
  {
    id: "SAHMREALTIME",
    label: "Sahm rule",
    unit: "",
    what: "Recession trigger from rising unemployment",
    bull: "near 0 → no recession signal",
    bear: "≥0.5 → recession likely underway",
    critical: "0.5 = trigger",
  },
  {
    id: "INDPRO",
    label: "Industrial prod",
    unit: "",
    what: "Output of factories, mines, utilities",
    bull: "rising → expanding economy",
    bear: "falling → industrial slowdown",
    critical: "YoY < 0 = contraction",
  },
  {
    id: "GACDISA066MSFRBNY",
    label: "Empire State mfg",
    unit: "",
    what: "NY Fed manufacturing survey (PMI-like, centered at 0)",
    bull: "> 0 → factories expanding",
    bear: "< 0 → manufacturing contracting",
    critical: "0 = breakeven; first regional read each month",
  },
  {
    id: "GACDFSA066MSFRBPHI",
    label: "Philly Fed mfg",
    unit: "",
    what: "Philadelphia Fed manufacturing survey (PMI-like, centered at 0)",
    bull: "> 0 → expansion",
    bear: "< 0 → contraction",
    critical: "0 = breakeven; leads national ISM",
  },
  {
    id: "BACTSAMFRBDAL",
    label: "Dallas Fed mfg",
    unit: "",
    what: "Dallas Fed Texas manufacturing survey (PMI-like, centered at 0)",
    bull: "> 0 → expansion",
    bear: "< 0 → contraction",
    critical: "0 = breakeven",
  },
  {
    id: "BAMLC0A0CM",
    label: "IG credit spread",
    unit: "%",
    what: "Extra yield on investment-grade corporate bonds",
    bull: "tight / low → calm credit, risk appetite",
    bear: "widening → stress brewing",
    critical: "<1% calm; >2% = stress",
  },
  {
    id: "NFCI",
    label: "Financial conditions",
    unit: "",
    what: "Chicago Fed composite of 105 financial indicators",
    bull: "negative → looser-than-average conditions",
    bear: "positive / rising → tightening",
    critical: "0 = average; >0 = tighter than normal",
  },
  {
    id: "DTWEXBGS",
    label: "US dollar index",
    unit: "",
    what: "Trade-weighted value of the US dollar",
    bull: "weak / falling → easy global liquidity",
    bear: "strong / rising → tighter global conditions",
    critical: "fast spikes = stress (small-caps less hurt)",
  },
  {
    id: "DGS10",
    label: "10Y yield",
    unit: "%",
    what: "10-year Treasury yield (long-term rate)",
    bull: "stable / falling → supports valuations",
    bear: "fast rising → pressures stocks",
    critical: "speed of move > level",
  },
  {
    id: "DGS2",
    label: "2Y yield",
    unit: "%",
    what: "2-year yield (tracks Fed policy expectations)",
    bull: "falling → market expects cuts",
    bear: "rising → market expects tightening",
    critical: "vs 10Y = curve shape",
  },
  {
    id: "SOFR",
    label: "SOFR",
    unit: "%",
    what: "Secured overnight funding rate (the plumbing)",
    bull: "at/below IORB → ample reserves",
    bear: "persistently above IORB → reserves getting scarce",
    critical: "SOFR > IORB = funding-stress canary",
  },
  {
    id: "IORB",
    label: "IORB",
    unit: "%",
    what: "Interest on reserve balances (Fed policy floor)",
    bull: "reference level for SOFR",
    bear: "SOFR rising above this = stress",
    critical: "compare SOFR to this",
  },
  {
    id: "RRPONTSYD",
    label: "Reverse repo (RRP)",
    unit: "$B",
    what: "Cash parked overnight at the Fed (liquidity buffer)",
    bull: "falling → liquidity flowing back to markets",
    bear: "near-empty → buffer gone, reserves front-line",
    critical: "near 0 = buffer exhausted",
  },
  {
    id: "WTREGEN",
    label: "Treasury acct (TGA)",
    unit: "$M",
    what: "US Treasury's checking account at the Fed",
    bull: "falling (spending) → adds reserves",
    bear: "rising (issuance/taxes) → drains reserves",
    critical: "large build = liquidity drain",
  },
  {
    id: "WRESBAL",
    label: "Bank reserves",
    unit: "$M",
    what: "Cash banks hold at the Fed (system liquidity)",
    bull: "ample / rising → easy funding",
    bear: "falling toward scarcity → funding-stress risk",
    critical: "~10-11% of GDP = scarcity zone",
  },
];

export interface MonitorRow {
  series: MonitorSeries;
  value: number | null;
  prev: number | null;
  date: string;
  direction: "up" | "down" | "flat" | null;
}

// Generic: fetch latest + previous for ANY annotated series list (reused by
// the monitor AND the scoring-signals view).
export async function fetchRows(
  fred: FredClient,
  series: MonitorSeries[],
): Promise<MonitorRow[]> {
  return Promise.all(
    series.map(async (s) => {
      const obs = await fred.getObservations(s.id, 3); // latest + previous (skip missing)
      const value = obs[0]?.value ?? null;
      const prev = obs[1]?.value ?? null;
      let direction: MonitorRow["direction"] = null;
      if (value != null && prev != null)
        direction = value > prev ? "up" : value < prev ? "down" : "flat";
      return { series: s, value, prev, date: obs[0]?.date ?? "—", direction };
    }),
  );
}

export function runMonitor(fred: FredClient): Promise<MonitorRow[]> {
  return fetchRows(fred, MONITOR_SERIES);
}

export function formatMonitorRows(rows: MonitorRow[]): string {
  const arrow = (d: MonitorRow["direction"]) =>
    d === "up" ? "↑" : d === "down" ? "↓" : d === "flat" ? "→" : "·";
  const out: string[] = [];
  for (const r of rows) {
    const s = r.series;
    const val = r.value != null ? `${r.value}${s.unit}` : "n/a";
    const prev = r.prev != null ? `prev ${r.prev}${s.unit}` : "prev n/a";
    out.push("");
    out.push(`─ ${s.label} ${"─".repeat(Math.max(2, 46 - s.label.length))}`);
    out.push(`  value   ${val}   (${prev} ${arrow(r.direction)})   ${r.date}`);
    out.push(`  what    ${s.what}`);
    out.push(`  bull ▲  ${s.bull}`);
    out.push(`  bear ▼  ${s.bear}`);
    out.push(`  level   ${s.critical}`);
  }
  return out.join("\n");
}
