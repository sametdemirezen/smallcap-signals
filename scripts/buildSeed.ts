import fs from "node:fs";
import path from "node:path";

const DATA_DIR = "data";
const HOLDING_FILES = ["IJR.csv", "IJH.csv", "IVV.csv"]; // S&P 600 + 400 + 500

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        field += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      out.push(field);
      field = "";
    } else {
      field += c;
    }
  }
  out.push(field);
  return out;
}

const TICKER_RE = /^[A-Z][A-Z.]{0,5}$/;

export function extractTickers(csvText: string): string[] {
  const lines = csvText.split(/\r?\n/);
  const headerIdx = lines.findIndex(
    (l) => l.includes("Ticker") && l.includes("Asset Class"),
  );
  if (headerIdx === -1) return [];
  const header = parseCsvLine(lines[headerIdx]).map((h) => h.trim());
  const tickerCol = header.indexOf("Ticker");
  const assetCol = header.indexOf("Asset Class");

  const tickers: string[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    if (!lines[i].trim()) break; // blank line ends the holdings table
    const cols = parseCsvLine(lines[i]);
    const raw = (cols[tickerCol] ?? "").trim().toUpperCase();
    const assetClass = assetCol >= 0 ? (cols[assetCol] ?? "").trim() : "Equity";
    if (assetClass !== "Equity") continue;
    if (!TICKER_RE.test(raw)) continue; // drop cash, futures, "-"
    tickers.push(raw.replace(/\./g, "-")); // iShares "BRK.B" -> Yahoo "BRK-B"
  }
  return tickers;
}

function main() {
  const all = new Set<string>();
  for (const file of HOLDING_FILES) {
    const p = path.join(DATA_DIR, file);
    if (!fs.existsSync(p)) {
      console.warn(`[seed] missing ${p} — download from iShares, skipping.`);
      continue;
    }
    const tickers = extractTickers(fs.readFileSync(p, "utf-8"));
    console.log(`[seed] ${file}: ${tickers.length} equities`);
    tickers.forEach((t) => all.add(t));
  }
  if (all.size === 0) {
    console.error("[seed] no tickers — did you download the CSVs into data/?");
    process.exit(1);
  }
  const out = [...all].sort();
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(DATA_DIR, "seed-symbols.json"),
    JSON.stringify(out, null, 2),
  );
  console.log(
    `[seed] wrote ${out.length} unique tickers to ${DATA_DIR}/seed-symbols.json`,
  );
}

if (process.argv[1] && process.argv[1].endsWith("buildSeed.ts")) main();
