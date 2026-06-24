import fs from "node:fs";
import path from "node:path";

const SEED_FILE = path.join("data", "seed-symbols.json");
const STARTER_SEED = ["AAPL", "MSFT", "NVDA", "KO", "F", "PLUG"];

export function loadSeed(): string[] {
  if (fs.existsSync(SEED_FILE)) {
    const raw = JSON.parse(fs.readFileSync(SEED_FILE, "utf-8"));
    if (Array.isArray(raw) && raw.length > 0) return raw.map(String);
  }
  console.warn(
    `[seed] ${SEED_FILE} not found — using starter. Run scripts/buildSeed.ts first.`,
  );
  return STARTER_SEED;
}
