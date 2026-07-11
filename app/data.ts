export type PeriodKey = "today" | "1w" | "1m" | "3m" | "ytd";

export type MarketGroup = { symbol: string; name: string; type: "Sector"; description: string };

export const periods: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Today" }, { key: "1w", label: "1W" }, { key: "1m", label: "1M" },
  { key: "3m", label: "3M" }, { key: "ytd", label: "YTD" },
];

export const marketGroups: MarketGroup[] = [
  { symbol:"XLB", name:"Materials", type:"Sector", description:"Chemicals, metals, mining and construction materials." },
  { symbol:"XLC", name:"Communication Services", type:"Sector", description:"Interactive media, entertainment and telecom leaders." },
  { symbol:"XLE", name:"Energy", type:"Sector", description:"Integrated oil, exploration and energy services." },
  { symbol:"XLF", name:"Financials", type:"Sector", description:"Banks, payment networks, insurance and capital markets." },
  { symbol:"XLI", name:"Industrials", type:"Sector", description:"Capital goods, aerospace, transport and infrastructure." },
  { symbol:"XLK", name:"Technology", type:"Sector", description:"Large-cap U.S. technology companies." },
  { symbol:"XLP", name:"Consumer Staples", type:"Sector", description:"Defensive consumer goods, food and beverage companies." },
  { symbol:"XLRE", name:"Real Estate", type:"Sector", description:"U.S. real estate investment trusts and operators." },
  { symbol:"XLU", name:"Utilities", type:"Sector", description:"Electric, gas and renewable utility operators." },
  { symbol:"XLV", name:"Health Care", type:"Sector", description:"Pharmaceuticals, managed care and medical devices." },
  { symbol:"XLY", name:"Consumer Discretionary", type:"Sector", description:"Cyclical consumer businesses and retail platforms." },
];
