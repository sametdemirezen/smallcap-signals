import { FredClient } from "../src/macro/fred";
import { computeMacroSignals } from "../src/macro/signals";
import { computeTrendSignal } from "../src/macro/trend";
import { computeRegime } from "../src/macro/regime";

process.loadEnvFile();

async function main() {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    console.error("Set FRED_API_KEY.");
    process.exit(1);
  }
  const fred = new FredClient(apiKey);

  const fredSignals = await computeMacroSignals(fred);
  const trend = await computeTrendSignal("^GSPC", 200);
  const signals = [trend, ...fredSignals];

  const regime = computeRegime(signals);

  console.log("Macro signals:");
  for (const s of signals) {
    const v = s.vote > 0 ? "risk-on" : s.vote < 0 ? "risk-off" : "neutral";
    console.log(`  ${s.name.padEnd(14)} ${s.value.padEnd(40)} ${v}`);
  }
  console.log(
    `\nRegime: ${regime.label.toUpperCase()}  (score ${regime.score}/100, net vote ${regime.netVote})`,
  );
}

main();
