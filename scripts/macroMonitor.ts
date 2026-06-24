import { FredClient } from "../src/macro/fred";
import { runMonitor } from "../src/macro/monitor";

process.loadEnvFile();

async function main() {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    console.error("Set FRED_API_KEY.");
    process.exit(1);
  }
  const fred = new FredClient(apiKey);
  const rows = await runMonitor(fred);
  console.log("Macro monitor — informational only, not part of scoring:\n");
  console.table(rows);
}

main();
