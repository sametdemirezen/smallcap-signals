import type { StockData, QualityResult } from "./types";

export interface QualityConfig {
  marketCapFloor: number;
  minPrice: number;
  minDollarVolume: number;
}

export const defaultConfig: QualityConfig = {
  marketCapFloor: 300_000_000,
  minPrice: 5,
  minDollarVolume: 2_000_000,
};

// The gate answers ONE question: "Is this company fundamentally disqualified?"
// Only universal, business-model-agnostic disqualifiers live here. Relative
// judgments (leverage, valuation, growth) move to the scoring layer, where
// they're evaluated against sector peers.
export function evaluateQuality(
  s: StockData,
  cfg: QualityConfig,
): QualityResult {
  const reasons: string[] = [];
  if (s.marketCap == null || s.marketCap < cfg.marketCapFloor)
    reasons.push("too-small");
  if (s.price == null || s.price < cfg.minPrice) reasons.push("penny");
  if (
    s.avgDailyDollarVolume == null ||
    s.avgDailyDollarVolume < cfg.minDollarVolume
  )
    reasons.push("illiquid");
  if (s.profitMargin == null) reasons.push("no-margin-data");
  else if (s.profitMargin <= 0) reasons.push("negative-earnings");
  return { passed: reasons.length === 0, reasons };
}
