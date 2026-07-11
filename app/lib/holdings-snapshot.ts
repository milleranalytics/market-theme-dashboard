import bundledSnapshots from "../generated/spdr-holdings.json";
import { etfUniverse } from "../universe";

export const GITHUB_SNAPSHOT_URL =
  "https://raw.githubusercontent.com/milleranalytics/market-theme-dashboard/main/app/generated/spdr-holdings.json";

type Holding = {
  name: string;
  symbol: string | null;
  weight: number;
  shares: number | null;
  currency: string | null;
  [key: string]: unknown;
};

export type HoldingsSnapshot = {
  etf: string;
  issuer: string;
  sourceUrl: string;
  effectiveDate: string;
  fetchedAt: string;
  holdings: Holding[];
  totalWeight: number;
  delivery?: string;
};

export type HoldingsSnapshotMap = Record<string, HoldingsSnapshot>;

export type SnapshotResult = {
  snapshots: HoldingsSnapshotMap;
  delivery: "github-automated-snapshot" | "bundled-fallback";
  snapshotUrl: string;
  refreshWarning?: string;
};

function validateSnapshots(value: unknown): HoldingsSnapshotMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Snapshot is not an object");
  const candidate = value as HoldingsSnapshotMap;
  for (const fund of etfUniverse) {
    const snapshot = candidate[fund.symbol];
    if (!snapshot || snapshot.etf !== fund.symbol) throw new Error(`Snapshot is missing ${fund.symbol}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(snapshot.effectiveDate) || Number.isNaN(Date.parse(`${snapshot.effectiveDate}T00:00:00Z`))) {
      throw new Error(`${fund.symbol} has an invalid effective date`);
    }
    if (!Array.isArray(snapshot.holdings) || snapshot.holdings.length < 5) throw new Error(`${fund.symbol} has too few holdings`);
    if (!Number.isFinite(snapshot.totalWeight) || snapshot.totalWeight < 95 || snapshot.totalWeight > 105) {
      throw new Error(`${fund.symbol} has an invalid total weight`);
    }
    for (const holding of snapshot.holdings) {
      if (!holding.name || !holding.symbol || !Number.isFinite(holding.weight) || holding.weight <= 0) {
        throw new Error(`${fund.symbol} contains an invalid holding`);
      }
    }
  }
  return candidate;
}

export async function getLatestHoldingsSnapshots(): Promise<SnapshotResult> {
  try {
    const response = await fetch(GITHUB_SNAPSHOT_URL, { next: { revalidate: 21600 } });
    if (!response.ok) throw new Error(`GitHub snapshot returned HTTP ${response.status}`);
    return {
      snapshots: validateSnapshots(await response.json()),
      delivery: "github-automated-snapshot",
      snapshotUrl: GITHUB_SNAPSHOT_URL,
    };
  } catch (error) {
    return {
      snapshots: validateSnapshots(bundledSnapshots),
      delivery: "bundled-fallback",
      snapshotUrl: GITHUB_SNAPSHOT_URL,
      refreshWarning: error instanceof Error ? error.message : "GitHub snapshot refresh failed",
    };
  }
}

