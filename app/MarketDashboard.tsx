"use client";

import { useEffect, useMemo, useState } from "react";
import { marketGroups, periods, type MarketGroup, type PeriodKey } from "./data";

type FilterKey = "All" | "Sector" | "Theme";
type LiveResponse = {
  provider: "demo" | "alpaca";
  feed?: string;
  asOf: string;
  changes: Record<string, number>;
};

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
  const [selectedSymbol, setSelectedSymbol] = useState("SOXX");
  const [liveChanges, setLiveChanges] = useState<Record<string, number>>({});
  const [provider, setProvider] = useState<"demo" | "alpaca">("demo");
  const [feed, setFeed] = useState<string>("demo");
  const [asOf, setAsOf] = useState<string | null>(null);

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

  const valueFor = (group: MarketGroup) =>
    period === "today" && liveChanges[group.symbol] !== undefined
      ? liveChanges[group.symbol]
      : group.returns[period];

  const ranked = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return marketGroups
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
  const liveUniverse = Object.values(liveChanges).sort((a, b) => a - b);
  const liveRs = (symbol: string, fallback: number) => {
    const value = liveChanges[symbol];
    if (provider !== "alpaca" || value === undefined || liveUniverse.length < 2) return fallback;
    const below = liveUniverse.filter((item) => item < value).length;
    return Math.max(1, Math.min(99, Math.round((below / (liveUniverse.length - 1)) * 98 + 1)));
  };
  const selectedHoldings = selected.holdings
    .map((holding) => ({
      ...holding,
      today: provider === "alpaca" && liveChanges[holding.symbol] !== undefined ? liveChanges[holding.symbol] : holding.today,
      rs: liveRs(holding.symbol, holding.rs),
    }))
    .sort((a, b) => b.rs - a.rs);

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
            <strong>{provider === "alpaca" ? `Live via Alpaca · ${feed.toUpperCase()}` : "Demo data · Live-ready"}</strong>
            <span>Updated {formatTime(asOf)} · refreshes every 60 sec</span>
          </div>
        </div>
      </header>

      <section className="hero-grid">
        <div className="hero-copy">
          <p className="section-kicker">Sector & theme pulse</p>
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
            <div className="segmented" aria-label="Universe filter">
              {(["All", "Sector", "Theme"] as FilterKey[]).map((item) => (
                <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>
              ))}
            </div>
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
              <h4>Constituent leaders</h4>
            </div>
            <span>RS percentile</span>
          </div>
          <div className="holdings-list">
            {selectedHoldings.map((holding, index) => (
              <div className="holding-row" key={holding.symbol}>
                <span className="rank-number">{String(index + 1).padStart(2, "0")}</span>
                <div className="holding-company">
                  <strong>{holding.symbol}</strong>
                  <span>{holding.name}</span>
                </div>
                <div className="holding-weight">
                  <span>{holding.weight.toFixed(1)}% wt</span>
                  <div><i style={{ width: `${Math.min(100, holding.weight * 5)}%` }} /></div>
                </div>
                <span className={holding.today >= 0 ? "positive-text" : "negative-text"}>{formatPercent(holding.today)}</span>
                <StrengthBadge value={holding.rs} />
              </div>
            ))}
          </div>

          <div className="method-note">
            <span>Method</span>
            <p>ETF returns measure price leadership—not literal fund flows. RS ranks each holding against the tracked stock universe.</p>
          </div>
        </aside>
      </section>
      <footer>
        <span>Rotation dashboard · research prototype</span>
        <span>Sector ETFs + curated thematic ETFs</span>
      </footer>
    </main>
  );
}
