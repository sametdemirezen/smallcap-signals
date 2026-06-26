import { FredClient } from "../src/macro/fred";
import { runDipMonitor, formatDipReadout } from "../src/macro/dipMonitor";
process.loadEnvFile();
async function main() {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    console.error("Set FRED_API_KEY.");
    process.exit(1);
  }
  const fred = new FredClient(apiKey);
  const symbol = process.argv[2] ?? "^GSPC";
  const readout = await runDipMonitor(fred, symbol);
  console.log(formatDipReadout(readout));
}

main();
