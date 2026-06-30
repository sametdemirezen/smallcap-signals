// Classic 12-1 momentum: total return from ~12 months ago to ~1 month ago.
// We SKIP the most recent month because short-term moves tend to mean-revert
// (the last month is noise/reversal); the 12-to-1 window captures the durable trend.
const MONTH = 21; // ~trading days in a month
const YEAR = 252; // ~trading days in a year

export function momentum12_1(closes: number[]): number | null {
  if (closes.length < YEAR + 1) return null; // need ~1 year of history
  const start = closes[closes.length - 1 - YEAR];
  const end = closes[closes.length - 1 - MONTH];
  if (!start || !end) return null;
  return (end / start - 1) * 100;
}
