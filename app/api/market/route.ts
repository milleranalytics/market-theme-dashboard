import { NextResponse } from "next/server";
import { allSymbols } from "../../data";

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
      asOf: new Date().toISOString(),
      changes: {},
    });
  }

  const symbols = allSymbols.join(",");
  const url = new URL("https://data.alpaca.markets/v2/stocks/snapshots");
  url.searchParams.set("symbols", symbols);
  url.searchParams.set("feed", feed);

  try {
    const response = await fetch(url, {
      headers: {
        "APCA-API-KEY-ID": key,
        "APCA-API-SECRET-KEY": secret,
      },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Alpaca returned ${response.status}`);
    const snapshots = (await response.json()) as Record<string, Snapshot>;
    const changes: Record<string, number> = {};
    for (const [symbol, snapshot] of Object.entries(snapshots)) {
      const current = snapshot.dailyBar?.c;
      const prior = snapshot.prevDailyBar?.c;
      if (current && prior) changes[symbol] = ((current / prior) - 1) * 100;
    }
    return NextResponse.json({ provider: "alpaca", feed, asOf: new Date().toISOString(), changes });
  } catch {
    return NextResponse.json({ provider: "demo", feed: "demo", asOf: new Date().toISOString(), changes: {} });
  }
}
