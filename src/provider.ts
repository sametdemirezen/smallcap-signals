import YahooFinance from "yahoo-finance2";
import type { StockData } from "./types";

export interface DataProvider {
  readonly name: string;
  getMany(symbols: string[]): Promise<StockData[]>;
}

export class YahooProvider implements DataProvider {
  readonly name = "yahoo";
  private yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
  private concurrency = 4;

  private async getOne(symbol: string): Promise<StockData | null> {
    try {
      const d = await this.yf.quoteSummary(symbol, {
        modules: ["summaryDetail", "financialData", "assetProfile"],
      });
      const price = d.financialData?.currentPrice;
      const avgVol = d.summaryDetail?.averageVolume;
      const d2e = d.financialData?.debtToEquity;
      return {
        symbol,
        sector: d.assetProfile?.sector,
        marketCap: d.summaryDetail?.marketCap,
        price,
        avgDailyDollarVolume:
          price != null && avgVol != null ? price * avgVol : undefined,
        pe: d.summaryDetail?.trailingPE,
        profitMargin: d.financialData?.profitMargins,
        revenueGrowth: d.financialData?.revenueGrowth,
        debtToEquity: d2e != null ? d2e / 100 : undefined,
      };
    } catch {
      return null;
    }
  }

  async getMany(symbols: string[]): Promise<StockData[]> {
    const out: (StockData | null)[] = new Array(symbols.length);
    let next = 0;
    const workers = Array.from(
      { length: Math.min(this.concurrency, symbols.length) },
      async () => {
        while (next < symbols.length) {
          const i = next++;
          out[i] = await this.getOne(symbols[i]);
        }
      },
    );
    await Promise.all(workers);
    return out.filter((s): s is StockData => s !== null);
  }
}
