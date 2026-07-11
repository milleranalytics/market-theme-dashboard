import * as XLSX from "xlsx";
import type { EtfDefinition } from "../universe";

export type NormalizedHolding = {
  name: string;
  symbol: string | null;
  identifier: string | null;
  sedol: string | null;
  weight: number;
  sector: string | null;
  shares: number | null;
  currency: string | null;
};

export type HoldingsSnapshot = {
  etf: string;
  issuer: string;
  sourceUrl: string;
  effectiveDate: string;
  fetchedAt: string;
  holdings: NormalizedHolding[];
  totalWeight: number;
};

const text = (value: unknown) => {
  const normalized = String(value ?? "").trim();
  return normalized && normalized !== "-" ? normalized : null;
};

const number = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").replace(/[,%]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};

export function parseSpdrWorkbook(buffer: ArrayBuffer, fund: EtfDefinition): HoldingsSnapshot {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error("Workbook contains no worksheet");
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true });
  const ticker = text(rows[1]?.[1]);
  const dateLabel = text(rows[2]?.[1]);
  if (ticker !== fund.symbol || !dateLabel?.startsWith("As of ")) {
    throw new Error(`Unexpected workbook identity: ${ticker ?? "missing ticker"}`);
  }
  const holdings = rows.slice(5).flatMap((row) => {
    const name = text(row[0]);
    const weight = number(row[4]);
    if (!name || weight === null || weight < 0 || weight > 100) return [];
    return [{
      name,
      symbol: text(row[1]),
      identifier: text(row[2]),
      sedol: text(row[3]),
      weight,
      sector: text(row[5]),
      shares: number(row[6]),
      currency: text(row[7]),
    }];
  });
  const totalWeight = holdings.reduce((sum, holding) => sum + holding.weight, 0);
  if (holdings.length < 5 || totalWeight < 95 || totalWeight > 105) {
    throw new Error(`Holdings validation failed: ${holdings.length} rows, ${totalWeight.toFixed(2)}% weight`);
  }
  const parsedDate = new Date(dateLabel.slice(6));
  if (Number.isNaN(parsedDate.getTime())) throw new Error(`Invalid effective date: ${dateLabel}`);
  return {
    etf: fund.symbol,
    issuer: fund.issuer,
    sourceUrl: fund.sourceUrl,
    effectiveDate: parsedDate.toISOString().slice(0, 10),
    fetchedAt: new Date().toISOString(),
    holdings,
    totalWeight,
  };
}

export async function fetchSpdrHoldings(fund: EtfDefinition): Promise<HoldingsSnapshot> {
  let response: Response;
  try {
    response = await fetch(fund.sourceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RotationDashboard/0.1; personal-research)",
        "Accept": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream;q=0.9,*/*;q=0.8",
      },
      next: { revalidate: 21_600 },
    });
  } catch (error) {
    throw new Error(`Issuer download failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!response.ok) throw new Error(`State Street returned HTTP ${response.status}`);
  try {
    return parseSpdrWorkbook(await response.arrayBuffer(), fund);
  } catch (error) {
    throw new Error(`Workbook parse failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
