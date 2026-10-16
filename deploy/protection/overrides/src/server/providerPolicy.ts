export type ProviderHealthLike = {
  provider?: string;
  status?: string;
};

// A provider that needs credentials nobody has supplied cannot run, so it is not reported at all: no "not configured",
// no "covered by fallback". It reappears on its own the moment its credentials exist and the first check records a status.
export function providerHealthView(rows: ProviderHealthLike[]) {
  const providers = (Array.isArray(rows) ? rows : []).filter((row) => String(row?.status ?? "").toLowerCase() !== "credentials-needed");
  return {
    providers,
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
  const { optionalChallengers: _omit, ...rest } = raw;
  return {
    ...rest,
    status: "BASELINE_COMPLETE",
    baseline: "CMC_KEYLESS",
  };
}
