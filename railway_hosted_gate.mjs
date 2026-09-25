#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { unlink } from 'node:fs/promises';

const publicBase = process.argv[2] ?? 'https://zobiris-production.up.railway.app';
const publicOrigin = new URL(publicBase.endsWith('/') ? publicBase : `${publicBase}/`);
const token = process.env.ZOBIRIS_REFRESH_TOKEN;
if (!token) throw new Error('ZOBIRIS_REFRESH_TOKEN is missing');
if (!['http:', 'https:'].includes(publicOrigin.protocol)) throw new Error('invalid public origin');

const localPort = 31337;
const localOrigin = new URL(`http://127.0.0.1:${localPort}/`);
const localDb = `/tmp/zobiris-predeploy-${process.pid}.sqlite`;

async function jsonCheck(origin, path, options, expected, label, timeoutMs = 15000) {
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

async function waitForHealth(origin, timeoutMs = 45000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(new URL('/api/health', origin), {
        signal: AbortSignal.timeout(2500),
      });
      if (response.ok) return;
      lastError = new Error(`health returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`candidate server did not become healthy: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

function snapshotIdentity(payload) {
  const snapshot = payload?.snapshot ?? null;
  return { id: snapshot?.id ?? null, asOf: snapshot?.asOf ?? null };
}

const redact = (key, value) => /token|secret|key|authorization/i.test(key) ? '[REDACTED]' : value;

async function verifyNoSecret(origin, readPaths) {
  for (const path of readPaths) {
    const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(15000) });
    const body = await response.text();
    if (body.includes(token)) throw new Error(`refresh token leaked in ${origin.origin}${path}`);
    if (path === '/') {
      const srcs = [...body.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]);
      for (const src of srcs) {
        const scriptUrl = new URL(src, origin);
        const js = await (await fetch(scriptUrl, { signal: AbortSignal.timeout(15000) })).text();
        if (js.includes(token)) throw new Error(`refresh token leaked in bundle ${scriptUrl.pathname}`);
      }
    }
  }
}

async function verifySimpleUi(origin) {
  const root = await fetch(new URL("/", origin), { signal: AbortSignal.timeout(15000) });
  const html = await root.text();
  const srcs = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map((match) => match[1]);
  let bundle = "";
  for (const src of srcs) {
    const response = await fetch(new URL(src, origin), { signal: AbortSignal.timeout(15000) });
    bundle += await response.text();
  }
  for (const required of ["ZOBIRIS CORE", "Market Today", "History / Learning", "Current positions", "BEST FIRST COURSE OF ACTION", "SELL / HARVEST LADDER", "BUY / RE-ENTRY RANGE", "DEFENSIVE REDUCTION", "Why Zobiris learned this:", "Kraken gate passed", "funded cash added", "Maneuver capital"]) {
    if (!bundle.includes(required)) throw new Error("candidate simplified UI is missing " + required);
  }
  console.log("PASS candidate simplified three-screen UI bundle");
}

async function verifyPublicBaseline() {
  await jsonCheck(publicOrigin, '/api/health', {}, [200], 'public health JSON');
  const integrity = await jsonCheck(publicOrigin, '/api/integrity', {}, [200], 'public integrity endpoint');
  if (integrity.payload?.version !== '0.7.6') throw new Error('public baseline is not v0.7.6');
  await jsonCheck(publicOrigin, '/api/watchlist', {}, [200], 'public watchlist');
  await verifyNoSecret(publicOrigin, ['/', '/api/health', '/api/integrity', '/api/db-info', '/api/watchlist', '/api/providers']);
  console.log('PASS public baseline remains healthy and secret-free');
}

