# ZOBIRIS Hyperliquid Positioning + Swarm Calibration

Date: 2026-10-03  
Authority: **SHADOW_ONLY_NO_TRADING_AUTHORITY**

## What changed

ZOBIRIS now has a public, read-only Hyperliquid perpetual-positioning collector feeding the existing swarm shadow layer.

The collector reads aggregate perpetual market context only. It records:

- mark and oracle price;
- 24-hour price change;
- current funding rate and watchlist-relative funding percentile;
- current premium and watchlist-relative premium percentile;
- open interest in native units and estimated USD notional;
- 24-hour notional volume and volume/open-interest turnover;
- open-interest change versus a prior observation;
- cross-sectional size of the open-interest move;
- leverage-flow state and crowding state.

The history is persisted under the ZOBIRIS data volume with bounded retention and atomic writes.

## Flow states

When a meaningful prior observation exists, ZOBIRIS compares native open-interest change and price change over the same observation interval, then classifies unusually large OI moves as:

- **LEVERAGED_LONG_BUILD** — OI rises while price rises.
- **LEVERAGED_SHORT_BUILD** — OI rises while price falls.
- **SHORT_COVERING** — OI falls while price rises.
- **LONG_FLUSH** — OI falls while price falls.
- **NO_LARGE_FLOW_SIGNAL** — the OI move is not unusually large.
- **DELTA_UNAVAILABLE** — the prior observation is not mature enough.

These labels are descriptive. They are not trading instructions.

## Crowding states

Funding and premium are compared cross-sectionally among supported ZOBIRIS watchlist assets on Hyperliquid:

- **CROWDED_LONG**
- **LONG_BIAS**
- **BALANCED**
- **SHORT_BIAS**
- **CROWDED_SHORT**

This prevents a fixed funding threshold from pretending to be universal across different market regimes. USD OI is reported for scale, but OI-flow direction is computed from native open-interest units so price appreciation alone cannot manufacture an OI increase.

## Whale-evidence boundary

Hyperliquid aggregate perpetual context is **not** wallet-level whale evidence.

The current legacy swarm specialist key remains `onchainWhale` for schema continuity, but its live evidence is now explicitly derivatives-positioning evidence. The payload keeps:

`whaleWalletEvidence = UNKNOWN_PUBLIC_AGGREGATE_ONLY`

ZOBIRIS must not output claims such as “whales are buying” from aggregate funding/open-interest data alone. A later wallet-level source must have explicit identity/provenance before whale behavior can be promoted from UNKNOWN.

## Swarm effect

The derivatives specialist can alter only the swarm shadow consensus. It cannot:

- increase Strategy 2.1 order authority;
- bypass Kraken eligibility or liquidity gates;
- submit or edit orders;
- change production rank;
- turn missing/stale positioning into neutral evidence.

Stale or unavailable positioning becomes UNKNOWN.

## Realized ROI calibration

The existing forward ledger already stores swarm snapshots and realized outcomes at 30m, 2h, 8h, 12h, 1d, 3d and 7d.

A new authenticated calibration summary compares:

- swarm consensus score vs realized return;
- each specialist score vs realized return;
- positive-return rate;
- score/return Pearson correlation;
- average return for high-score observations (>=60);
- average return for low-score observations (<=40);
- high-minus-low realized return spread.

Calibration remains **COLLECTING** until at least 30 resolved observations exist for the selected horizon. Even after that threshold, the calibration endpoint has **NONE_SHADOW_ONLY** promotion authority. Any future production promotion requires a separate review and validation gate.

## Hidden diagnostics

No research-heavy UI panel is added.

Operator-authenticated diagnostics are available through:

- `GET /api/swarm/positioning?symbol=BTC&limit=100`
- `GET /api/swarm/calibration?horizon=1d&symbol=BTC`
- existing `GET /api/swarm/outcomes`

The public ZOBIRIS watchlist receives only the compact per-asset positioning shadow and swarm summary.
