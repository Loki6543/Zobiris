# Delayed Rotation v2 integration

Status: **research-prior implementation, not validated alpha**  
Prospective untouched validation begins **after 2026-10-04**.

This integration translates the verified delayed-rotation paper and the attached v1.3/v2 audit code into the production TypeScript path used by Strategy 2.1. The Python prototypes remain research references; production authority stays in the TypeScript engine and the existing execution/risk gates.

## Verified descriptive base

The 2026-10-04 59-asset appendix independently reproduces the paper's published arithmetic. The production classifier now uses the recovered reproducible base screen:

- 90-day return minus BTC 90-day return <= **-20 percentage points**
- 30-day return > **0%**
- 90-day return > **-35%**
- reported turnover >= **0.2% of market cap**

The 7-day state is then separated instead of blended:

- **ROTATION_CONFIRMED**: 0% < 7d <= 12%
- **ROTATION_FORMING**: -8% <= 7d < 0%
- **LAGGARD_UNCONFIRMED**: 7d < -8%
- **VALUE_TRAP**: ex-ante structural floor failure
- **ALREADY_CAUGHT_UP**: no longer satisfies the required BTC-relative lag

The descriptive pullback cohort remains the broader 7d < 0 definition for paper reproduction; the bounded -8% rule is the prospective decision variant. GHST at -8.65% is therefore descriptive-pullback but not prospective-pullback.

## Market-regime gate

Because the watchlist is intentionally enriched for laggards, 7-day watchlist breadth is **diagnostic only**. Using it as a hard bullish-market veto would make the specialist self-defeating: the verified 2026-10-04 sample had only 21/59 positive 7-day returns even while BTC and the 30-day structure were positive. The active regime gate therefore requires positive BTC 30-day and 90-day returns plus at least 45% positive 30-day watchlist breadth. The reported 7-day breadth remains visible for context but does not determine market eligibility.

## Measurement changes

Model-facing BTC-relative measurements use additive log-relative returns. Percentage-point gaps remain available for UI explanation.

The live CMC payload also carries a 60-day return. ZOBIRIS now exposes 60-day BTC-relative percentage-point and log-relative values as **diagnostic context only**. The verified paper's descriptive qualification rule remains the 90-day BTC-relative screen; the 60-day field does not qualify, disqualify, size, or rank a candidate.

Two relative-strength acceleration diagnostics are exposed:

- RSA(7,30) = XR7 / 7 - XR30 / 30
- RSA(30,90) = XR30 / 30 - XR90 / 90

RSA(30,90) is **diagnostic only**. On the verified 2026-10-04 base cohort it passes essentially every candidate, so it must never act as a qualification gate.

## Volume acceleration

When seven prior completed daily-volume observations are actually supplied, the engine computes:

VAccel(t) = V(t) / mean(V(t-1) ... V(t-7))

The current observation is excluded from its own baseline. Relative VAccel is log VAccel minus the cross-sectional median log VAccel.

The 1.15x level is a **research prior**, not a validated threshold. If seven completed historical daily-volume observations are absent, the engine reports volume evidence as unavailable instead of fabricating confirmation. Aggregate turnover remains a permissive research floor and is explicitly not treated as executable liquidity; Kraken spread/depth/impact gates remain authoritative for execution.

### Live volume-history source

The production CMC adapter now performs a **best-effort historical enrichment only when an authenticated CMC API key is available**. After the live latest-quote request succeeds, it requests the prior seven completed UTC daily observations from CMC's historical quotes endpoint and attaches only the observed `volume_24h` series to the normalized quote. The current partial UTC day is excluded by setting the historical end time to the previous completed UTC day.

This enrichment is fail-closed:

- keyless CMC operation does not manufacture a history series;
- entitlement, rate-limit, network, or historical-endpoint failure does not downgrade an otherwise-valid latest quote;
- failed history enrichment leaves `priorCompletedDailyVolumesUsd` absent and therefore leaves `volumeEvidenceStatus = UNAVAILABLE`;
- no fallback fixture, extrapolation, `volume_change_24h`, or synthetic series is accepted as a substitute for the seven completed daily observations.

