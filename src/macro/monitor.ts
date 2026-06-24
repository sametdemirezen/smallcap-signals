import { FredClient } from "./fred";

interface MonitorSeries {
  id: string;
  label: string;
  unit: string;
}

// Informational only — NEVER feeds the regime score. You interpret these.
const MONITOR_SERIES: MonitorSeries[] = [
  { id: "PCEPILFE", label: "Core PCE (index)", unit: "" },
  { id: "CPIAUCSL", label: "CPI (index)", unit: "" },
  { id: "T5YIFR", label: "Inflation exp 5y5y", unit: "%" },
  { id: "UNRATE", label: "Unemployment", unit: "%" },
  { id: "ICSA", label: "Jobless claims", unit: "" },
  { id: "SAHMREALTIME", label: "Sahm rule", unit: "" },
  { id: "INDPRO", label: "Industrial prod", unit: "" },
  { id: "BAMLC0A0CM", label: "IG credit spread", unit: "%" },
  { id: "NFCI", label: "Financial conditions", unit: "" },
  { id: "DTWEXBGS", label: "US dollar index", unit: "" },
  { id: "DGS10", label: "10Y yield", unit: "%" },
  { id: "DGS2", label: "2Y yield", unit: "%" },
  { id: "RRPONTSYD", label: "Reverse repo (RRP)", unit: "$B" },
  { id: "WTREGEN", label: "Treasury acct (TGA)", unit: "$M" },
  { id: "WRESBAL", label: "Bank reserves", unit: "$M" },
];

export async function runMonitor(fred: FredClient) {
  return Promise.all(
    MONITOR_SERIES.map(async (s) => {
      const latest = await fred.getLatest(s.id);
      return {
        indicator: s.label,
        value: latest ? `${latest.value}${s.unit}` : "n/a",
        date: latest?.date ?? "—",
      };
    }),
  );
}
