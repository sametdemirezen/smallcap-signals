import { FredClient } from "../src/macro/fred";
import { fetchRows, formatMonitorRows } from "../src/macro/monitor";
import { SCORING_SERIES } from "../src/macro/series";
process.loadEnvFile();
async function main() {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    console.error("Set FRED_API_KEY.");
    process.exit(1);
  }
  const fred = new FredClient(apiKey);
  const rows = await fetchRows(fred, SCORING_SERIES);
  console.log("Scoring signals — raw inputs to the regime score:");
  console.log(formatMonitorRows(rows));
}

main();