async function verifyCandidate() {
  const child = spawn(process.execPath, ['--import', 'tsx', 'src/server/server.ts'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: 'production',
      HOST: '127.0.0.1',
      PORT: String(localPort),
      ZOBIRIS_DB_PATH: localDb,
      ZOBIRIS_ALLOW_ANONYMOUS_REFRESH: '0',
      ZOBIRIS_ALLOW_SAME_ORIGIN_REFRESH: '1',
      ZOBIRIS_ALLOW_LIVE_PROVIDERS: '1',
      ZOBIRIS_ATTENTION_COLLECT_ON_REFRESH: '1',
      ZOBIRIS_STRATEGY21_AUTO_COLLECT: '0',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += String(chunk); if (stdout.length > 12000) stdout = stdout.slice(-12000); });
  child.stderr.on('data', (chunk) => { stderr += String(chunk); if (stderr.length > 12000) stderr = stderr.slice(-12000); });

  try {
    await waitForHealth(localOrigin);

    const integrity = await jsonCheck(localOrigin, '/api/integrity', {}, [200], 'candidate integrity endpoint');
    if (integrity.payload?.version !== '0.7.6') throw new Error('candidate integrity endpoint is not v0.7.6');
    if (integrity.payload?.policy?.sameOriginRefreshEnabled !== true) throw new Error('candidate same-origin refresh is not enabled');
    if (integrity.payload?.policy?.liveProvidersEnabled !== true) throw new Error('candidate live providers are not enabled');
    console.log('PASS candidate integrity policy enables same-origin refresh and live providers');

    for (const path of ['/api/refresh', '/api/strategy21/collect', '/api/agents/challenge']) {
      await jsonCheck(localOrigin, path, { method: 'POST' }, [401, 403], `candidate anonymous ${path}`);
      await jsonCheck(localOrigin, path, {
        method: 'POST',
        headers: { Authorization: `Bearer invalid-${randomUUID()}` },
      }, [401, 403], `candidate wrong-token ${path}`);
    }

    const crossOrigin = await jsonCheck(localOrigin, '/api/refresh', {
      method: 'POST',
      headers: {
        Origin: 'https://evil.example',
        'Sec-Fetch-Site': 'cross-site',
        'Content-Type': 'application/json',
      },
      body: '{}',
    }, [401, 403], 'candidate cross-origin refresh rejected');
    if (crossOrigin.payload?.error == null) throw new Error('candidate cross-origin rejection did not return an error payload');

    const before = await jsonCheck(localOrigin, '/api/snapshot/latest', {}, [200, 404], 'candidate snapshot before browser refresh');
    const beforeIdentity = before.response.status === 200 ? snapshotIdentity(before.payload) : { id: null, asOf: null };

    // Candidate runs on localhost during predeploy, so production-origin browser
    // authorization is not meaningful here. Same-origin behavior is covered by
    // the build's dedicated security regression; use bearer auth here to probe
    // the candidate's real live-provider refresh path before promotion.
    const browserRefresh = await jsonCheck(localOrigin, '/api/refresh', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    }, [200], 'candidate authenticated live refresh', 90000);

    const refresh = browserRefresh.payload ?? {};
    const diagnosticProviders = await jsonCheck(localOrigin, '/api/providers', {}, [200], 'candidate providers after browser refresh');
    console.log('DIAGNOSTIC candidate refresh summary:', JSON.stringify({
      live: refresh.live ?? null,
      observationCount: refresh.observationCount ?? null,
      evidenceClaimCount: refresh.evidenceClaimCount ?? null,
      attentionStatus: refresh.attentionCollection?.status ?? null,
      providerHealth: refresh.providerHealth ?? null,
      errors: refresh.errors ?? null,
    }, redact));
    console.log('DIAGNOSTIC candidate providers:', JSON.stringify(diagnosticProviders.payload, redact));

    if (refresh.live !== true) throw new Error('candidate refresh did not run live provider policy');
    if (!(Number(refresh.observationCount) > 2)) throw new Error('candidate refresh did not expand beyond the BTC/SOL-only observation floor');
    if (!(Number(refresh.evidenceClaimCount) > 2)) throw new Error('candidate refresh did not expand beyond the BTC/SOL-only evidence floor');

    const attentionStatus = refresh.attentionCollection?.status ?? null;
    if (attentionStatus === 'FAILED' || attentionStatus === 'DISABLED' || attentionStatus == null) {
      throw new Error(`candidate attention collection is not usable: ${attentionStatus ?? 'missing'}`);
    }
    console.log(`PASS candidate refresh expanded live evidence coverage; attention status ${attentionStatus}`);

    const after = await jsonCheck(localOrigin, '/api/snapshot/latest', {}, [200], 'candidate snapshot after browser refresh');
    const afterIdentity = snapshotIdentity(after.payload);
    if (!afterIdentity.id || afterIdentity.id === beforeIdentity.id) throw new Error('candidate snapshot id did not advance after refresh');
    console.log('PASS candidate snapshot advanced after browser refresh');

    const eth = await jsonCheck(localOrigin, '/api/asset/ETH', {}, [200], 'candidate ETH case file after refresh');
    const comp = await jsonCheck(localOrigin, '/api/asset/COMP', {}, [200], 'candidate COMP case file after refresh');
    const ethHasCurrentMarket = (eth.payload?.caseFile?.evidence ?? []).some((item) => item?.provider === 'kraken' || item?.source?.includes?.('kraken'));
    const compHasCurrentMarket = (comp.payload?.caseFile?.evidence ?? []).some((item) => item?.provider === 'kraken' || item?.source?.includes?.('kraken'));
    if (!ethHasCurrentMarket && !compHasCurrentMarket) {
      throw new Error('candidate expanded refresh did not surface Kraken market evidence for ETH or COMP');
    }
    console.log('PASS candidate exposes expanded Kraken evidence beyond BTC/SOL');

    const btc = await jsonCheck(localOrigin, '/api/asset/BTC', {}, [200], 'candidate BTC case file after refresh');
    const caseFile = btc.payload?.caseFile;
    if (!caseFile?.decisionBoundary) throw new Error('candidate BTC case file is missing decisionBoundary');
    const horizons = new Set((caseFile?.evidence ?? []).map((item) => item?.impactHorizon).filter(Boolean));
    if (horizons.size === 0) throw new Error('candidate BTC case file is missing evidence impact horizons');
    console.log(`PASS candidate BTC exposes decision boundary and evidence horizons: ${[...horizons].join(', ')}`);

    const positive = await fetch(new URL('/api/agents/challenge', localOrigin), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
    });
    console.log(`PASS candidate valid-token protected handler reached: HTTP ${positive.status}`);
    if (positive.status === 401 || positive.status === 403) throw new Error('candidate valid token was rejected');

    await jsonCheck(localOrigin, '/api/definitely-not-a-route', {}, [404], 'candidate unknown API route returns JSON 404');
    await verifyNoSecret(localOrigin, ['/', '/api/health', '/api/integrity', '/api/db-info', '/api/watchlist', '/api/providers', '/api/snapshots?limit=5']);
    console.log('PASS candidate secret absent from checked UI/API responses');
    await verifySimpleUi(localOrigin);

    console.log(JSON.stringify({
      checkedAt: new Date().toISOString(),
      publicOrigin: publicOrigin.origin,
      candidateOrigin: localOrigin.origin,
      result: 'PASS',
      refresh: {
        snapshotId: refresh.snapshotId ?? null,
        observationCount: refresh.observationCount ?? null,
        evidenceClaimCount: refresh.evidenceClaimCount ?? null,
        live: refresh.live ?? null,
        attentionStatus,
      },
      expandedKrakenEvidence: { eth: ethHasCurrentMarket, comp: compHasCurrentMarket },
    }));
  } catch (error) {
    console.error('CANDIDATE SERVER STDOUT (tail):', stdout);
    console.error('CANDIDATE SERVER STDERR (tail):', stderr);
    throw error;
  } finally {
    child.kill('SIGTERM');
    await new Promise((resolve) => {
      if (child.exitCode !== null) return resolve();
      const timer = setTimeout(() => { child.kill('SIGKILL'); resolve(); }, 4000);
      child.once('exit', () => { clearTimeout(timer); resolve(); });
    });
    for (const suffix of ['', '-shm', '-wal']) {
      try { await unlink(localDb + suffix); } catch {}
    }
  }
}

await verifyPublicBaseline();
await verifyCandidate();
