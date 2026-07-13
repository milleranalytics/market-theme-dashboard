"use client";

import { useEffect, useMemo, useState } from "react";
import { marketGroups, periods, type MarketGroup, type PeriodKey } from "./data";
import packageMetadata from "../package.json";

type FilterKey = "All" | "Sector" | "Theme";
type LiveResponse = {
  provider: "demo" | "alpaca";
  feed?: string;
  asOf: string;
  changes: Record<string, number>;
  reason?: string;
};
type HoldingsResponse = { etf: string; issuer: string; effectiveDate: string; fetchedAt: string; checkedAt: string; totalWeight: number; delivery?: "github-automated-snapshot" | "bundled-fallback"; refreshWarning?: string; holdings: Array<{ name: string; symbol: string | null; weight: number; shares: number | null; currency: string | null }> };
type HistoryResponse = { provider: "alpaca"; asOf: string; returns: Record<string, { "1w": number; "1m": number; "3m": number; ytd: number }>; rs: Record<string, number> };

const formatPercent = (value: number, digits = 2) =>
  `${value > 0 ? "+" : ""}${value.toFixed(digits)}%`;

const formatTime = (value: string | null) => {
  if (!value) return "Demo snapshot";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Demo snapshot"
    : new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(date);
};

const formatCheckedTime = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
};

const businessDaysSince = (dateText?: string) => {
  if (!dateText) return 0;
  const cursor = new Date(`${dateText}T12:00:00Z`);
  if (Number.isNaN(cursor.getTime())) return 0;
  const today = new Date();
  let count = 0;
  cursor.setUTCDate(cursor.getUTCDate() + 1);
  while (cursor <= today) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
};

function StrengthBadge({ value }: { value: number }) {
  const tone = value >= 80 ? "elite" : value >= 60 ? "strong" : value >= 40 ? "neutral" : "weak";
  return <span className={`strength-badge ${tone}`}>RS {value}</span>;
}