This makes VAccel an evidence-backed research diagnostic when the required history is genuinely present, while preserving missing-evidence semantics when it is not.

## Anti-overclaim controls

Every delayed-rotation profile now carries:

- `scoreLabel = RESEARCH_PRIOR_SCORE`
- `validatedAlpha = false`
- `evidenceAuthority = RESEARCH_PRIOR_ONLY`
- `prospectiveValidationStart = 2026-10-05`

The score is a bounded research heuristic for describing already-screened setups. It is not a probability of profit, and it cannot replace identity, Kraken liquidity, spread/depth, structural-veto, or portfolio gates. Missing seven-day daily-volume history is now treated as missing evidence: no synthetic or neutral volume-confirmation value is injected into the score.

**Production authority is demote-only.** The delayed-rotation specialist may block or retain authority that was already granted by the established Strategy 2.1 opportunity, liquidity, risk, and portfolio gates. It cannot increase `maxNextOrderUsd`, manufacture eligibility, or raise the production next-dollar score. When the pilot screen passes, the production next-dollar score remains the established opportunity score; the delayed-rotation score stays separately visible as research evidence. The legacy `qualifiesForNewCapital` field is retained for API compatibility as a screen-pass flag, not as proof of alpha or an independent source of capital authority.

The production mode identifier remains `DELAYED_ROTATION_PILOT_V1` for API compatibility; the implementation behind it is the hardened v2 logic. Profiles now also expose `authorityEffect = DEMOTE_OR_FLAG_ONLY`, `canIncreaseAuthority = false`, and evidence provenance (`PROVIDER_LIVE`, `PROVIDER_SNAPSHOT_OR_FALLBACK`, or `UNKNOWN`).


## Validation-harness hardening

The independent v2 review controls are translated into a TypeScript research-audit helper at `src/strategy21/research/delayedRotationValidation.ts`. It is deliberately separate from production order authority.

The helper enforces:

- provenance-gated verdict language: synthetic data can only return `SELF_TEST_ONLY`;
- incomplete-layer reporting before any provisional support label;
- controlled dead-axis detection, so a varied parameter that never changes a score is reported as an unexecuted test;
- explicit retrospective (`R7d < 0`) versus prospective (`-8% <= R7d < 0`) pullback compliance, with a warning below 80%;
- an active-policy hash that excludes diagnostic-only knobs such as seven-day breadth.

These controls do not convert the October 4 cross-section into a backtest. A full matched-control, point-in-time historical panel and untouched prospective observations are still required before the hypothesis can be described as economically validated.

## Source audit findings carried forward

The integration preserves the useful findings from the attached audit package:

- no synthetic self-test may be represented as empirical evidence;
- absent evidence must remain absent rather than be imputed;
- catastrophic lag cannot earn extra credit simply because it is more negative;
- current-day volume is excluded from the seven-day volume baseline;
- the 0.2% turnover screen is weak and must not be called execution liquidity;
- the 59-asset snapshot is descriptive and endogenous, not a market-wide backtest;
- a genuine edge still requires point-in-time historical and untouched prospective, net-of-cost validation.

## Tests

The Strategy 2.1 delayed-rotation test suite now verifies:

1. the >=20pp BTC-relative 90-day lag requirement;
2. positive 30-day structure;
3. the -35% structural floor;
4. controlled versus deep pullback separation at -8%;
5. exclusion of already-caught-up assets;
6. VAccel's prior-seven-day denominator;
7. explicit RSA(30,90) degeneracy reporting;
8. 60-day BTC-relative diagnostics remain non-authoritative;
9. missing volume history cannot fabricate confirmation;
10. synthetic validation cannot emit a support verdict;
11. dead grid axes are detected by controlled comparison;
12. delayed rotation cannot increase Strategy 2.1 order authority or production next-dollar rank;
13. authenticated CMC history can populate exactly seven prior completed daily volumes for VAccel;
14. unavailable/unauthorized CMC history leaves the prior-volume field missing rather than substituting synthetic evidence.

No historical alpha, per-coin catch-up probability, reaction-lag estimate, or account-specific Kraken fee tier is asserted by this change.
