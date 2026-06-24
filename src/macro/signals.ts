import { FredClient, type FredObservation } from "./fred";

export type Vote = -1 | 0 | 1;

export interface SignalResult {
  name: string;
  value: string;
  vote: Vote;
}

export function voteLowGood(v: number, onMax: number, offMin: number): Vote {
  if (v < onMax) return 1;
  if (v > offMin) return -1;
  return 0;
}

export function voteHighGood(v: number, onMin: number, offMax: number): Vote {
  if (v > onMin) return 1;
  if (v < offMax) return -1;
  return 0;
}

export function voteDirection(
  now: number,
  past: number,
  flatBand: number,
  fallingIsGood: boolean,
): Vote {
  const change = now - past;
  if (Math.abs(change) <= flatBand) return 0;
  return change < 0 === fallingIsGood ? 1 : -1;
}

export function clampVote(n: number): Vote {
  return n > 0 ? 1 : n < 0 ? -1 : 0;
}

function valueMonthsAgo(obs: FredObservation[], months: number): number | null {
  if (!obs.length) return null;
  const target = new Date(obs[0].date);
  target.setMonth(target.getMonth() - months);
  const past = obs.find((o) => new Date(o.date) <= target);
  return (past ?? obs[obs.length - 1]).value;
}

// Liquidity = rate direction (price of money) + net-liquidity direction (quantity).
// Net liquidity = balance sheet - TGA - RRP — the real tap the valves net out to.
export function computeLiquidityVote(
  rateNow: number,
  ratePast: number,
  netNow: number,
  netPast: number,
): { vote: Vote; rateChange: number; netChange: number } {
  const rateVote = voteDirection(rateNow, ratePast, 0.1, true); // cuts = good
  const netVote = voteDirection(
    netNow,
    netPast,
    Math.abs(netNow) * 0.005,
    false,
  ); // rising = good
  return {
    vote: clampVote(rateVote + netVote),
    rateChange: rateNow - ratePast,
    netChange: netNow - netPast,
  };
}

export async function computeMacroSignals(
  fred: FredClient,
): Promise<SignalResult[]> {
  const out: SignalResult[] = [];

  const credit = await fred.getLatest("BAMLH0A0HYM2");
  if (credit)
    out.push({
      name: "Credit spread",
      value: `${credit.value}%`,
      vote: voteLowGood(credit.value, 4, 6),
    });

  const vix = await fred.getLatest("VIXCLS");
  if (vix)
    out.push({
      name: "VIX",
      value: `${vix.value}`,
      vote: voteLowGood(vix.value, 15, 25),
    });

  const curve = await fred.getLatest("T10Y2Y");
  if (curve)
    out.push({
      name: "Yield curve",
      value: `${curve.value}%`,
      vote: voteHighGood(curve.value, 0.5, 0),
    });

  const growth = await fred.getLatest("CFNAI");
  if (growth)
    out.push({
      name: "Growth",
      value: `${growth.value}`,
      vote: voteHighGood(growth.value, 0, -0.7),
    });

  // Liquidity = rate (DFF) + net liquidity (WALCL - TGA - RRP).
  // UNIT NOTE: WALCL & WTREGEN are in $M; RRPONTSYD is in $B -> convert (*1000).
  const dff = await fred.getObservations("DFF", 400);
  const walcl = await fred.getObservations("WALCL", 60);
  const tga = await fred.getObservations("WTREGEN", 60);
  const rrp = await fred.getObservations("RRPONTSYD", 200);
  if (dff.length && walcl.length && tga.length && rrp.length) {
    const rateNow = dff[0].value;
    const ratePast = valueMonthsAgo(dff, 6) ?? rateNow;
    const netNow = walcl[0].value - tga[0].value - rrp[0].value * 1000;
    const netPast =
      (valueMonthsAgo(walcl, 3) ?? walcl[0].value) -
      (valueMonthsAgo(tga, 3) ?? tga[0].value) -
      (valueMonthsAgo(rrp, 3) ?? rrp[0].value) * 1000;
    const liq = computeLiquidityVote(rateNow, ratePast, netNow, netPast);
    const netDir = liq.netChange >= 0 ? "+" : "";
    out.push({
      name: "Liquidity",
      value: `rate Δ6m ${liq.rateChange.toFixed(2)}, net-liq Δ3m ${netDir}${(liq.netChange / 1000).toFixed(0)}B`,
      vote: liq.vote,
    });
  }

  return out;
}
