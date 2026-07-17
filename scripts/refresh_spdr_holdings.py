"""Refresh validated Select Sector SPDR holdings snapshots from State Street."""

from __future__ import annotations

import io
import json
import re
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

import openpyxl


SYMBOLS = ["XLB", "XLC", "XLE", "XLF", "XLI", "XLK", "XLP", "XLRE", "XLU", "XLV", "XLY"]
URL = "https://www.ssga.com/library-content/products/fund-data/etfs/us/holdings-daily-us-en-{symbol}.xlsx"
OUTPUT = Path(__file__).parents[1] / "app" / "generated" / "spdr-holdings.json"
EQUITY_SYMBOL = re.compile(r"^[A-Z]{1,5}(?:\.[A-Z])?$")


def clean(value):
    if value is None:
        return None
    value = str(value).strip()
    return value if value and value != "-" else None


def refresh(symbol: str) -> dict:
    url = URL.format(symbol=symbol.lower())
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 RotationDashboard/0.1"})
    with urllib.request.urlopen(request, timeout=30) as response:
        content = response.read()
    sheet = openpyxl.load_workbook(io.BytesIO(content), data_only=True, read_only=True).active
    rows = list(sheet.iter_rows(values_only=True))
    if clean(rows[1][1]) != symbol or not clean(rows[2][1]).startswith("As of "):
        raise ValueError(f"{symbol}: workbook identity failed")
    holdings = []
    for row in rows[5:]:
        name, ticker, identifier, sedol, weight, sector, shares, currency = row[:8]
        ticker = clean(ticker)
        if not name or not ticker or not EQUITY_SYMBOL.fullmatch(ticker) or not isinstance(weight, (int, float)) or weight <= 0 or weight > 100:
            continue
        holdings.append({
            "name": clean(name), "symbol": ticker, "identifier": clean(identifier),
            "sedol": clean(sedol), "weight": weight, "sector": clean(sector),
            "shares": shares if isinstance(shares, (int, float)) else None, "currency": clean(currency),
        })
    total = sum(item["weight"] for item in holdings)
    if len(holdings) < 5 or not 95 <= total <= 105:
        raise ValueError(f"{symbol}: validation failed ({len(holdings)} rows, {total:.2f}% weight)")
    effective = datetime.strptime(clean(rows[2][1])[6:], "%d-%b-%Y").date().isoformat()
    return {"etf": symbol, "issuer": "State Street", "sourceUrl": url, "effectiveDate": effective,
            "fetchedAt": datetime.now(timezone.utc).isoformat(), "holdings": holdings, "totalWeight": total,
            "delivery": "validated-snapshot"}


def comparable(snapshot: dict) -> dict:
    """Return the data fields that should trigger a committed snapshot change."""
    return {key: value for key, value in snapshot.items() if key != "fetchedAt"}


def load_existing() -> dict:
    if not OUTPUT.exists():
        return {}
    try:
        value = json.loads(OUTPUT.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    return value if isinstance(value, dict) else {}


def main() -> None:
    fresh = {symbol: refresh(symbol) for symbol in SYMBOLS}
    existing = load_existing()
    snapshots = {}
    changed = False
    for symbol in SYMBOLS:
        if symbol in existing and comparable(existing[symbol]) == comparable(fresh[symbol]):
            # Preserve the prior retrieval time so an unchanged check produces no commit.
            snapshots[symbol] = existing[symbol]
        else:
            snapshots[symbol] = fresh[symbol]
            changed = True
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    if changed or not existing:
        OUTPUT.write_text(json.dumps(snapshots, separators=(",", ":")), encoding="utf-8")
        print("Holdings changed; wrote normalized snapshot")
    else:
        print("No holdings changes detected; leaving snapshot untouched")
    print("Refreshed " + ", ".join(f"{symbol} ({len(data['holdings'])})" for symbol, data in snapshots.items()))


if __name__ == "__main__":
    main()