function GroupRow({
  group,
  value,
  maxAbs,
  selected,
  onSelect,
}: {
  group: MarketGroup;
  value: number;
  maxAbs: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const width = Math.max(1.8, (Math.abs(value) / maxAbs) * 48);
  return (
    <button className={`group-row ${selected ? "selected" : ""}`} onClick={onSelect}>
      <span className="group-identity">
        <span className="symbol">{group.symbol}</span>
        <span className="group-name">{group.name}</span>
      </span>
      <span className="performance-track" aria-label={`${group.name} ${formatPercent(value)}`}>
        <span className="track-line" />
        <span
          className={`performance-bar ${value >= 0 ? "positive" : "negative"}`}
          style={value >= 0 ? { left: "50%", width: `${width}%` } : { right: "50%", width: `${width}%` }}
        />
        <span className="zero-line" />
      </span>
      <span className={`return-value ${value >= 0 ? "positive-text" : "negative-text"}`}>
        {formatPercent(value)}
      </span>
    </button>
  );
}

export function MarketDashboard() {
  const [period, setPeriod] = useState<PeriodKey>("today");
  const [filter, setFilter] = useState<FilterKey>("All");
  const [query, setQuery] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState("XLK");
  const [displayedSymbol, setDisplayedSymbol] = useState("XLK");
  const [liveChanges, setLiveChanges] = useState<Record<string, number>>({});
  const [provider, setProvider] = useState<"demo" | "alpaca">("demo");
  const [feed, setFeed] = useState<string>("demo");
  const [asOf, setAsOf] = useState<string | null>(null);
  const [marketReason, setMarketReason] = useState<string | null>(null);
  const [historyReturns, setHistoryReturns] = useState<HistoryResponse["returns"]>({});
  const [rsScores, setRsScores] = useState<Record<string, number>>({});
  const [holdingsCache, setHoldingsCache] = useState<Record<string, HoldingsResponse>>({});
  const [holdingsError, setHoldingsError] = useState<string | null>(null);
  const [holdingsLoading, setHoldingsLoading] = useState(false);
  const [showAllHoldings, setShowAllHoldings] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/market", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as LiveResponse;
        if (!active) return;
        setLiveChanges(payload.changes ?? {});
        setProvider(payload.provider);
        setFeed(payload.feed ?? payload.provider);
        setAsOf(payload.asOf);
        setMarketReason(payload.reason ?? null);
      } catch {
        // The bundled demo data remains the explicit fallback.
      }
    };
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/history", { cache: "no-store" })
      .then(async (response) => { if (!response.ok) throw new Error("History unavailable"); return response.json() as Promise<HistoryResponse>; })
      .then((payload) => { if (active) { setHistoryReturns(payload.returns ?? {}); setRsScores(payload.rs ?? {}); } })
      .catch(() => { if (active) { setHistoryReturns({}); setRsScores({}); } });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setShowAllHoldings(false);
    const cached = holdingsCache[selectedSymbol];
    if (cached) {
      setDisplayedSymbol(selectedSymbol);
    }
    const refresh = () => {
      setHoldingsLoading(true); setHoldingsError(null);
      fetch(`/api/holdings?symbol=${selectedSymbol}`, { cache: "no-store" })
        .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error ?? "Holdings unavailable"); return body as HoldingsResponse; })
        .then((body) => { if (active) { setHoldingsCache((current) => ({ ...current, [selectedSymbol]: body })); setDisplayedSymbol(selectedSymbol); } })
        .catch((error) => { if (active) setHoldingsError(error.message); })
        .finally(() => { if (active) setHoldingsLoading(false); });
    };
    refresh();
    const timer = window.setInterval(refresh, 15 * 60_000);
    return () => { active = false; window.clearInterval(timer); };
    // The selected fund controls this refresh cycle; cache updates must not restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSymbol]);

  const returnFor = (symbol: string, selectedPeriod: PeriodKey) => selectedPeriod === "today"
    ? liveChanges[symbol]
    : historyReturns[symbol]?.[selectedPeriod];
  const valueFor = (group: MarketGroup) => returnFor(group.symbol, period) ?? 0;

  const ranked = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const spdr = new Set(["XLB", "XLC", "XLE", "XLF", "XLI", "XLK", "XLP", "XLRE", "XLU", "XLV", "XLY"]);
    return marketGroups
      .filter((group) => spdr.has(group.symbol))
      .filter((group) => filter === "All" || group.type === filter)
      .filter((group) => !normalized || `${group.symbol} ${group.name}`.toLowerCase().includes(normalized))
      .sort((a, b) => valueFor(b) - valueFor(a));
    // liveChanges intentionally participates in ranking.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, query, period, liveChanges, historyReturns]);

  const selected = marketGroups.find((group) => group.symbol === displayedSymbol) ?? ranked[0] ?? marketGroups[0];
  const issuerHoldings = holdingsCache[displayedSymbol] ?? null;
  const maxAbs = Math.max(...ranked.map((group) => Math.abs(valueFor(group))), 1);
  const sectorAdvancers = ranked.filter((group) => valueFor(group) > 0).length;
  const leader = ranked[0];
  const laggard = ranked[ranked.length - 1];
  const etfSymbols = new Set(marketGroups.map((group) => group.symbol));
  const stockUniverse = Array.from(new Set([...Object.keys(historyReturns), ...Object.keys(liveChanges)]))
    .filter((symbol) => !etfSymbols.has(symbol) && returnFor(symbol, period) !== undefined);
  const stockAdvancers = stockUniverse.filter((symbol) => returnFor(symbol, period)! > 0).length;
  const stockBreadth = stockUniverse.length ? (stockAdvancers / stockUniverse.length) * 100 : 0;
  const fullHoldings = issuerHoldings?.etf === selected.symbol ? issuerHoldings.holdings
    .filter((holding) => holding.symbol && (Object.keys(historyReturns).length === 0 || historyReturns[holding.symbol] !== undefined || liveChanges[holding.symbol] !== undefined))
    .map((holding) => {
    const holdingReturn = holding.symbol ? returnFor(holding.symbol, period) : undefined;
    return { ...holding, today: holdingReturn, rs: holding.symbol ? rsScores[holding.symbol] : undefined, contribution: holdingReturn === undefined ? undefined : holding.weight * holdingReturn / 100 };
    }) : [];
  const visibleHoldings = showAllHoldings ? fullHoldings : fullHoldings.slice(0, 12);
  const pricedWeight = fullHoldings.reduce((sum, holding) => sum + (holding.today === undefined ? 0 : holding.weight), 0);
  const fundPriced = fullHoldings.filter((holding) => holding.today !== undefined);
  const fundAdvancers = fundPriced.filter((holding) => holding.today! > 0);
  const fundStockBreadth = fundPriced.length ? (fundAdvancers.length / fundPriced.length) * 100 : 0;
  const fundAdvancingWeight = fundAdvancers.reduce((sum, holding) => sum + holding.weight, 0);
  const fundWeightBreadth = pricedWeight ? (fundAdvancingWeight / pricedWeight) * 100 : 0;
  const holdingsAge = businessDaysSince(issuerHoldings?.effectiveDate);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></div>
          <div>
            <p className="eyebrow">Market intelligence</p>
            <h1>Sector Rotation Monitor</h1>
          </div>
        </div>
        <div className="status-block">
          <span className={`live-dot ${provider === "alpaca" ? "connected" : ""}`} />
          <strong>{provider === "alpaca" ? `Live via Alpaca · ${feed.toUpperCase()}` : marketReason === "alpaca_credentials_missing" ? "Prices unavailable · Alpaca key required" : `Market data unavailable${marketReason?.startsWith("alpaca_http_") ? ` · HTTP ${marketReason.slice(12)}` : ""}`}</strong>
        </div>
      </header>

      <section className="hero-grid">
        <div className="summary-grid">
          <article className="summary-card leader-card">
            <span>Leader</span>
            <strong>{leader?.symbol}</strong>
            <em>{leader?.name}</em>
            <b>{leader ? formatPercent(valueFor(leader)) : "—"}</b>
          </article>
          <article className="summary-card">
            <span>Stock breadth · {periods.find((item) => item.key === period)?.label}</span>
            <strong>{stockUniverse.length ? `${Math.round(stockBreadth)}%` : "—"}</strong>
            <em>{stockUniverse.length ? `${stockAdvancers} of ${stockUniverse.length} stocks rising` : "Loading stock participation"}</em>
            <small>{sectorAdvancers} of {ranked.length} sectors rising</small>
            <div className="mini-meter"><i style={{ width: `${stockBreadth}%` }} /></div>
          </article>
          <article className="summary-card laggard-card">
            <span>Laggard</span>
            <strong>{laggard?.symbol}</strong>
            <em>{laggard?.name}</em>
            <b>{laggard ? formatPercent(valueFor(laggard)) : "—"}</b>
          </article>
        </div>
      </section>

      <section className="workspace-grid">
        <section className="ranking-panel panel">
          <div className="panel-heading ranking-heading">
            <div>
              <p className="section-kicker">Ranked universe</p>
              <h3>What&apos;s moving</h3>
            </div>
            <div className="period-tabs" aria-label="Performance period">
              {periods.map((item) => (
                <button key={item.key} className={period === item.key ? "active" : ""} onClick={() => setPeriod(item.key)}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="toolbar">
            <div className="universe-chip">11 SPDR sector funds</div>
            <label className="search-box">
              <span>⌕</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find ETF or theme" />
            </label>
          </div>

          <div className="scale-labels"><span>Weakness</span><span>0</span><span>Strength</span></div>
          <div className="ranking-list">
            {ranked.map((group) => (
              <GroupRow
                key={group.symbol}
                group={group}
                value={valueFor(group)}
                maxAbs={maxAbs}
                selected={selectedSymbol === group.symbol}
                onSelect={() => setSelectedSymbol(group.symbol)}
              />
            ))}
          </div>
        </section>

        <aside className={`detail-panel panel ${holdingsLoading && issuerHoldings ? "refreshing" : ""}`}>
          {holdingsLoading && issuerHoldings && <div className="detail-refresh-indicator">Updating {selectedSymbol}…</div>}
          <div className="detail-hero">
            <div className="detail-type">{selected.type}</div>
            <div className="detail-symbol-row">
              <span className="ticker-chip">{selected.symbol}</span>
              <strong className={valueFor(selected) >= 0 ? "positive-text" : "negative-text"}>{formatPercent(valueFor(selected))}</strong>
            </div>
            <h3>{selected.name}</h3>
            <p>{selected.description}</p>
          </div>

          <div className="period-strip">
            {periods.map((item) => (
              <div key={item.key}>
                <span>{item.label}</span>
                <strong className={(returnFor(selected.symbol, item.key) ?? 0) >= 0 ? "positive-text" : "negative-text"}>
                  {returnFor(selected.symbol, item.key) === undefined ? "—" : formatPercent(returnFor(selected.symbol, item.key)!, 1)}
                </strong>
              </div>
            ))}
          </div>

          <div className="holdings-heading">
            <div>
              <p className="section-kicker">Inside the move</p>
              <h4>Complete portfolio</h4>
            </div>
            <span>{issuerHoldings ? `${fullHoldings.length} stocks` : "Issuer data"}</span>
          </div>
          <div className="holdings-provenance four-column">
            <div><span>Source</span><strong>{issuerHoldings?.issuer ?? "State Street"}</strong></div>
            <div><span>Effective</span><strong>{issuerHoldings?.effectiveDate ?? "—"}{holdingsAge > 2 ? " · stale" : ""}</strong></div>
            <div><span>Priced weight</span><strong>{pricedWeight.toFixed(1)}%</strong></div>
            <div><span>Analytics</span><strong>{provider === "alpaca" ? feed.toUpperCase() : "Not configured"}</strong></div>
          </div>
          <div className="fund-breadth">
            <div className="fund-breadth-copy">
              <span>Fund breadth · {periods.find((item) => item.key === period)?.label}</span>
              <strong>{fundPriced.length ? `${fundAdvancers.length} of ${fundPriced.length} stocks advancing` : "Loading participation"}</strong>
            </div>
            <div className="breadth-stat"><span>Stocks</span><strong>{fundPriced.length ? `${Math.round(fundStockBreadth)}%` : "—"}</strong></div>
            <div className="breadth-stat"><span>Weight</span><strong>{pricedWeight ? `${Math.round(fundWeightBreadth)}%` : "—"}</strong></div>
          </div>
          <div className="holdings-list">
            {holdingsLoading && !issuerHoldings && <div className="holdings-state">Loading official holdings…</div>}
            {holdingsError && <div className="holdings-state error">Issuer refresh failed: {holdingsError}</div>}
            {!holdingsLoading && issuerHoldings?.delivery === "bundled-fallback" && <div className="holdings-state error">Automated GitHub snapshot unavailable; showing the last bundled snapshot.</div>}
            {!holdingsLoading && holdingsAge > 2 && <div className="holdings-state error">Holdings are {holdingsAge} business days old. Check the automated refresh on the data health page.</div>}
            {visibleHoldings.map((holding, index) => (
              <div className="holding-row expanded" key={`${holding.symbol ?? holding.name}-${index}`}>
                <span className="rank-number">{String(index + 1).padStart(2, "0")}</span>
                <div className="holding-company">
                  <strong>{holding.symbol ?? "—"}</strong>
                  <span>{holding.name}</span>
                </div>
                <div className="holding-weight">
                  <span>{holding.weight.toFixed(1)}% wt</span>
                  <div><i style={{ width: `${Math.min(100, holding.weight * 5)}%` }} /></div>
                </div>
                <span className={holding.today === undefined ? "muted-value" : holding.today >= 0 ? "positive-text" : "negative-text"}>{holding.today === undefined ? "—" : formatPercent(holding.today)}</span>
                <span className={holding.contribution === undefined ? "muted-value" : holding.contribution >= 0 ? "positive-text" : "negative-text"}>{holding.contribution === undefined ? "—" : `${holding.contribution > 0 ? "+" : ""}${holding.contribution.toFixed(2)} pt`}</span>
                {holding.rs === undefined ? <span className="rs-pending">RS —</span> : <StrengthBadge value={holding.rs} />}
              </div>
            ))}
          </div>
          {fullHoldings.length > 12 && <button className="show-all" onClick={() => setShowAllHoldings((value) => !value)}>{showAllHoldings ? "Show top 12" : `Show all ${fullHoldings.length} positions`}</button>}

          <div className="method-note">
            <span>Method</span>
            <div>
              <p>Contribution equals current portfolio weight × selected-period return. RS is the 1–99 percentile of the weighted 3, 6, 9 and 12-month return formula across the tracked stock universe.</p>
              <p className="data-debug">Prices updated {formatTime(asOf)} · refresh every 60 sec<br />Holdings checked {formatCheckedTime(issuerHoldings?.checkedAt)} · refresh every 15 min · issuer snapshot retrieved {formatCheckedTime(issuerHoldings?.fetchedAt)}</p>
            </div>
          </div>
        </aside>
      </section>
      <footer>
        <span>Sector Rotation Monitor · v{packageMetadata.version}</span>
        <span>11 Select Sector SPDR ETFs · official issuer holdings</span>
      </footer>
    </main>
  );
}
