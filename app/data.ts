export type PeriodKey = "today" | "1w" | "1m" | "3m" | "ytd";

export type Holding = {
  symbol: string;
  name: string;
  weight: number;
  today: number;
  rs: number;
};

export type MarketGroup = {
  symbol: string;
  name: string;
  type: "Sector" | "Theme";
  description: string;
  returns: Record<PeriodKey, number>;
  holdings: Holding[];
};

const h = (
  symbol: string,
  name: string,
  weight: number,
  today: number,
  rs: number,
): Holding => ({ symbol, name, weight, today, rs });

export const periods: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "1w", label: "1W" },
  { key: "1m", label: "1M" },
  { key: "3m", label: "3M" },
  { key: "ytd", label: "YTD" },
];

export const marketGroups: MarketGroup[] = [
  {
    symbol: "XLK", name: "Technology", type: "Sector",
    description: "Large-cap U.S. technology companies.",
    returns: { today: 0.84, "1w": 2.15, "1m": 6.2, "3m": 14.8, ytd: 21.4 },
    holdings: [h("NVDA", "NVIDIA", 15.2, 1.82, 98), h("AAPL", "Apple", 13.6, 0.54, 81), h("MSFT", "Microsoft", 11.8, 0.73, 86), h("AVGO", "Broadcom", 6.4, 1.21, 93), h("ORCL", "Oracle", 3.1, -0.16, 74)],
  },
  {
    symbol: "XLC", name: "Communication Services", type: "Sector",
    description: "Interactive media, entertainment and telecom leaders.",
    returns: { today: 0.46, "1w": 1.42, "1m": 4.8, "3m": 9.1, ytd: 17.6 },
    holdings: [h("META", "Meta Platforms", 22.3, 1.06, 92), h("GOOGL", "Alphabet", 12.1, 0.62, 84), h("NFLX", "Netflix", 5.2, 0.41, 79), h("T", "AT&T", 4.6, -0.12, 56), h("DIS", "Walt Disney", 4.1, -0.35, 48)],
  },
  {
    symbol: "XLY", name: "Consumer Discretionary", type: "Sector",
    description: "Cyclical consumer businesses and retail platforms.",
    returns: { today: -0.18, "1w": 0.32, "1m": 2.1, "3m": 5.4, ytd: 8.7 },
    holdings: [h("AMZN", "Amazon", 22.1, 0.58, 80), h("TSLA", "Tesla", 16.4, -1.23, 63), h("HD", "Home Depot", 5.8, -0.32, 51), h("MCD", "McDonald's", 4.1, 0.13, 58), h("LOW", "Lowe's", 2.4, -0.41, 46)],
  },
  {
    symbol: "XLP", name: "Consumer Staples", type: "Sector",
    description: "Defensive consumer goods, food and beverage companies.",
    returns: { today: -0.34, "1w": -0.72, "1m": -1.1, "3m": 1.9, ytd: 4.2 },
    holdings: [h("WMT", "Walmart", 10.8, 0.22, 68), h("COST", "Costco", 9.7, -0.18, 62), h("PG", "Procter & Gamble", 8.4, -0.42, 43), h("KO", "Coca-Cola", 6.1, -0.31, 47), h("PM", "Philip Morris", 5.2, 0.06, 65)],
  },
  {
    symbol: "XLE", name: "Energy", type: "Sector",
    description: "Integrated oil, exploration and energy services.",
    returns: { today: 0.97, "1w": 3.36, "1m": 7.8, "3m": 4.5, ytd: 11.2 },
    holdings: [h("XOM", "Exxon Mobil", 23.2, 1.12, 89), h("CVX", "Chevron", 17.1, 0.84, 82), h("COP", "ConocoPhillips", 7.3, 1.44, 91), h("SLB", "SLB", 4.3, 0.76, 78), h("EOG", "EOG Resources", 4.0, 1.08, 87)],
  },
  {
    symbol: "XLF", name: "Financials", type: "Sector",
    description: "Banks, payment networks, insurance and capital markets.",
    returns: { today: 0.22, "1w": 0.94, "1m": 3.7, "3m": 8.8, ytd: 13.1 },
    holdings: [h("JPM", "JPMorgan Chase", 11.2, 0.54, 85), h("V", "Visa", 8.1, 0.16, 69), h("MA", "Mastercard", 6.4, 0.21, 71), h("BAC", "Bank of America", 4.7, -0.08, 61), h("GS", "Goldman Sachs", 3.0, 0.63, 88)],
  },
  {
    symbol: "XLV", name: "Health Care", type: "Sector",
    description: "Pharmaceuticals, managed care and medical devices.",
    returns: { today: -0.07, "1w": -0.36, "1m": 1.4, "3m": 3.2, ytd: 5.9 },
    holdings: [h("LLY", "Eli Lilly", 13.4, 0.48, 83), h("JNJ", "Johnson & Johnson", 7.0, -0.15, 52), h("ABBV", "AbbVie", 6.6, 0.12, 66), h("UNH", "UnitedHealth", 5.7, -0.87, 31), h("MRK", "Merck", 4.8, -0.22, 44)],
  },
  {
    symbol: "XLI", name: "Industrials", type: "Sector",
    description: "Capital goods, aerospace, transport and infrastructure.",
    returns: { today: 0.63, "1w": 2.08, "1m": 5.3, "3m": 12.7, ytd: 18.9 },
    holdings: [h("CAT", "Caterpillar", 7.6, 1.04, 94), h("GE", "GE Aerospace", 6.8, 0.81, 91), h("GEV", "GE Vernova", 5.1, 1.76, 99), h("RTX", "RTX", 4.8, 0.26, 74), h("BA", "Boeing", 3.2, -0.44, 53)],
  },
  {
    symbol: "XLB", name: "Materials", type: "Sector",
    description: "Chemicals, metals, mining and construction materials.",
    returns: { today: 0.31, "1w": 1.11, "1m": 2.8, "3m": 6.3, ytd: 7.4 },
    holdings: [h("LIN", "Linde", 18.1, 0.31, 72), h("SHW", "Sherwin-Williams", 7.2, -0.05, 58), h("FCX", "Freeport-McMoRan", 6.7, 1.14, 90), h("NEM", "Newmont", 5.4, 0.82, 86), h("APD", "Air Products", 4.9, -0.19, 49)],
  },
  {
    symbol: "XLRE", name: "Real Estate", type: "Sector",
    description: "U.S. real estate investment trusts and operators.",
    returns: { today: -0.41, "1w": -1.28, "1m": -2.5, "3m": 0.8, ytd: 2.7 },
    holdings: [h("PLD", "Prologis", 9.4, -0.62, 37), h("AMT", "American Tower", 8.2, -0.31, 45), h("WELL", "Welltower", 7.6, 0.08, 69), h("EQIX", "Equinix", 6.4, -0.44, 41), h("SPG", "Simon Property", 4.9, -0.18, 54)],
  },
  {
    symbol: "XLU", name: "Utilities", type: "Sector",
    description: "Electric, gas and renewable utility operators.",
    returns: { today: 0.12, "1w": -0.14, "1m": 0.9, "3m": 7.4, ytd: 10.6 },
    holdings: [h("NEE", "NextEra Energy", 13.1, 0.17, 65), h("SO", "Southern Company", 8.4, 0.06, 61), h("CEG", "Constellation Energy", 7.2, 0.86, 92), h("DUK", "Duke Energy", 6.8, -0.11, 56), h("AEP", "American Electric Power", 4.5, 0.02, 58)],
  },
  {
    symbol: "SOXX", name: "Semiconductors", type: "Theme",
    description: "Chip designers, manufacturers and equipment providers.",
    returns: { today: 1.34, "1w": 4.18, "1m": 9.6, "3m": 18.5, ytd: 29.4 },
    holdings: [h("NVDA", "NVIDIA", 9.1, 1.82, 98), h("AVGO", "Broadcom", 8.8, 1.21, 93), h("AMD", "Advanced Micro Devices", 7.6, 2.04, 96), h("MU", "Micron", 6.4, 1.63, 95), h("INTC", "Intel", 4.7, -0.36, 57)],
  },
  {
    symbol: "IGV", name: "Software", type: "Theme",
    description: "Enterprise, infrastructure and application software.",
    returns: { today: 0.52, "1w": 1.76, "1m": 5.2, "3m": 10.6, ytd: 14.8 },
    holdings: [h("MSFT", "Microsoft", 8.7, 0.73, 86), h("ORCL", "Oracle", 8.0, -0.16, 74), h("CRM", "Salesforce", 7.5, 0.44, 72), h("ADBE", "Adobe", 5.8, -0.72, 39), h("NOW", "ServiceNow", 5.5, 0.38, 77)],
  },
  {
    symbol: "CIBR", name: "Cybersecurity", type: "Theme",
    description: "Network, endpoint and cloud security providers.",
    returns: { today: 0.71, "1w": 2.49, "1m": 7.1, "3m": 15.2, ytd: 23.7 },
    holdings: [h("CRWD", "CrowdStrike", 8.6, 1.37, 96), h("PANW", "Palo Alto Networks", 8.2, 0.84, 91), h("FTNT", "Fortinet", 6.1, 0.52, 84), h("CSCO", "Cisco", 5.9, 0.11, 64), h("GEN", "Gen Digital", 4.3, -0.08, 59)],
  },
  {
    symbol: "BOTZ", name: "Robotics & Automation", type: "Theme",
    description: "Industrial automation, robotics and autonomous systems.",
    returns: { today: 0.39, "1w": 1.88, "1m": 4.6, "3m": 11.3, ytd: 16.2 },
    holdings: [h("NVDA", "NVIDIA", 8.9, 1.82, 98), h("ISRG", "Intuitive Surgical", 8.2, 0.28, 76), h("ABB", "ABB", 7.6, 0.41, 82), h("ROK", "Rockwell Automation", 5.3, -0.12, 62), h("TER", "Teradyne", 4.8, 0.96, 89)],
  },
  {
    symbol: "TAN", name: "Solar", type: "Theme",
    description: "Solar manufacturing, inverters and project development.",
    returns: { today: -1.18, "1w": -3.42, "1m": -6.8, "3m": 2.4, ytd: -9.7 },
    holdings: [h("FSLR", "First Solar", 10.7, -0.42, 55), h("ENPH", "Enphase Energy", 8.4, -1.76, 28), h("NXT", "Nextracker", 7.9, -0.83, 47), h("RUN", "Sunrun", 4.8, -2.31, 21), h("ARRY", "Array Technologies", 3.1, -1.14, 34)],
  },
  {
    symbol: "URA", name: "Uranium & Nuclear", type: "Theme",
    description: "Uranium miners, fuel-cycle businesses and nuclear suppliers.",
    returns: { today: 1.06, "1w": 3.92, "1m": 8.4, "3m": 21.7, ytd: 31.8 },
    holdings: [h("CCJ", "Cameco", 22.8, 1.18, 97), h("NXE", "NexGen Energy", 6.2, 1.73, 94), h("UEC", "Uranium Energy", 5.5, 0.94, 90), h("UUUU", "Energy Fuels", 4.2, 1.42, 92), h("LEU", "Centrus Energy", 3.7, 2.16, 99)],
  },
  {
    symbol: "COPX", name: "Copper Miners", type: "Theme",
    description: "Global copper producers and diversified miners.",
    returns: { today: 0.88, "1w": 2.62, "1m": 6.9, "3m": 13.6, ytd: 19.5 },
    holdings: [h("FCX", "Freeport-McMoRan", 8.7, 1.14, 90), h("SCCO", "Southern Copper", 7.9, 0.76, 84), h("TECK", "Teck Resources", 5.7, 0.91, 86), h("HBM", "Hudbay Minerals", 4.8, 1.28, 91), h("RIO", "Rio Tinto", 4.1, 0.37, 70)],
  },
  {
    symbol: "SIL", name: "Silver Miners", type: "Theme",
    description: "Primary silver producers and precious-metals royalty companies.",
    returns: { today: 1.22, "1w": 4.74, "1m": 11.2, "3m": 24.1, ytd: 34.6 },
    holdings: [h("PAAS", "Pan American Silver", 10.1, 1.38, 94), h("WPM", "Wheaton Precious Metals", 9.6, 0.92, 90), h("HL", "Hecla Mining", 5.2, 1.74, 96), h("CDE", "Coeur Mining", 4.8, 2.03, 98), h("AG", "First Majestic Silver", 4.2, 1.17, 91)],
  },
  {
    symbol: "GDX", name: "Gold Miners", type: "Theme",
    description: "Large and mid-cap global gold producers.",
    returns: { today: 0.64, "1w": 2.81, "1m": 7.5, "3m": 16.8, ytd: 25.1 },
    holdings: [h("NEM", "Newmont", 11.4, 0.82, 86), h("AEM", "Agnico Eagle", 10.2, 0.71, 88), h("GOLD", "Barrick Gold", 7.7, 0.54, 80), h("WPM", "Wheaton Precious Metals", 6.1, 0.92, 90), h("KGC", "Kinross Gold", 4.4, 0.63, 84)],
  },
  {
    symbol: "XBI", name: "Biotechnology", type: "Theme",
    description: "Equal-weight biotechnology and drug-development companies.",
    returns: { today: -0.63, "1w": -1.84, "1m": 1.7, "3m": 6.4, ytd: 3.9 },
    holdings: [h("MRNA", "Moderna", 2.3, -1.12, 36), h("REGN", "Regeneron", 2.1, -0.47, 43), h("VRTX", "Vertex", 2.0, 0.18, 68), h("ALNY", "Alnylam", 1.9, 0.72, 82), h("INCY", "Incyte", 1.8, -0.28, 51)],
  },
  {
    symbol: "ITB", name: "Home Construction", type: "Theme",
    description: "Homebuilders and residential construction suppliers.",
    returns: { today: -0.52, "1w": -2.17, "1m": -4.3, "3m": 1.6, ytd: -2.2 },
    holdings: [h("DHI", "D.R. Horton", 14.1, -0.67, 42), h("LEN", "Lennar", 11.7, -0.88, 38), h("NVR", "NVR", 7.8, -0.21, 53), h("PHM", "PulteGroup", 7.1, -0.54, 44), h("TOL", "Toll Brothers", 4.2, -0.49, 47)],
  },
  {
    symbol: "JETS", name: "Airlines", type: "Theme",
    description: "U.S. and global passenger airline operators.",
    returns: { today: -0.29, "1w": 0.41, "1m": 3.2, "3m": 7.1, ytd: 5.8 },
    holdings: [h("DAL", "Delta Air Lines", 10.2, 0.24, 72), h("UAL", "United Airlines", 9.7, 0.46, 78), h("AAL", "American Airlines", 8.4, -0.82, 42), h("LUV", "Southwest Airlines", 7.9, -0.43, 48), h("ALK", "Alaska Air", 4.8, 0.18, 66)],
  },
  {
    symbol: "KRE", name: "Regional Banks", type: "Theme",
    description: "Equal-weight U.S. regional and community banks.",
    returns: { today: 0.18, "1w": 1.24, "1m": 4.1, "3m": 9.5, ytd: 12.4 },
    holdings: [h("MTB", "M&T Bank", 2.8, 0.38, 75), h("CFG", "Citizens Financial", 2.6, 0.21, 70), h("KEY", "KeyCorp", 2.5, -0.09, 59), h("RF", "Regions Financial", 2.5, 0.18, 68), h("ZION", "Zions Bancorp", 2.4, 0.34, 73)],
  },
  {
    symbol: "BITQ", name: "Crypto Equities", type: "Theme",
    description: "Crypto exchanges, treasury companies and miners.",
    returns: { today: 1.76, "1w": 6.12, "1m": 13.4, "3m": 29.8, ytd: 42.7 },
    holdings: [h("COIN", "Coinbase", 12.2, 2.14, 99), h("MSTR", "Strategy", 10.4, 2.47, 98), h("MARA", "MARA Holdings", 6.7, 1.83, 95), h("RIOT", "Riot Platforms", 5.9, 1.62, 93), h("CLSK", "CleanSpark", 5.2, 2.06, 96)],
  },
  {
    symbol: "AIQ", name: "Artificial Intelligence", type: "Theme",
    description: "AI infrastructure, platforms and enterprise adopters.",
    returns: { today: 0.93, "1w": 3.44, "1m": 8.7, "3m": 17.9, ytd: 27.3 },
    holdings: [h("NVDA", "NVIDIA", 4.2, 1.82, 98), h("PLTR", "Palantir", 3.8, 1.38, 97), h("AVGO", "Broadcom", 3.4, 1.21, 93), h("ORCL", "Oracle", 3.1, -0.16, 74), h("IBM", "IBM", 2.7, 0.27, 70)],
  },
  {
    symbol: "QTUM", name: "Quantum Computing", type: "Theme",
    description: "Quantum hardware, enabling technology and advanced computing.",
    returns: { today: 1.41, "1w": 5.66, "1m": 12.8, "3m": 31.4, ytd: 48.2 },
    holdings: [h("IONQ", "IonQ", 3.3, 2.84, 99), h("RGTI", "Rigetti Computing", 2.9, 2.16, 96), h("QBTS", "D-Wave Quantum", 2.8, 1.94, 95), h("NVDA", "NVIDIA", 2.6, 1.82, 98), h("IBM", "IBM", 2.5, 0.27, 70)],
  },
  {
    symbol: "UFO", name: "Space Economy", type: "Theme",
    description: "Launch services, satellites and space communications.",
    returns: { today: 0.81, "1w": 2.93, "1m": 7.7, "3m": 19.6, ytd: 26.4 },
    holdings: [h("RKLB", "Rocket Lab", 7.8, 1.62, 96), h("ASTS", "AST SpaceMobile", 6.9, 1.13, 91), h("IRDM", "Iridium", 5.8, 0.42, 75), h("VSAT", "Viasat", 4.2, -0.21, 56), h("GSAT", "Globalstar", 3.8, 0.68, 82)],
  },
  {
    symbol: "DRIV", name: "Autonomous & Electric Vehicles", type: "Theme",
    description: "Electric vehicles, autonomous systems and enabling chips.",
    returns: { today: -0.11, "1w": 0.88, "1m": 3.6, "3m": 8.9, ytd: 9.7 },
    holdings: [h("TSLA", "Tesla", 4.8, -1.23, 63), h("GOOGL", "Alphabet", 3.7, 0.62, 84), h("NVDA", "NVIDIA", 3.5, 1.82, 98), h("QCOM", "Qualcomm", 3.0, 0.39, 73), h("GM", "General Motors", 2.8, -0.34, 54)],
  },
  {
    symbol: "PAVE", name: "U.S. Infrastructure", type: "Theme",
    description: "Construction, materials and industrial infrastructure.",
    returns: { today: 0.74, "1w": 2.56, "1m": 6.1, "3m": 14.4, ytd: 20.6 },
    holdings: [h("CAT", "Caterpillar", 3.7, 1.04, 94), h("DE", "Deere", 3.4, 0.62, 83), h("ETN", "Eaton", 3.2, 0.83, 90), h("URI", "United Rentals", 2.9, 1.18, 92), h("VMC", "Vulcan Materials", 2.7, 0.41, 77)],
  },
];

export const allSymbols = Array.from(
  new Set(marketGroups.flatMap((group) => [group.symbol, ...group.holdings.map((holding) => holding.symbol)])),
);
