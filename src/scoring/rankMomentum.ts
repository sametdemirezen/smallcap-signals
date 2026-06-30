import { getCloses } from "./prices";
import { momentum12_1 } from "./momentum";
import { zScores } from "./normalize";

export interface MomentumRow {
  symbol: string;
  momentum: number | null; // raw 12-1 return %
  z: number; // universe-relative z-score (relative strength)
}

// Compute 12-1 momentum for every symbol, then z-score across the whole universe.
export function rankByMomentum(
  closesBySymbol: Map<string, number[]>,
): MomentumRow[] {
  const symbols = [...closesBySymbol.keys()];
  const raw = symbols.map((s) => momentum12_1(closesBySymbol.get(s)!));
  const z = zScores(raw); // universe-relative ("a winner is a winner")
  return symbols
    .map((symbol, i) => ({ symbol, momentum: raw[i], z: z[i] }))
    .sort((a, b) => b.z - a.z);
}

// Convenience: load cached closes for the given symbols and rank.
export async function loadAndRank(symbols: string[]): Promise<MomentumRow[]> {
  const closes = await getCloses(symbols);
  return rankByMomentum(closes);
}
