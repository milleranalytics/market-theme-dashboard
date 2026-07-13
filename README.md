# Market Sector Strength Dashboard

Rotation is a research dashboard for the 11 Select Sector SPDR ETFs. It ranks sector performance, shows each fund's complete equity portfolio, estimates each holding's contribution to the selected-period return, measures breadth, and calculates longer-term relative-strength percentiles.

## Data architecture

- **ETF universe:** the 11 Select Sector SPDR funds defined in `app/universe.ts`.
- **Holdings:** official State Street daily XLSX workbooks. A scheduled GitHub Action downloads, normalizes, validates, and commits `app/generated/spdr-holdings.json` on weekdays.
- **Prices:** Alpaca Market Data, using the IEX feed by default.
- **Historical returns:** adjusted Alpaca daily bars for 1W, 1M, 3M, and YTD.
- **Relative strength:** percentile rank from 1–99 across the tracked constituent universe using `0.4 × P(63) + 0.2 × P(126) + 0.2 × P(189) + 0.2 × P(252)`.

The hosted app checks the GitHub holdings snapshot when it opens. If it cannot reach GitHub or the snapshot fails validation, it uses the validated snapshot bundled with the deployment and displays a warning. The hidden `/data-health` route documents the sources and exposes normalized fund responses for debugging.

## Automated holdings refresh

`.github/workflows/refresh-spdr-holdings.yml` runs at 23:30 UTC Monday through Friday (after the U.S. market closes) and can also be started manually. The workflow:

1. Downloads all 11 issuer workbooks.
2. Keeps valid positive-weight holdings and normalizes their fields.
3. Rejects incomplete or implausible fund data.
4. Commits a changed snapshot back to `main`.

GitHub Actions must be enabled for the repository and the workflow must have permission to write repository contents.

## Local development

Requires Node.js 22.13 or newer and Python 3.12+ for the holdings refresh script.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Add your Alpaca credentials to `.env.local`. Never commit that file.

```text
APCA_API_KEY_ID=your_alpaca_key_id
APCA_API_SECRET_KEY=your_alpaca_secret_key
ALPACA_FEED=iex
```

Build and test with:

```bash
npm run build
node --test tests/rendered-html.test.mjs
```

To refresh holdings locally:

```bash
python -m pip install openpyxl
python scripts/refresh_spdr_holdings.py
```

## Methodology notes

- Contribution is current portfolio weight multiplied by the selected-period stock return. For historical periods it is an attribution estimate because it uses today's weight, not the historical weight path.
- Stock breadth is the share of unique priced constituents with a positive return for the selected period.
- Fund breadth includes both equal-weight stock participation and the share of priced portfolio weight advancing.
- The dashboard is a market research tool, not investment advice or an execution system.

## Versioning

The application version is maintained in `package.json` and displayed in the dashboard footer. Patch releases contain fixes, minor releases add compatible features, and major releases mark fundamental product or methodology changes.

## Hosting

The application is hosted privately with OpenAI Sites. GitHub is the canonical source and runs the scheduled holdings update; Sites continues to provide the hosted application and stores its Alpaca secrets separately.
