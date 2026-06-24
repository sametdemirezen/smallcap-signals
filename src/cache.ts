import fs from "node:fs";
import path from "node:path";

const CACHE_DIR = path.join("data", "cache");

export async function cached<T>(
  key: string,
  maxAgeMs: number,
  producer: () => Promise<T>,
): Promise<T> {
  const file = path.join(CACHE_DIR, `${key}.json`);
  if (fs.existsSync(file)) {
    const ageMs = Date.now() - fs.statSync(file).mtimeMs;
    if (ageMs < maxAgeMs) {
      console.log(`[cache] hit ${key} (age ${Math.round(ageMs / 1000)}s)`);
      return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
    }
  }
  console.log(`[cache] miss ${key} — running producer...`);
  const data = await producer();
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return data;
}
