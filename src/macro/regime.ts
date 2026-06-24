import type { SignalResult } from "./signals";

export interface RegimeResult {
  score: number; // 0-100
  label: "risk-on" | "neutral" | "risk-off";
  netVote: number;
  signals: SignalResult[];
}

export function computeRegime(signals: SignalResult[]): RegimeResult {
  const netVote = signals.reduce((sum, s) => sum + s.vote, 0);
  const n = signals.length;
  const score = n > 0 ? Math.round(((netVote + n) / (2 * n)) * 100) : 50;
  const label = score >= 60 ? "risk-on" : score <= 40 ? "risk-off" : "neutral";
  return { score, label, netVote, signals };
}
