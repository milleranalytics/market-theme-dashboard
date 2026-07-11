"use client";

import { useEffect, useMemo, useState } from "react";
import { marketGroups, periods, type MarketGroup, type PeriodKey } from "./data";

type FilterKey = "All" | "Sector" | "Theme";
type LiveResponse = {
  provider: "demo" | "alpaca";
  feed?: string;
  asOf: string;
  changes: Record<string, number>;
  reason?: string;
};
type HoldingsResponse = { etf: string; issuer: string; effectiveDate: string; fetchedAt: string; totalWeight: number; holdings: Array<{ name: string; symbol: string | null; weight: number; shares: number | null; currency: string | null }> };

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
  const [liveChanges, setLiveChanges] = useState<Record<string, number>>({});
  const [provider, setProvider] = useState<"demo" | "alpaca">("demo");
  const [feed, setFeed] = useState<string>("demo");
  const [asOf, setAsOf] = useState<string | null>(null);
  const [marketReason, setMarketReason] = useState<string | null>(null);
  const [issuerHoldings, setIssuerHoldings] = useState<HoldingsResponse | null>(null);
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
    setHoldingsLoading(true); setHoldingsError(null); setShowAllHoldings(false);
    fetch(`/api/holdings?symbol=${selectedSymbol}`, { cache: "no-store" })
      .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error ?? "Holdings unavailable"); return body as HoldingsResponse; })
      .then((body) => { if (active) setIssuerHoldings(body); })
      .catch((error) => { if (active) { setIssuerHoldings(null); setHoldingsError(error.message); } })
      .finally(() => { if (active) setHoldingsLoading(false); });
    return () => { active = false; };
  }, [selectedSymbol]);

  const valueFor = (group: MarketGroup) =>
    period === "today" && liveChanges[group.symbol] !== undefined
      ? liveChanges[group.symbol]
      : group.returns[period];

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
  }, [filter, query, period, liveChanges]);

  const selected = marketGroups.find((group) => group.symbol === selectedSymbol) ?? ranked[0] ?? marketGroups[0];
  const maxAbs = Math.max(...ranked.map((group) => Math.abs(valueFor(group))), 1);
  const advancers = ranked.filter((group) => valueFor(group) > 0).length;
  const leader = ranked[0];
  const laggard = ranked[ranked.length - 1];
  const fullHoldings = issuerHoldings?.etf === selected.symbol ? issuerHoldings.holdings.map((holding) => {
    const today = holding.symbol ? liveChanges[holding.symbol] : undefined;
    return { ...holding, today, rs: undefined as number | undefined, contribution: today === undefined ? undefined : holding.weight * today / 100 };
  }) : [];
  const visibleHoldings = showAllHoldings ? fullHoldings : fullHoldings.slice(0, 12);
  const pricedWeight = fullHoldings.reduce((sum, holding) => sum + (holding.today === undefined ? 0 : holding.weight), 0);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark"><span /></div>
          <div>
            <p className="eyebrow">Market intelligence</p>
            <h1>Rotation</h1>
          </div>
        </div>
        <div className="status-block">
          <span className={`live-dot ${provider === "alpaca" ? "connected" : ""}`} />
          <div>
            <strong>{provider === "alpaca" ? `Live via Alpaca · ${feed.toUpperCase()}` : marketReason === "alpaca_credentials_missing" ? "Prices unavailable · Alpaca key required" : `Market data unavailable${marketReason?.startsWith("alpaca_http_") ? ` · HTTP ${marketReason.slice(12)}` : ""}`}</strong>
            <span>Updated {formatTime(asOf)} · refreshes every 60 sec</span>
          </div>
        </div>
      </header>

      <section className="hero-grid">
        <div className="hero-copy">
          <p className="section-kicker">Select Sector SPDR pulse</p>
          <h2>See leadership shift<br />before the story catches up.</h2>
          <p>ETF performance is the signal. Constituent relative strength shows whether the move is broad, narrow or breaking apart.</p>
        </div>
        <div className="summary-grid">
          <article className="summary-card leader-card">
            <span>Leader</span>
            <strong>{leader?.symbol}</strong>
            <em>{leader?.name}</em>
            <b>{leader ? formatPercent(valueFor(leader)) : "—"}</b>
          </article>
          <article className="summary-card">
            <span>Positive breadth</span>
            <strong>{ranked.length ? Math.round((advancers / ranked.length) * 100) : 0}%</strong>
            <em>{advancers} of {ranked.length} groups rising</em>
            <div className="mini-meter"><i style={{ width: `${ranked.length ? (advancers / ranked.length) * 100 : 0}%` }} /></div>
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
                selected={selected.symbol === group.symbol}
                onSelect={() => setSelectedSymbol(group.symbol)}
              />
            ))}
          </div>
        </section>

        <aside className="detail-panel panel">
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
                <strong className={selected.returns[item.key] >= 0 ? "positive-text" : "negative-text"}>
                  {formatPercent(item.key === "today" ? valueFor(selected) : selected.returns[item.key], 1)}
                </strong>
              </div>
            ))}
          </div>

          <div className="holdings-heading">
            <div>
              <p className="section-kicker">Inside the move</p>
              <h4>Complete portfolio</h4>
            </div>
            <span>{issuerHoldings ? `${issuerHoldings.holdings.length} positions` : "Issuer data"}</span>
          </div>
          <div className="holdings-provenance">
            <div><span>Source</span><strong>{issuerHoldings?.issuer ?? "State Street"}</strong></div>
            <div><span>Effective</span><strong>{issuerHoldings?.effectiveDate ?? "—"}</strong></div>
            <div><span>Priced weight</span><strong>{pricedWeight.toFixed(1)}%</strong></div>
            <div><span>Analytics</span><strong>{provider === "alpaca" ? feed.toUpperCase() : "Not configured"}</strong></div>
          </div>
          <div className="holdings-list">
            {holdingsLoading && <div className="holdings-state">Refreshing official holdings…</div>}
            {holdingsError && <div className="holdings-state error">Issuer refresh failed: {holdingsError}</div>}
            {!holdingsLoading && visibleHoldings.map((holding, index) => (
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
            <p>Contribution equals current portfolio weight × return. A dash means the price feed does not cover that position. Longer-term RS will replace prototype scores after the history cache is populated.</p>
          </div>
        </aside>
      </section>
      <footer>
        <span>Rotation dashboard · research prototype</span>
        <span>11 Select Sector SPDR ETFs · official issuer holdings</span>
      </footer>
    </main>
  );
}
