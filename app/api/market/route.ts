import { NextResponse } from "next/server";
import snapshots from "../../generated/spdr-holdings.json";
import { etfUniverse } from "../../universe";

export const dynamic = "force-dynamic";

type Snapshot = {
  dailyBar?: { c?: number };
  prevDailyBar?: { c?: number };
};

export async function GET() {
  const key = process.env.APCA_API_KEY_ID ?? process.env.ALPACA_API_KEY;
  const secret = process.env.APCA_API_SECRET_KEY ?? process.env.ALPACA_SECRET_KEY;
  const feed = process.env.ALPACA_FEED ?? "iex";

  if (!key || !secret) {
    return NextResponse.json({
      provider: "demo",
      feed: "demo",
      reason: "alpaca_credentials_missing",
      asOf: new Date().toISOString(),
      changes: {},
    });
  }

  const symbols = Array.from(new Set([
    ...etfUniverse.map((fund) => fund.symbol),
    ...Object.values(snapshots).flatMap((snapshot) => snapshot.holdings.map((holding) => holding.symbol).filter((symbol): symbol is string => Boolean(symbol))),
  ]));

  const changes: Record<string, number> = {};
  const errors: Array<{ batch: number; status: number; code: string; symbols?: string[] }> = [];
  const batchSize = 100;
  const fetchBatch = async (batch: string[], batchNumber: number): Promise<void> => {
    const url = new URL("https://data.alpaca.markets/v2/stocks/snapshots");
    url.searchParams.set("symbols", batch.join(","));
    url.searchParams.set("feed", feed);
    try {
      const response = await fetch(url, {
        headers: { "APCA-API-KEY-ID": key, "APCA-API-SECRET-KEY": secret },
        cache: "no-store",
      });
      if (!response.ok) {
        if (response.status === 400 && batch.length > 1) {
          const midpoint = Math.ceil(batch.length / 2);
          await fetchBatch(batch.slice(0, midpoint), batchNumber);
          await fetchBatch(batch.slice(midpoint), batchNumber);
          return;
        }
        errors.push({ batch: batchNumber, status: response.status, code: `alpaca_http_${response.status}`, symbols: batch });
        return;
      }
      const payload = (await response.json()) as Record<string, Snapshot>;
      for (const [symbol, snapshot] of Object.entries(payload)) {
        const current = snapshot.dailyBar?.c;
        const prior = snapshot.prevDailyBar?.c;
        if (current && prior) changes[symbol] = ((current / prior) - 1) * 100;
      }
    } catch {
      errors.push({ batch: batchNumber, status: 0, code: "alpaca_network_error", symbols: batch });
    }
  };
  for (let offset = 0; offset < symbols.length; offset += batchSize) {
    await fetchBatch(symbols.slice(offset, offset + batchSize), Math.floor(offset / batchSize) + 1);
  }
  const provider = Object.keys(changes).length ? "alpaca" : "demo";
  return NextResponse.json({
    provider,
    feed: provider === "alpaca" ? feed : "demo",
    reason: provider === "demo" ? errors[0]?.code ?? "alpaca_empty_response" : errors.length ? "alpaca_partial_response" : undefined,
    asOf: new Date().toISOString(),
    changes,
    diagnostics: { requestedSymbols: symbols.length, pricedSymbols: Object.keys(changes).length, failedBatches: errors },
  });
}
