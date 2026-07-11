import Link from "next/link";
import { etfUniverse } from "../universe";
import { GITHUB_SNAPSHOT_URL } from "../lib/holdings-snapshot";
import "./style.css";

export const metadata = { title: "Data Health | Rotation" };

export default function DataHealthPage() {
  return (
    <main className="health-shell">
      <header>
        <div><p>Rotation internals</p><h1>Data health</h1></div>
        <Link href="/">Return to dashboard</Link>
      </header>
      <section className="health-note">
        <strong>Debug surface</strong>
        <span>This route is intentionally not linked from the main dashboard. Open <code>/data-health</code> directly.</span>
      </section>
      <section className="health-grid">
        <article><span>Universe</span><strong>{etfUniverse.length}</strong><p>Select Sector SPDR ETFs</p></article>
        <article><span>Holdings source</span><strong>State Street</strong><p>Official workbooks refreshed by GitHub Actions</p></article>
        <article><span>Price source</span><strong>Alpaca</strong><p>IEX by default; configured server-side</p></article>
      </section>
      <section className="source-panel">
        <div className="source-heading"><div><p>Holdings ingestion</p><h2>Automated snapshot</h2></div><span>Weekdays · 6:30 PM CT</span></div>
        <div className="health-note">
          <strong>Delivery path</strong>
          <span>GitHub downloads and validates the issuer files. The app checks the <a href={GITHUB_SNAPSHOT_URL}>latest normalized snapshot</a> every six hours and uses its bundled copy only if GitHub is unavailable.</span>
        </div>
        <div className="source-list">
          {etfUniverse.map((fund) => (
            <div className="source-row" key={fund.symbol}>
              <strong>{fund.symbol}</strong><span>{fund.name}</span><code>{fund.issuer}</code>
              <a href={`/api/holdings?symbol=${fund.symbol}`}>Inspect current response</a>
            </div>
          ))}
        </div>
      </section>
      <section className="contract">
        <h2>Validation contract</h2>
        <ul>
          <li>Workbook ticker must match the requested ETF.</li>
          <li>An explicit holdings effective date must be present and parseable.</li>
          <li>At least five valid positions must be present.</li>
          <li>Normalized weights must total between 95% and 105%.</li>
          <li>Invalid downloads return an error and are never presented as valid holdings.</li>
          <li>The dashboard warns when an effective date is more than two business days old.</li>
        </ul>
      </section>
    </main>
  );
}
