import { z } from "zod";

export const EngineStateSchema=z.enum([
  "WAIT_FOR_PULLBACK",
  "READY",
  "QUALIFIED",
  "NEAR_ROTATION",
  "TOO_EARLY",
  "ALREADY_EXTENDED",
  "STRUCTURALLY_WEAK",
  "MARKET_NOT_BULLISH",
  "LIQUIDITY_FAIL",
  "RISK_BLOCKED",
  "EXCLUDED",
  "DATA_INCOMPLETE",
  "DATA_STALE",
  "BENCHMARK",
  "NO_KRAKEN_USD_MARKET",
  "KRAKEN_MARKET_NOT_ONLINE",
  "KRAKEN_IDENTITY_UNVERIFIED",
  "KRAKEN_ASSET_MISMATCH",
  "EXECUTION_WARMUP",
]);
export type EngineState=z.infer<typeof EngineStateSchema>;

export const MarketDepthGradeSchema=z.enum([
  "INSTITUTIONAL","DEEP","NORMAL","SMALL_SIZE_ONLY","VERY_THIN"
]);

export const ProviderStatusSchema=z.enum(["LIVE","DEGRADED","STALE","ERROR","MISSING"]);
export type ProviderStatus=z.infer<typeof ProviderStatusSchema>;

export const ProviderHealthSchema=z.object({
  status:ProviderStatusSchema,
  lastAttemptAt:z.string().nullable(),
  lastSuccessAt:z.string().nullable(),
  dataAsOf:z.string().nullable(),
  ageMs:z.number().nullable(),
  error:z.string().nullable(),
  mode:z.string().nullable(),
});
export type ProviderHealth=z.infer<typeof ProviderHealthSchema>;

export const EngineRowSchema=z.object({
  rank:z.number().int().positive(),
  symbol:z.string().min(1),
  name:z.string().min(1),
  cmcRank:z.number().int().positive().nullable(),
  state:EngineStateSchema,
  priceUsd:z.number().nullable(),
  intendedLimitPrice:z.number().nullable(),
  change7dPct:z.number().nullable(),
  change30dPct:z.number().nullable(),
  change90dPct:z.number().nullable(),
  relative30dVsBtcPct:z.number().nullable(),
  relative90dVsBtcPct:z.number().nullable(),
  catchUpQuality:z.number(),
  entryQuality:z.number(),
  marketDepthGrade:MarketDepthGradeSchema.nullable(),
  personalExecutionPass:z.boolean().nullable(),
  krakenPair:z.string().nullable(),
  setupQualified:z.boolean(),
  maxNewOrderUsd:z.number().min(0),
  qualifiesForNewCapital:z.boolean(),
  reasonCodes:z.array(z.string()),
});
export type EngineRow=z.infer<typeof EngineRowSchema>;

export const ClockHealthSchema=z.object({
  state:z.enum(["HEALTHY","DEGRADED"]),
  wallMonotonicDriftMs:z.number(),
  futureProviderTimestampCount:z.number().int().min(0),
  reasons:z.array(z.string()),
});

export const StageHealthSchema=z.object({
  name:z.string(),
  status:z.enum(["SUCCESS","DEGRADED","FAILED","SKIPPED"]),
  durationMs:z.number().min(0),
  error:z.string().nullable(),
});

export const EngineSnapshotSchema=z.object({
  version:z.literal("1.0"),
  generatedAt:z.string(),
  policy:z.object({
    version:z.string(),
    hash:z.string().regex(/^[a-f0-9]{64}$/),
  }),
  authority:z.object({
    newBuyEnabled:z.boolean(),
    reasons:z.array(z.string()),
  }),
  market:z.object({
    state:z.enum(["BULLISH","NOT_BULLISH","DATA_INCOMPLETE"]),
    btcPriceUsd:z.number().nullable(),
    btc7dPct:z.number().nullable(),
    btc30dPct:z.number().nullable(),
    btc90dPct:z.number().nullable(),
    breadth7dPositive:z.number().nullable(),
    breadth30dPositive:z.number().nullable(),
  }),
  health:z.object({
    cmc:ProviderStatusSchema,
    krakenInstruments:ProviderStatusSchema,
    executionSampled:z.number().int().min(0),
    watchlistCount:z.number().int().min(0),
    lastRefreshAttemptAt:z.string(),
    lastRefreshSuccessAt:z.string().nullable(),
    refreshDurationMs:z.number().min(0),
    lastError:z.string().nullable(),
    providers:z.object({
      cmcQuotes:ProviderHealthSchema,
      cmcMetadata:ProviderHealthSchema,
      krakenInstruments:ProviderHealthSchema,
      krakenTicker:ProviderHealthSchema,
    }),
    clock:ClockHealthSchema,
    stages:z.array(StageHealthSchema),
  }),
  qualifiedCount:z.number().int().min(0),
  nearRotationCount:z.number().int().min(0),
  rows:z.array(EngineRowSchema),
});
export type EngineSnapshot=z.infer<typeof EngineSnapshotSchema>;

export const EngineApiSuccessSchema=z.object({
  ok:z.literal(true),
  snapshot:EngineSnapshotSchema,
});
export const EngineApiWarmupSchema=z.object({
  ok:z.literal(false),
  state:z.literal("WARMUP"),
  message:z.string(),
});

export const HealthResponseSchema=z.object({
  ok:z.boolean(),
  service:z.literal("zobiris-core"),
  schemaVersion:z.number().int().min(0),
  now:z.string(),
  database:z.object({
    ok:z.boolean(),
    result:z.string(),
    estimatedBytes:z.number().min(0),
  }),
  policy:z.object({
    version:z.string(),
    hash:z.string().regex(/^[a-f0-9]{64}$/),
  }),
  engine:z.object({
    authorityEnabled:z.boolean(),
    lastRefreshSuccessAt:z.string().nullable(),
    providers:z.object({
      cmcQuotes:ProviderHealthSchema,
      cmcMetadata:ProviderHealthSchema,
      krakenInstruments:ProviderHealthSchema,
      krakenTicker:ProviderHealthSchema,
    }),
    clock:ClockHealthSchema,
  }).nullable(),
});

export const MetricsResponseSchema=z.object({
  ok:z.literal(true),
  now:z.string(),
  refreshes24h:z.object({
    total:z.number().int().min(0),
    failed:z.number().int().min(0),
  }),
  openEpisodes:z.number().int().min(0),
  overdueOutcomes:z.number().int().min(0),
  databaseBytes:z.number().min(0),
  authorityEnabled:z.boolean(),
  providerStatuses:z.record(z.string(),ProviderStatusSchema),
  clockState:z.enum(["HEALTHY","DEGRADED"]),
  policy:z.object({version:z.string(),hash:z.string().regex(/^[a-f0-9]{64}$/)}),
});


export const MinimumEvidenceResponseSchema=z.object({
  ok:z.literal(true),
  evidence:z.object({
    policyVersion:z.string(),
    policyHash:z.string().regex(/^[a-f0-9]{64}$/),
    horizon:z.string(),
    qualifiedEpisodes:z.number().int().min(0),
    controlEpisodes:z.number().int().min(0),
    independentMarketEpisodes:z.number().int().min(0),
    promotable:z.boolean(),
    reasons:z.array(z.string()),
  }),
});
