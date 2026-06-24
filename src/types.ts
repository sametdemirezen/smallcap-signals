export interface StockData {
  symbol: string;
  sector?: string;
  marketCap?: number;
  price?: number;
  avgDailyDollarVolume?: number;
  pe?: number;
  profitMargin?: number;
  revenueGrowth?: number;
  debtToEquity?: number;
}

export interface QualityResult {
  passed: boolean;
  reasons: string[];
}
