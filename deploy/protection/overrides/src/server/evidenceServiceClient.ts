export interface ShadowOrderInput {
  source: string;
  decisionId?: string;
  decisionTime?: string;
  symbol: string;
  side: 'buy' | 'sell';
  requestedNotionalUsd: number;
  orderType: 'marketable' | 'resting_limit';
  limitPrice?: number;
  expirySec?: number;
  regime?: string;
}

type FetchLike = typeof fetch;

export class ZobirisEvidenceClient {
  constructor(
    private readonly baseUrl = process.env.ZOBIRIS_EVIDENCE_URL ?? '',
    private readonly token = process.env.ZOBIRIS_EVIDENCE_TOKEN ?? '',
    private readonly timeoutMs = 1500,
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  configured(): boolean {
    return this.baseUrl.trim().length > 0 && this.token.length >= 32;
  }

  private async call<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    if (!this.configured()) throw new Error('ZOBIRIS_EVIDENCE_URL / ZOBIRIS_EVIDENCE_TOKEN not configured');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      const root = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
      const res = await this.fetchImpl(root + path, {
        method,
        headers: {
          authorization: 'Bearer ' + this.token,
          ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: ctrl.signal,
      });
      const json = (await res.json()) as T;
      if (!res.ok) throw Object.assign(new Error('evidence service ' + res.status), { detail: json });
      return json;
    } finally {
      clearTimeout(timer);
    }
  }

  registerShadowOrder(order: ShadowOrderInput) {
    return this.call<{ ok: boolean; shadowOrderId: string; finalizeAt: string; duplicate?: boolean }>('POST', '/execution/shadow-orders', order);
  }
}

export interface EvidenceEntryAsset {
  symbol: string;
  state?: string | null;
  blockedReason?: string | null;
  krakenWsPair?: string | null;
  entry?: {
    referenceLimit?: number | null;
    requestedNotionalUsd?: number | null;
  } | null;
}

export interface ShadowPlanReportInput {
  decisionId: string;
  regime?: string | null;
  assets: EvidenceEntryAsset[];
}

export interface ShadowPlanReport {
  configured: boolean;
  attempted: number;
  registered: number;
  failures: { symbol: string; error: string }[];
}

export async function reportShadowEntryPlans(
  input: ShadowPlanReportInput,
  client: Pick<ZobirisEvidenceClient, 'configured' | 'registerShadowOrder'> = new ZobirisEvidenceClient(),
  now: () => number = () => Date.now(),
): Promise<ShadowPlanReport> {
  if (!client.configured()) return { configured: false, attempted: 0, registered: 0, failures: [] };

  const candidates = input.assets.filter((asset) => {
    const limit = asset.entry?.referenceLimit;
    const notional = asset.entry?.requestedNotionalUsd;
    return asset.state === 'QUALIFIED'
      && asset.blockedReason == null
      && typeof asset.krakenWsPair === 'string'
      && asset.krakenWsPair.includes('/')
      && typeof limit === 'number'
      && Number.isFinite(limit)
      && limit > 0
      && typeof notional === 'number'
      && Number.isFinite(notional)
      && notional > 0;
  });

  const failures: { symbol: string; error: string }[] = [];
  const decisionTime = new Date(now()).toISOString();
  let registered = 0;
  await Promise.all(candidates.map(async (asset) => {
    try {
      await client.registerShadowOrder({
        source: 'zobiris:production-entry-plan',
        decisionId: input.decisionId + ':' + asset.symbol,
        decisionTime,
        symbol: asset.krakenWsPair!,
        side: 'buy',
        requestedNotionalUsd: asset.entry!.requestedNotionalUsd!,
        orderType: 'resting_limit',
        limitPrice: asset.entry!.referenceLimit!,
        regime: input.regime ?? undefined,
      });
      registered += 1;
    } catch (error) {
      failures.push({ symbol: asset.symbol, error: error instanceof Error ? error.message : String(error) });
    }
  }));

  return { configured: true, attempted: candidates.length, registered, failures };
}
