export type EtfDefinition = {
  symbol: string;
  name: string;
  category: "Sector";
  issuer: "State Street";
  sourceUrl: string;
};

const spdr = (symbol: string, name: string): EtfDefinition => ({
  symbol,
  name,
  category: "Sector",
  issuer: "State Street",
  sourceUrl: `https://www.ssga.com/library-content/products/fund-data/etfs/us/holdings-daily-us-en-${symbol.toLowerCase()}.xlsx`,
});

export const etfUniverse = [
  spdr("XLB", "Materials"),
  spdr("XLC", "Communication Services"),
  spdr("XLE", "Energy"),
  spdr("XLF", "Financials"),
  spdr("XLI", "Industrials"),
  spdr("XLK", "Technology"),
  spdr("XLP", "Consumer Staples"),
  spdr("XLRE", "Real Estate"),
  spdr("XLU", "Utilities"),
  spdr("XLV", "Health Care"),
  spdr("XLY", "Consumer Discretionary"),
] as const;

export const etfBySymbol = new Map(etfUniverse.map((fund) => [fund.symbol, fund]));
