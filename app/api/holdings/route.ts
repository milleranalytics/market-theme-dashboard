import { NextRequest, NextResponse } from "next/server";
import { getLatestHoldingsSnapshots } from "../../lib/holdings-snapshot";
import { etfBySymbol } from "../../universe";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol")?.toUpperCase() ?? "";
  const fund = etfBySymbol.get(symbol);
  if (!fund) return NextResponse.json({ error: "Unsupported ETF" }, { status: 404 });
  const result = await getLatestHoldingsSnapshots();
  const snapshot = result.snapshots[symbol];
  if (!snapshot) return NextResponse.json({ error: "Holdings unavailable", etf: symbol, sourceUrl: fund.sourceUrl }, { status: 502 });
  return NextResponse.json({
    ...snapshot,
    delivery: result.delivery,
    snapshotUrl: result.snapshotUrl,
    refreshWarning: result.refreshWarning,
  });
}
