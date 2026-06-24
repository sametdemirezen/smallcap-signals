export interface FredSeriesDef {
  id: string;
  label: string;
  unit: string;
}

export const FRED_SERIES: FredSeriesDef[] = [
  { id: "BAMLH0A0HYM2", label: "HY credit spread", unit: "%" },
  { id: "VIXCLS", label: "VIX", unit: "" },
  { id: "T10Y2Y", label: "Yield curve 10Y-2Y", unit: "%" },
  { id: "DFF", label: "Fed funds rate", unit: "%" },
  { id: "WALCL", label: "Fed balance sheet", unit: "$M" },
  { id: "CFNAI", label: "Growth (CFNAI proxy)", unit: "" },
];
