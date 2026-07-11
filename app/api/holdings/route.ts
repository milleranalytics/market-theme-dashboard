import { NextRequest, NextResponse } from "next/server";
import { fetchSpdrHoldings } from "../../lib/spdr";
import { etfBySymbol } from "../../universe";
import snapshots from "../../generated/spdr-holdings.json";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol")?.toUpperCase() ?? "";
  const fund = etfBySymbol.get(symbol);
  if (!fund) return NextResponse.json({ error: "Unsupported ETF" }, { status: 404 });
  try {
    return NextResponse.json(await fetchSpdrHoldings(fund));
  } catch (error) {
    const fallback = snapshots[symbol as keyof typeof snapshots];
    if (fallback) {
      return NextResponse.json({
        ...fallback,
        delivery: "validated-snapshot",
        refreshWarning: error instanceof Error ? error.message : "Live issuer refresh failed",
      });
    }
    return NextResponse.json({ error: "Holdings unavailable", etf: symbol, sourceUrl: fund.sourceUrl }, { status: 502 });
  }
}
