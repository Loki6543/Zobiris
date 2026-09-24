#!/usr/bin/env node
import { randomUUID } from 'node:crypto';

const base = process.argv[2] ?? 'https://zobiris-production.up.railway.app';
const origin = new URL(base.endsWith('/') ? base : `${base}/`);
const token = process.env.ZOBIRIS_REFRESH_TOKEN;
if (!token) throw new Error('ZOBIRIS_REFRESH_TOKEN is missing');
if (!['http:', 'https:'].includes(origin.protocol)) throw new Error('invalid origin');

async function jsonCheck(path, options, expected, label, timeoutMs = 15000) {
  const response = await fetch(new URL(path, origin), {
    ...options,
    redirect: 'manual',
    signal: AbortSignal.timeout(timeoutMs),
  });
  const contentType = response.headers.get('content-type') ?? '';
  let payload = null;
  try { payload = await response.json(); } catch {}
  const pass = expected.includes(response.status) && contentType.includes('application/json') && payload !== null;
  console.log(`${pass ? 'PASS' : 'FAIL'} ${label}: HTTP ${response.status}`);
  if (!pass) throw new Error(`${label} failed`);
  return { response, payload };
}

function snapshotIdentity(payload) {
  const snapshot = payload?.snapshot ?? null;
  return {
    id: snapshot?.id ?? null,
    asOf: snapshot?.asOf ?? null,
  };
}

await jsonCheck('/api/health', {}, [200], 'health JSON');

const integrityBefore = await jsonCheck('/api/integrity', {}, [200], 'v0.7.6 integrity endpoint');
if (integrityBefore.payload?.version !== '0.7.6') throw new Error('integrity endpoint is not v0.7.6');
if (integrityBefore.payload?.policy?.sameOriginRefreshEnabled !== true) throw new Error('same-origin refresh is not enabled');
if (integrityBefore.payload?.policy?.liveProvidersEnabled !== true) throw new Error('live providers are not enabled');
console.log('PASS integrity policy enables same-origin refresh and live providers');

for (const path of ['/api/refresh', '/api/strategy21/collect', '/api/agents/challenge']) {
  await jsonCheck(path, { method: 'POST' }, [401, 403], `anonymous ${path}`);
  await jsonCheck(path, {
    method: 'POST',
    headers: { Authorization: `Bearer invalid-${randomUUID()}` },
  }, [401, 403], `wrong-token ${path}`);
}

const crossOrigin = await jsonCheck('/api/refresh', {
  method: 'POST',
  headers: {
    Origin: 'https://evil.example',
    'Sec-Fetch-Site': 'cross-site',
    'Content-Type': 'application/json',
  },
  body: '{}',
}, [401, 403], 'cross-origin refresh rejected');
if (crossOrigin.payload?.error == null) throw new Error('cross-origin rejection did not return an error payload');

const before = await jsonCheck('/api/snapshot/latest', {}, [200], 'snapshot before browser refresh');
const beforeIdentity = snapshotIdentity(before.payload);

const browserRefresh = await jsonCheck('/api/refresh', {
  method: 'POST',
  headers: {
    Origin: origin.origin,
    'Sec-Fetch-Site': 'same-origin',
    'Content-Type': 'application/json',
  },
  body: '{}',
}, [200], 'same-origin browser refresh', 90000);

const refresh = browserRefresh.payload ?? {};
const diagnosticProviders = await jsonCheck('/api/providers', {}, [200], 'providers after browser refresh');
const redact = (key, value) => /token|secret|key|authorization/i.test(key) ? '[REDACTED]' : value;
console.log('DIAGNOSTIC refresh summary:', JSON.stringify({
  keys: Object.keys(refresh),
  live: refresh.live ?? null,
  observationCount: refresh.observationCount ?? null,
  evidenceClaimCount: refresh.evidenceClaimCount ?? null,
  attentionCollection: refresh.attentionCollection ?? null,
  providerHealth: refresh.providerHealth ?? null,
  errors: refresh.errors ?? null,
}, redact));
console.log('DIAGNOSTIC providers:', JSON.stringify(diagnosticProviders.payload, redact));
if (refresh.live !== true) throw new Error('browser refresh did not run live provider policy');
if (!(Number(refresh.observationCount) > 2)) throw new Error('browser refresh did not expand beyond the BTC/SOL-only observation floor');
if (!(Number(refresh.evidenceClaimCount) > 2)) throw new Error('browser refresh did not expand beyond the BTC/SOL-only evidence floor');
const attentionStatus = refresh.attentionCollection?.status ?? null;
if (attentionStatus === 'FAILED' || attentionStatus === 'DISABLED' || attentionStatus == null) {
  throw new Error(`attention collection is not usable: ${attentionStatus ?? 'missing'}`);
}
console.log(`PASS browser refresh expanded live evidence coverage; attention status ${attentionStatus}`);

const after = await jsonCheck('/api/snapshot/latest', {}, [200], 'snapshot after browser refresh');
const afterIdentity = snapshotIdentity(after.payload);
if (!afterIdentity.id || afterIdentity.id === beforeIdentity.id) throw new Error('snapshot id did not advance after browser refresh');
console.log('PASS snapshot advanced after browser refresh');

const btc = await jsonCheck('/api/asset/BTC', {}, [200], 'BTC case file after refresh');
const caseFile = btc.payload?.caseFile;
if (!caseFile?.decisionBoundary) throw new Error('BTC case file is missing decisionBoundary');
const horizons = new Set((caseFile?.evidence ?? []).map((item) => item?.impactHorizon).filter(Boolean));
if (horizons.size === 0) throw new Error('BTC case file is missing evidence impact horizons');
console.log(`PASS BTC exposes decision boundary and evidence horizons: ${[...horizons].join(', ')}`);

const positive = await fetch(new URL('/api/agents/challenge', origin), {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  redirect: 'manual',
  signal: AbortSignal.timeout(15000),
});
console.log(`PASS valid-token protected handler reached: HTTP ${positive.status}`);
if (positive.status === 401 || positive.status === 403) {
  throw new Error('valid token was rejected by protected handler');
}

await jsonCheck('/api/definitely-not-a-route', {}, [404], 'unknown API route returns JSON 404');

const readPaths = ['/', '/api/health', '/api/integrity', '/api/db-info', '/api/watchlist', '/api/providers', '/api/snapshots?limit=5'];
for (const path of readPaths) {
  const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(15000) });
  const text = await response.text();
  if (text.includes(token)) throw new Error(`refresh token leaked in ${path}`);
  if (path === '/') {
    const srcs = [...text.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]);
    for (const src of srcs) {
      const scriptUrl = new URL(src, origin);
      const js = await (await fetch(scriptUrl, { signal: AbortSignal.timeout(15000) })).text();
      if (js.includes(token)) throw new Error(`refresh token leaked in bundle ${scriptUrl.pathname}`);
    }
  }
}
console.log('PASS secret absent from checked UI/API responses');
console.log(JSON.stringify({
  checkedAt: new Date().toISOString(),
  origin: origin.origin,
  result: 'PASS',
  snapshotBefore: beforeIdentity,
  snapshotAfter: afterIdentity,
  refresh: {
    snapshotId: refresh.snapshotId ?? null,
    observationCount: refresh.observationCount ?? null,
    evidenceClaimCount: refresh.evidenceClaimCount ?? null,
    live: refresh.live ?? null,
    attentionStatus,
  },
  btc: {
    decisionBoundary: true,
    impactHorizons: [...horizons],
  },
}));
