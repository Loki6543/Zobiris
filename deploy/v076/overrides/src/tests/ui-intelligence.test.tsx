// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from '../ui/App';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: () => null,
  Area: () => null,
}));

class ResizeObserverStub { observe() {} unobserve() {} disconnect() {} }

const overview = {
  authority: 'SHADOW_ONLY_NO_TRADING_AUTHORITY',
  asOf: '2026-09-13T00:00:00.000Z',
  provenance: { source: 'v0.7.0-research-fixture', dataMode: 'snapshot', note: 'Research evidence snapshot.' },
  researchIntegrity: {
    strategyId: 'link-btc-relative-leadership', experimentCount: 37, overallStatus: 'UNKNOWN', promotable: false,
    pointInTimeUniverse: 'WATCH', deflatedSharpe: { status: 'WATCH', value: 0.91 },
    probabilityBacktestOverfit: { status: 'UNKNOWN', value: null }, cpcv: { status: 'UNKNOWN', value: null },
    parameterStability: { status: 'PASS', value: 0.78 }, benchmarkGate: { status: 'PASS', comparisons: [] },
    failureReasons: ['PBO status is UNKNOWN.', 'CPCV status is UNKNOWN.'],
  },
  relativeOpportunity: [
    { symbol: 'LINK', usdThesisScore: 82, btcRelativeScore: 91, parentRelativeScore: 84, parentSymbol: 'ETH', relativeStrength: 1.13, relativeMomentum: 0.11, altReturnPct: 330.43, btcReturnPct: 167.93, parentReturnPct: 155.45, recommendation: 'ALT', rotationState: 'LEADING', btcOpportunityRegretPct: 162.5, parentOpportunityRegretPct: 174.98, summary: 'LINK: USD thesis and relative opportunity agree -> prefer ALT.' },
    { symbol: 'QNT', usdThesisScore: 72, btcRelativeScore: 31, parentRelativeScore: null, parentSymbol: null, relativeStrength: 0.91, relativeMomentum: -0.06, altReturnPct: 7.04, btcReturnPct: 167.93, parentReturnPct: null, recommendation: 'BTC', rotationState: 'LAGGING', btcOpportunityRegretPct: -160.89, parentOpportunityRegretPct: null, summary: 'QNT: Bullish USD / weak vs BTC -> stay BTC.' },
  ],
  ecosystemEdges: [
    { parentSymbol: 'SOL', childSymbol: 'RAY', rollingBeta: 1.65, leadLagMinutes: 45, upsideCapture: 1.8, downsideCapture: 1.1, relativeMomentum: 0.18, capitalFlowConfirmation: 0.82, capitalFlowDataMode: 'snapshot', baseConfidence: 0.78, state: 'AMPLIFYING', conditionalOpportunity: 93, confidence: 0.78, capitalFlowKnown: true, explanation: 'RAY is amplifying SOL.' },
  ],
  executionReadiness: [
    { symbol: 'LINK', spreadBps: 7, fillProbability: 0.78, toxicityScore: 0.18, orderBookVelocity: 0.42, requestedOrderUsd: 45, capacityUsd: 220, urgency: 0.25, action: 'MAKER_SAFE', allowedOrderUsd: 45, rationale: ['Spread, fill probability, and toxicity support passive execution.'] },
  ],
  attentionIgnition: [],
  ownershipRisk: [],
};

describe('v0.7.0 intelligence operator views', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    vi.stubGlobal('fetch', vi.fn().mockImplementation((input: string | URL | Request) => {
      const url = String(input);
      const payload = url === '/api/watchlist'
        ? { source: 'fixture', watchlist: [{ rank: 1, symbol: 'BTC', name: 'Bitcoin' }] }
        : url === '/api/snapshot/latest'
          ? { snapshot: { asOf: '2026-09-13T00:00:00.000Z', rankedAssets: [{ symbol: 'BTC', opportunityRank: 1, opportunity: { adjusted: 80 }, confidence: { pct: 80 }, risk: 'Low', action: 'HOLD', evidenceClaimIds: [] }] } }
          : url === '/api/providers'
            ? { providers: [] }
            : url === '/api/intelligence/overview'
              ? overview
              : url === '/api/asset/BTC'
                ? { caseFile: null, evidence: [] }
                : null;
      if (payload === null) return Promise.reject(new Error(`unhandled ${url}`));
      return Promise.resolve({ ok: true, status: 200, statusText: 'OK', json: async () => payload } as Response);
    }));
    Object.defineProperty(window, 'matchMedia', { writable: true, value: vi.fn().mockImplementation(() => ({ matches: false, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() })) });
  });

  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it('navigates all v0.7.0 shadow intelligence surfaces', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    render(<QueryClientProvider client={queryClient}><App /></QueryClientProvider>);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Intelligence Overview' }));
    expect(await screen.findByText('SHADOW ONLY')).toBeTruthy();
    expect(screen.getByText(/Bullish USD \/ weak vs BTC/i)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Research Integrity' }));
    expect(screen.getByRole('heading', { name: 'Research Integrity' })).toBeTruthy();
    expect(screen.getByText(/37 experiments/i)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Relative Opportunity' }));
    expect(screen.getByRole('heading', { name: 'Relative Opportunity' })).toBeTruthy();
    expect(screen.getByText(/stay BTC/i)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Ecosystem Graph' }));
    expect(screen.getByRole('heading', { name: 'Ecosystem Graph' })).toBeTruthy();
    expect(screen.getByText(/SOL → RAY/)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Execution Readiness' }));
    expect(screen.getByRole('heading', { name: 'Execution Readiness' })).toBeTruthy();
    expect(screen.getByText('MAKER SAFE')).toBeTruthy();
  });
});