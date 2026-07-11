export type PeriodKey = "today" | "1w" | "1m" | "3m" | "ytd";

export type MarketGroup = {
  symbol: string;
  name: string;
  type: "Sector";
  description: string;
  returns: Record<PeriodKey, number>;
  holdings: never[];
};

export const periods: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Today" }, { key: "1w", label: "1W" },
  { key: "1m", label: "1M" }, { key: "3m", label: "3M" }, { key: "ytd", label: "YTD" },
];

// ETF-level returns remain explicit demo values until the adjusted-history route replaces them.
// Constituent membership and weights never come from this file.
export const marketGroups: MarketGroup[] = [
  { symbol:"XLB", name:"Materials", type:"Sector", description:"Chemicals, metals, mining and construction materials.", returns:{today:.31,"1w":1.11,"1m":2.8,"3m":6.3,ytd:7.4}, holdings:[] },
  { symbol:"XLC", name:"Communication Services", type:"Sector", description:"Interactive media, entertainment and telecom leaders.", returns:{today:.46,"1w":1.42,"1m":4.8,"3m":9.1,ytd:17.6}, holdings:[] },
  { symbol:"XLE", name:"Energy", type:"Sector", description:"Integrated oil, exploration and energy services.", returns:{today:.97,"1w":3.36,"1m":7.8,"3m":4.5,ytd:11.2}, holdings:[] },
  { symbol:"XLF", name:"Financials", type:"Sector", description:"Banks, payment networks, insurance and capital markets.", returns:{today:.22,"1w":.94,"1m":3.7,"3m":8.8,ytd:13.1}, holdings:[] },
  { symbol:"XLI", name:"Industrials", type:"Sector", description:"Capital goods, aerospace, transport and infrastructure.", returns:{today:.63,"1w":2.08,"1m":5.3,"3m":12.7,ytd:18.9}, holdings:[] },
  { symbol:"XLK", name:"Technology", type:"Sector", description:"Large-cap U.S. technology companies.", returns:{today:.84,"1w":2.15,"1m":6.2,"3m":14.8,ytd:21.4}, holdings:[] },
  { symbol:"XLP", name:"Consumer Staples", type:"Sector", description:"Defensive consumer goods, food and beverage companies.", returns:{today:-.34,"1w":-.72,"1m":-1.1,"3m":1.9,ytd:4.2}, holdings:[] },
  { symbol:"XLRE", name:"Real Estate", type:"Sector", description:"U.S. real estate investment trusts and operators.", returns:{today:-.41,"1w":-1.28,"1m":-2.5,"3m":.8,ytd:2.7}, holdings:[] },
  { symbol:"XLU", name:"Utilities", type:"Sector", description:"Electric, gas and renewable utility operators.", returns:{today:.12,"1w":-.14,"1m":.9,"3m":7.4,ytd:10.6}, holdings:[] },
  { symbol:"XLV", name:"Health Care", type:"Sector", description:"Pharmaceuticals, managed care and medical devices.", returns:{today:-.07,"1w":-.36,"1m":1.4,"3m":3.2,ytd:5.9}, holdings:[] },
  { symbol:"XLY", name:"Consumer Discretionary", type:"Sector", description:"Cyclical consumer businesses and retail platforms.", returns:{today:-.18,"1w":.32,"1m":2.1,"3m":5.4,ytd:8.7}, holdings:[] },
];
