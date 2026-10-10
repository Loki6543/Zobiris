# Tactical margin research release — 2026-10-10

This is an isolated virtual $300 observer with no private exchange client, order submission, transfer authority or live toggle. The investment engine retains sole control of its portfolio. Atomic JSON beside the existing database holds tactical records. The observer assumes a single application process; horizontal replicas would require a shared transactional ledger and leader lease.

## Implemented
Public Kraken BTC/ETH/SOL book quotes and completed hourly candles drive fixed 20/50-hour averages, RSI14 and ATR14 rules for long, short or cash. Horizons are 4h, 24h and 120h. These are uncalibrated technical candidates. News, sentiment, Supertrend, Bollinger optimization and broad-market breadth remain future work.

Sizing precedes leverage. Experimental limits are 0.5% per position, 1% combined stop risk, two positions and one per asset. Shorter horizons receive priority and can consume available capacity. Unrealized losses count toward 2% daily and 8% peak-drawdown entry pauses. Stops are not guaranteed loss caps. Paper selection remains 1× because incremental advantage is unproven; the sizing library permits 1–1.5× and rejects 2×/3×. The educational slider does not change authority.

Proposals, rejections, simulated entries and observed exits persist with gross P/L, costs and net outcome. Minute sampling is not continuous exchange monitoring; gaps over three minutes mark outcomes incomplete. Missing data preserves unresolved positions and collateral reservations. Closed equity displayed in the UI excludes open P/L; internal risk gates include it. An authenticated operator can pause entries, with resumption requiring reviewed recovery. At 20,000 records admission pauses; no silent record deletion.

Historical replay uses the final 30% of available hourly candles with fixed rules and no tuning. Trades are non-overlapping within a horizon, but horizons overlap and their sample counts must not be combined. Stops precede targets when both touch; adverse opening gaps fill worse than the stop. Fractional research quantities do not reconstruct historical minimum-size metadata. Historical depth, funding, exchange liquidation and multi-cycle crashes are not modeled. This is a preliminary diagnostic, not qualification for live trading.

The simulator compares spot, margin and cash at equal notional. Leverage changes collateral use but does not add gross P/L at equal exposure. The full-account illustration uses fixed initial notional, no rebalancing or liquidation. A $300 account risking 1% with a 5% stop permits $60 before costs, less after reserves. Short losses are not clipped to account equity.

## Costs and operational findings
Assumptions: 0.40% trading plus 0.10% slippage per side, 0.03% opening and each completed four-hour interval on full margin exposure. These are stress inputs, not current exchange fee quotes. Observed bid/ask also includes spread. Sizing reserves costs for the full holding period.

Kraken's U.S. margin collateral can include existing account balances: separate app accounting does not isolate investment collateral. Account eligibility, bounded/segregated collateral, product-specific API permissions, exchange margin health and liquidation thresholds are unverified. All live trading remains disabled.

U.S. perpetuals have different fees and variable signed funding, documented as settling daily at 3pm CT. Reference increments are 0.01 BTC, 0.5 ETH and 5 SOL; current instrument details still require verification. Whole contracts must round down to the risk budget. Futures simulation and execution are not enabled.

Friday maintenance prevents order changes 5–6pm Chicago time, followed by possible restart disruption 6–7pm. New paper entries conservatively block both hours with DST-aware timezone handling. Quarterly and unplanned outages require separate operational checks; status/provider failures also gate entry.

## Evidence before escalation
Next work requires versioned multi-cycle candles, depth, fee/funding history, contract metadata, exchange liquidation rules and crash/outage/reconciliation tests. Use chronological development and holdout periods, purge overlapping horizons, walk-forward evaluation, and account for correlated samples and multiple strategy trials.

A proposed review floor of 90 days and 100 independent completed forward observations is not an automatic unlock. Require defensible uncertainty bounds for incremental net risk-adjusted advantage over matched spot/cash, cost sensitivity, acceptable tail loss and manual review. No count, hit rate or leveraged gain alone authorizes 2×/3×. No such validation is claimed here. Opportunity-cost scoring of rejected proposals, learned probability calibration, actual portfolio hedging, full futures models and controlled live automation remain subsequent stages.

## Primary sources reviewed
- https://support.kraken.com/articles/getting-started-us-margin — U.S. eligibility framework.
- https://support.kraken.com/articles/funding-us-margin-account — existing collateral treatment.
- https://support.kraken.com/articles/us-margin-fees — opening, trading and four-hour financing.
- https://support.kraken.com/articles/us-perpetual-futures — U.S. product and funding structure.
- https://support.kraken.com/articles/contract-specifications — reference increments.
- https://support.kraken.com/articles/maintenance-windows-us-perpetual-futures — maintenance restrictions.
- https://docs.kraken.com/api-reference/trading/add-order — generic capabilities do not establish U.S. account permissions.
- https://docs.kraken.com/api-reference/market-data/get-ohlc-data — 720-bar limit and incomplete final candle.
- https://docs.cdp.coinbase.com/coinbase-app/advanced-trade-apis/guides/futures — U.S. API alternative, not connected.
- https://www.davidhbailey.com/dhbpapers/backtest-prob.pdf — backtest selection risk.
- https://arxiv.org/abs/2101.01261 — liquidation-aware hedging, not validation of this strategy.
