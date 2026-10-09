export type ProviderHealthLike = {
  provider?: string;
  status?: string;
};

const OPTIONAL_PROVIDER_FALLBACKS: Record<string, {
  fallback: string[];
  scope: string;
}> = {
  lunarcrush: {
    fallback: ["CMC keyless market context", "public RSS research", "Bright Data evidence investigator"],
    scope: "social/news context without proprietary LunarCrush composites",
  },
  coinglass: {
    fallback: ["Hyperliquid public positioning", "Kraken execution/liquidity evidence"],
    scope: "derivatives/positioning context without proprietary CoinGlass data",
  },
  coinmarketcal: {
    fallback: ["public RSS research", "Bright Data evidence investigator"],
    scope: "event/news discovery without proprietary CoinMarketCal calendar data",
  },
};

export function providerHealthView(rows: ProviderHealthLike[]) {
  const providers: ProviderHealthLike[] = [];
  const optionalFallbacks: Array<{
    provider: string;
    status: "COVERED_BY_FALLBACK";
    fallback: string[];
    scope: string;
  }> = [];

  for (const row of Array.isArray(rows) ? rows : []) {
    const provider = String(row?.provider ?? "").toLowerCase();
    const status = String(row?.status ?? "").toLowerCase();
    const fallback = OPTIONAL_PROVIDER_FALLBACKS[provider];
    if (fallback && status === "credentials-needed") {
      optionalFallbacks.push({
        provider,
        status: "COVERED_BY_FALLBACK",
        fallback: fallback.fallback,
        scope: fallback.scope,
      });
      continue;
    }
    providers.push(row);
  }

  return {
    providers,
    optionalFallbacks,
    policy: {
      credentialGatedProvidersAreOptional: true,
      noSyntheticData: true,
      authority: "FALLBACKS_CANNOT_INCREASE_TRADING_AUTHORITY",
    },
  } as const;
}

export function attentionAvailabilityView(raw: any, env: NodeJS.ProcessEnv) {
  if (!raw || typeof raw !== "object") return raw;
  const firestreamConfigured = Boolean(
    env.STOCKTWITS_FIRESTREAM_USERNAME && env.STOCKTWITS_FIRESTREAM_PASSWORD,
  );
  if (raw.status !== "PARTIAL" || firestreamConfigured) return raw;
  return {
    ...raw,
    status: "BASELINE_COMPLETE",
    baseline: "CMC_KEYLESS",
    optionalChallengers: [
      {
        provider: "stocktwits-firestream",
        status: "NOT_CONFIGURED_OPTIONAL",
      },
    ],
    note: "The credential-free CMC attention baseline completed. Stocktwits Firestream remains an optional challenger and no longer degrades operational health when credentials are absent.",
  };
}
