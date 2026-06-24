import { FredClient } from "../src/macro/fred";
import { FRED_SERIES } from "../src/macro/series";

process.loadEnvFile();

async function main() {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    console.error(
      "Set FRED_API_KEY. Free key: https://fredaccount.stlouisfed.org/apikeys",
    );
    process.exit(1);
  }

  const fred = new FredClient(apiKey);

  const rows = await Promise.all(
    FRED_SERIES.map(async (s) => {
      const latest = await fred.getLatest(s.id);
      return {
        signal: s.label,
        value: latest ? `${latest.value}${s.unit}` : "n/a",
        date: latest?.date ?? "—",
      };
    }),
  );

  console.table(rows);
}

main();
