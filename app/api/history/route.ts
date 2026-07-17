import { NextResponse } from "next/server";
import { isEquitySymbol } from "../../lib/equity-symbol";
import { getLatestHoldingsSnapshots } from "../../lib/holdings-snapshot";
import { etfUniverse } from "../../universe";

export const dynamic = "force-dynamic";

type Bar = { c: number; t: string };
type HistoryReturn = { "1w": number; "1m": number; "3m": number; ytd: number };

const performance = (bars: Bar[], sessions: number) => {
  if (bars.length <= sessions) return null;
  return ((bars[bars.length - 1].c / bars[bars.length - 1 - sessions].c) - 1) * 100;
};

export async function GET() {
  const key = process.env.APCA_API_KEY_ID ?? process.env.ALPACA_API_KEY;
  const secret = process.env.APCA_API_SECRET_KEY ?? process.env.ALPACA_SECRET_KEY;
  const feed = process.env.ALPACA_FEED ?? "iex";
  if (!key || !secret) return NextResponse.json({ provider: "unavailable", reason: "alpaca_credentials_missing" }, { status: 503 });

  const snapshotResult = await getLatestHoldingsSnapshots();
  const symbols = Array.from(new Set([
    ...etfUniverse.map((fund) => fund.symbol),
    ...Object.values(snapshotResult.snapshots).flatMap((snapshot) => snapshot.holdings.map((holding) => holding.symbol).filter(isEquitySymbol)),
  ]));
  const barsBySymbol: Record<string, Bar[]> = {};
  const unsupported = new Set<string>();
  let rateLimited = false;
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - 430);

  const fetchBatch = async (batch: string[]): Promise<void> => {
    let pageToken: string | null = null;
    do {
      const url = new URL("https://data.alpaca.markets/v2/stocks/bars");
      url.searchParams.set("symbols", batch.join(","));
      url.searchParams.set("timeframe", "1Day");
      url.searchParams.set("start", start.toISOString());
      url.searchParams.set("adjustment", "all");
      url.searchParams.set("feed", feed);
      url.searchParams.set("limit", "10000");
      if (pageToken) url.searchParams.set("page_token", pageToken);
      const response = await fetch(url, { headers: { "APCA-API-KEY-ID": key, "APCA-API-SECRET-KEY": secret }, cache: "no-store" });
      if (!response.ok) {
        if (response.status === 429) rateLimited = true;
        if (response.status === 400 && batch.length > 1) {
          const middle = Math.ceil(batch.length / 2);
          await fetchBatch(batch.slice(0, middle));
          await fetchBatch(batch.slice(middle));
          return;
        }
        batch.forEach((symbol) => unsupported.add(symbol));
        return;
      }
      const payload = await response.json() as { bars?: Record<string, Bar[]>; next_page_token?: string | null };
      for (const [symbol, bars] of Object.entries(payload.bars ?? {})) {
        (barsBySymbol[symbol] ??= []).push(...bars);
      }
      pageToken = payload.next_page_token ?? null;
    } while (pageToken);
  };

  for (let offset = 0; offset < symbols.length; offset += 75) {
    await fetchBatch(symbols.slice(offset, offset + 75));
    if (rateLimited) break;
  }

  const returns: Record<string, HistoryReturn> = {};
  const rawRs: Record<string, number> = {};
  for (const [symbol, bars] of Object.entries(barsBySymbol)) {
    bars.sort((a, b) => a.t.localeCompare(b.t));
    const last = bars.at(-1);
    const priorYear = [...bars].reverse().find((bar) => new Date(bar.t).getUTCFullYear() < new Date(last?.t ?? 0).getUTCFullYear());
    const oneWeek = performance(bars, 5), oneMonth = performance(bars, 21), threeMonth = performance(bars, 63);
    if (last && priorYear && oneWeek !== null && oneMonth !== null && threeMonth !== null) {
      returns[symbol] = { "1w": oneWeek, "1m": oneMonth, "3m": threeMonth, ytd: ((last.c / priorYear.c) - 1) * 100 };
    }
    const r63 = performance(bars, 63), r126 = performance(bars, 126), r189 = performance(bars, 189), r252 = performance(bars, 252);
    if (r63 !== null && r126 !== null && r189 !== null && r252 !== null) rawRs[symbol] = .4 * r63 + .2 * r126 + .2 * r189 + .2 * r252;
  }
  const scores = Object.entries(rawRs).sort((a, b) => a[1] - b[1]);
  const rs: Record<string, number> = {};
  scores.forEach(([symbol], index) => { rs[symbol] = scores.length < 2 ? 50 : Math.round(1 + (index / (scores.length - 1)) * 98); });

  return NextResponse.json({ provider: "alpaca", feed, asOf: new Date().toISOString(), returns, rs,
    diagnostics: { requestedSymbols: symbols.length, historySymbols: Object.keys(barsBySymbol).length, rsPopulation: scores.length, unsupportedSymbols: [...unsupported], holdingsDelivery: snapshotResult.delivery } },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=21600, stale-while-revalidate=86400" } });
}
