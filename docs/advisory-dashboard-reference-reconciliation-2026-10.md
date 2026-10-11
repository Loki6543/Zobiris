# ZOBIRIS — Advisory dashboard reference reconciliation

**Reference supplied:** `zobiris_trading_advisory_engine(2).html` (92 KB static HTML prototype).  
**Target:** existing deployed React / TypeScript ZOBIRIS on Railway.  
**Status:** design/IA adoption with research-only safety boundaries. Not an import of the HTML execution logic.

## Goals and layout choices

Maintain the existing ZOBIRIS portfolio and BTC analytics while making eight concepts from the reference discoverable without eight unrelated, mock-filled application tabs.

| Reference tab | Production placement | Data authority |
| --- | --- | --- |
| Spot & Margin Command | Existing Command Center with four new navigation tiles | Kraken snapshot + authenticated private account |
| Spot CMC Watchlist | Watchlist, now filterable by ready/pending/delayed/missing observations | Existing fresh CMC quote evidence and strategy metadata |
| Kraken Margin Watchlist | Tactical paper terminal + Advisory Research / Margin risk | Kraken public quote coverage; account-specific margin permissions **not** verified |
| Delayed Entry Spot | Watchlist › Delayed rotation filter; delayed research remains demote/flag only | Existing `strategy21.delayedRotation`; not a standalone order |
| AI Signal & Meta-Sizing | Advisory Research › Signal validation | Daily BTC brief; validated `p_meta` not available |
| Margin Risk & Margin Call | Advisory Research › Margin risk + paper terminal | No assertion of verified liquidation thresholds or borrowing status |
| Funding & Spot Arbitrage | Advisory Research › Funding & basis | Explicit unavailable provider coverage; no purported yield |
| Execution Backtest & Stress | Advisory Research › Execution & stress | Explicit gross arithmetic scenarios, no order authorization or validated performance |

## Rejected from HTML reference

Do **not** ship its hard-coded spot prices, 48/16 pair counts, daily 99% VaR, 68.4% win rate, 0.82 meta-probability, $25k trade size, 5× cap, 40%/50% margin thresholds, fixed hourly borrowing schedules, collateral haircuts, arbitrage yields or claim that offsetting legs have zero risk. They are prototype examples, not supported evidence for ZOBIRIS's live account, venue, jurisdiction or execution costs. External Tailwind/Chart.js CDNs are not added.

## User experience

- Keep existing protected portfolio state, history, Time Outlook, Compare Lab, Bitcoin analysis, watchlist and paper margin terminal.
- Command Center gets a focused group of navigation tiles instead of more research-heavy tables.
- Advisory Research gives four interactive categories: signal validation, margin risk, funding & basis, execution & stress.
- The stress explorer only models `capital × leverage × underlyingMove` and caps scenarios at 1.5×; it is gross-only, excluding fees/slippage, collateral, funding, liquidation, basis and stop execution.
- Watchlist categories derive exclusively from `ready`, snapshot freshness, quote freshness and existing delayed-rotation records, not invented market sectors or unsupported Kraken pair eligibility.
- Explicit missing/stale states and research-only labels avoid accidentally promoting data gaps to trading recommendations.
- Accessible button semantics, `aria-pressed` on selected categories, responsive layouts, readable typographic hierarchy and reduced-motion support.

## Verification

Canonical production Docker build: `npx tsc -p tsconfig.production.json --noEmit`, Vitest suite, production Vite UI and baseline research verification. Add regression tests for missing or stale signals, invalid stress inputs, mock-metric avoidance, navigation actions, quote categories and private/public boundary.

If CI is green, merge via PR and check Railway's two `main`-tracking deployments separately. Build success does not establish runtime activation.

## Future research, not granted by this UI

Kraken margin eligibility/borrowing schedules per product and account, liquidation engine collateral haircuts, funding settlement history, spot-perp depth and basis, triple-barrier independent labels and calibrated `p_meta`, CPCV/PBO/DSR, and scenario execution costs require actual source data and prospective validation. None is inferred from the HTML mockup.
