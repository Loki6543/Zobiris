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

## Measurement changes

Model-facing BTC-relative measurements use additive log-relative returns. Percentage-point gaps remain available for UI explanation.

Two relative-strength acceleration diagnostics are exposed:

- RSA(7,30) = XR7 / 7 - XR30 / 30
- RSA(30,90) = XR30 / 30 - XR90 / 90

RSA(30,90) is **diagnostic only**. On the verified 2026-10-04 base cohort it passes essentially every candidate, so it must never act as a qualification gate.

## Volume acceleration

When seven prior completed daily-volume observations are actually supplied, the engine computes:

VAccel(t) = V(t) / mean(V(t-1) ... V(t-7))

The current observation is excluded from its own baseline. Relative VAccel is log VAccel minus the cross-sectional median log VAccel.

The 1.15x level is a **research prior**, not a validated threshold. If seven completed historical daily-volume observations are absent, the engine reports volume evidence as unavailable instead of fabricating confirmation. Aggregate turnover remains a permissive research floor and is explicitly not treated as executable liquidity; Kraken spread/depth/impact gates remain authoritative for execution.

## Anti-overclaim controls

Every delayed-rotation profile now carries:

- `scoreLabel = RESEARCH_PRIOR_SCORE`
- `validatedAlpha = false`
- `evidenceAuthority = RESEARCH_PRIOR_ONLY`
- `prospectiveValidationStart = 2026-10-05`

The score is a bounded heuristic for ordering already-screened setups. It is not a probability of profit, and it cannot replace identity, Kraken liquidity, spread/depth, structural-veto, or portfolio gates.

The production mode identifier remains `DELAYED_ROTATION_PILOT_V1` for API compatibility; the implementation behind it is the hardened v2 logic.

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
7. explicit RSA(30,90) degeneracy reporting.

No historical alpha, per-coin catch-up probability, reaction-lag estimate, or account-specific Kraken fee tier is asserted by this change.
