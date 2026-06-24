const FRED_BASE = "https://api.stlouisfed.org/fred/series/observations";

export interface FredObservation {
  date: string;
  value: number;
}

export class FredClient {
  constructor(private apiKey: string) {}

  async getObservations(
    seriesId: string,
    limit = 1,
  ): Promise<FredObservation[]> {
    const url = new URL(FRED_BASE);
    url.searchParams.set("series_id", seriesId);
    url.searchParams.set("api_key", this.apiKey);
    url.searchParams.set("file_type", "json");
    url.searchParams.set("sort_order", "desc"); // newest first
    url.searchParams.set("limit", String(limit));

    const res = await fetch(url);
    if (!res.ok)
      throw new Error(
        `FRED ${seriesId} failed: ${res.status} ${res.statusText}`,
      );
    const json = (await res.json()) as {
      observations: { date: string; value: string }[];
    };

    return json.observations
      .filter((o) => o.value !== ".") // FRED uses "." for missing values
      .map((o) => ({ date: o.date, value: Number(o.value) }));
  }

  async getLatest(seriesId: string): Promise<FredObservation | null> {
    const obs = await this.getObservations(seriesId, 10); // grab a few; skip missing
    return obs[0] ?? null;
  }
}
