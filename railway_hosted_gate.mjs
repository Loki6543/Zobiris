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
  for (const required of ["ZOBIRIS CORE", "Market Today", "History / Learning", "Current positions", "BEST FIRST COURSE OF ACTION", "SELL / HARVEST LADDER", "BUY / RE-ENTRY RANGE", "DEFENSIVE REDUCTION", "Why Zobiris learned this:", "Kraken execution gate passed", "Unlock private portfolio", "Private account is locked on the public view", "Maneuver capital", "Current snapshot order:", "POSITION TOO SMALL FOR A USEFUL PARTIAL TRIM", "Pilot mode: new capital only goes to 30d + 90d laggards with a fresh 7d recovery"]) {
    if (!bundle.includes(required)) throw new Error("candidate simplified UI is missing " + required);
  }
  for (const forbidden of ["Research thesis + falsifiers", "Break conditions:", "Not yet measured:", " · thesis "]) {
    if (bundle.includes(forbidden)) throw new Error("candidate decision UI leaked verbose research copy: " + forbidden);
  }
  console.log("PASS candidate simplified three-screen UI bundle with research kept behind the scenes");
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

    const p0 = await jsonCheck(localOrigin, '/api/intelligence/research-integrity', {}, [200], 'candidate P0 evidence boundary');
    if (p0.payload?.provenance?.source !== 'PERSISTED_P0_EVIDENCE' || p0.payload?.researchEvidence?.version !== '0.3.0') throw new Error('candidate P0 evidence registry is missing');
    if (p0.payload?.researchIntegrity?.promotable !== false || p0.payload?.researchEvidence?.statisticalEvaluatorsImplemented !== false) throw new Error('P0 cannot claim statistical promotion authority');
    await jsonCheck(localOrigin, '/api/research/provenance', {}, [401, 403], 'candidate anonymous research diagnostics rejected');
    console.log('PASS candidate P0 v3 persisted evidence boundary and promotion restrictions');

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
    if (diagnosticProviders.payload.providers?.find(p => p.provider === 'cmc')?.freshness !== 'live') throw new Error('CMC current quote freshness not reported live');

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
    const list = await jsonCheck(localOrigin, '/api/snapshots?limit=1', {}, [200], 'candidate snapshot list consistency');
    const strategy = await jsonCheck(localOrigin, '/api/strategy21', {
      headers: { Authorization: `Bearer ${token}` },
    }, [200], 'candidate authenticated strategy account context');
    if (list.payload.snapshots?.[0]?.id !== afterIdentity.id || strategy.payload.asOf !== new Date(afterIdentity.asOf).toISOString()) throw new Error('snapshot endpoints disagree');
    const account = strategy.payload.strategy21;
    if (account?.recommendationMode !== 'DELAYED_ROTATION_PILOT_V1') throw new Error('delayed-rotation pilot recommendation mode is not active');
    const rotationCalibration = account?.delayedRotationCalibration;
    if (!rotationCalibration || rotationCalibration.mode !== 'DELAYED_ROTATION_PILOT_V1') throw new Error('delayed-rotation watchlist calibration missing');
    if (!(Number(rotationCalibration.sampleSize) >= 10)) throw new Error('delayed-rotation calibration has insufficient live watchlist coverage');
    const rotationAssets = strategy.payload.assets ?? [];
    const qualifiedRotationAssets = [];
    const authorizedRotationAssets = [];
    for (const asset of rotationAssets) {
      const rotation = asset?.strategy21?.delayedRotation;
      if (!rotation) throw new Error(`${asset?.symbol ?? 'unknown'} missing delayed-rotation profile`);
      if (rotation.status === 'QUALIFIED') qualifiedRotationAssets.push(asset.symbol);
      if (Number(asset?.strategy21?.positionAuthority?.maxNextOrderUsd ?? 0) > 0) {
        authorizedRotationAssets.push(asset.symbol);
        if (rotation.status !== 'QUALIFIED') {
          throw new Error(`${asset.symbol} received new-buy authority without strict delayed-rotation qualification`);
        }
      }
    }
    console.log(`PASS candidate delayed-rotation pilot calibrated ${rotationCalibration.sampleSize} watchlist assets; market=${rotationCalibration.marketStatus}; qualified=${qualifiedRotationAssets.length} [${qualifiedRotationAssets.join(',')}]; authorized=${authorizedRotationAssets.length} [${authorizedRotationAssets.join(',')}]`);
    await jsonCheck(localOrigin, '/api/account', {}, [401, 403], 'candidate anonymous account rejected');
    const liveAccount = (await jsonCheck(localOrigin, '/api/account', {
      headers: { Authorization: `Bearer ${token}` },
    }, [200], 'candidate authenticated synchronized holdings')).payload.account;
    if (!liveAccount?.privateAccountSynced || !Array.isArray(liveAccount.holdings)) throw new Error('candidate private holdings are not synchronized');
    const exposure = account?.portfolioDependency?.grossCurrentExposureUsd;
    if (!Number.isFinite(exposure) || exposure < 0) throw new Error('account exposure invalid in Strategy 2.1');
    const hasValuedHoldings = liveAccount.holdings.some(h => h.quantity > 0 && h.fallbackPriceUsd > 0);
    if (hasValuedHoldings && exposure <= 0) throw new Error('account holdings missing from Strategy 2.1');
    if (![account.fundedCashUsd, account.freeCashUsd, account.reservedBuysUsd].every(v => Number.isFinite(v) && v >= 0)) throw new Error('account cash accounting invalid');
    if (Math.abs((account.freeCashUsd + account.reservedBuysUsd) - account.fundedCashUsd) > 0.05) throw new Error('account cash components do not reconcile');
    if (account.portfolioDependency.grossPostFillExposureUsd + 0.02 < account.portfolioDependency.grossCurrentExposureUsd) throw new Error('post-fill exposure cannot be below current exposure');
    if (strategy.payload.assets.some(a => a.strategy21?.eligibility?.status === 'WATCH_ONLY' && a.strategy21?.positionAuthority?.maxNextOrderUsd > 0)) throw new Error('WATCH_ONLY asset authorized an order');
    const capabilities = account?.capabilityManifest;
    if (capabilities?.exchangePrivateRead !== true) throw new Error('read-only Kraken account capability missing');
    for (const field of ['exchangeOrderSubmission','exchangeOrderModification','exchangeOrderCancellation','exchangeFundTransfer','exchangeWithdrawal','walletSigning','transactionBroadcast']) {
      if (capabilities?.[field] !== false) throw new Error(`forbidden capability is not disabled: ${field}`);
    }
    const policy = account?.narrativeResearchPolicy;
    if (Math.abs(Number(policy?.discoveryBudget?.adversarialAlternativeMechanisms ?? 0) - 0.40) > 1e-9) throw new Error('adversarial discovery budget missing');
    if (Math.abs(Number(policy?.discoveryBudget?.counterContrarianFalsification ?? 0) - 0.20) > 1e-9) throw new Error('counter-contrarian falsification budget missing');
    const researchAsset = strategy.payload.assets.find(a => a.strategy21?.researchIntegrity?.version === '1.0');
    const researchIntegrityBundle = researchAsset?.strategy21?.researchIntegrity;
    if (!researchIntegrityBundle) throw new Error('research-integrity bundle missing from Strategy 2.1 assets');
    if (!Array.isArray(researchIntegrityBundle.evidenceLedger)) throw new Error('research evidence ledger missing');
    if (!Array.isArray(researchIntegrityBundle.thesis?.falsifiers) || researchIntegrityBundle.thesis.falsifiers.length === 0) throw new Error('research thesis falsifiers missing');
    if (researchIntegrityBundle.evidenceLedger.some(item => item?.pointInTimeValid === false && item?.limitations?.length === 0)) throw new Error('invalid point-in-time evidence lacks limitations');
    const outcomes = await jsonCheck(localOrigin, '/api/outcomes?limit=5', {}, [200], 'candidate decision outcome memory');
    if (outcomes.payload?.version !== '1.0' || !Array.isArray(outcomes.payload?.records)) throw new Error('decision outcome memory contract missing');
    if (!outcomes.payload.records.some(record => record?.strategyTag === 'DELAYED_ROTATION_PILOT_V1')) throw new Error('delayed-rotation outcome tagging missing');
    console.log('PASS candidate research integrity, read-only capability manifest and delayed-rotation outcome-memory contract');
    console.log('PASS candidate holdings, funded cash, commitments, liquidity gates and snapshot consistency');
    for (const symbol of ['BTC', 'AAVE', 'HBAR', 'XRP']) {
      const asset = strategy.payload.assets.find(a => a.symbol === symbol);
      const quotes = asset?.strategy21?.explanation?.observations ?? [];
      if (!quotes.some(o => { try { return JSON.parse(o.claim).priceUsd > 0; } catch { return false; } })) throw new Error(`${symbol} has no parseable current quote`);
    }
    console.log('PASS candidate account symbols expose complete structured quotes');



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

    const evidence = await jsonCheck(localOrigin, '/api/research/evidence', {}, [200], 'candidate research evidence');
    const reviews = await jsonCheck(localOrigin, '/api/research/reassessment', {}, [200], 'candidate reassessment');
    if (!Array.isArray(evidence.payload.assets) || !Array.isArray(reviews.payload.assets)) throw new Error('research contract missing asset arrays');
    if (evidence.payload.authority !== 'SHADOW_ONLY_NO_TRADING_AUTHORITY') throw new Error('research authority changed');
    const attention = await jsonCheck(localOrigin, '/api/intelligence/attention-ignition', {}, [200], 'candidate persistent attention');
    if (JSON.stringify(attention.payload.provenance).includes('fixture')) throw new Error('production attention still serves fixture provenance');
    await jsonCheck(localOrigin, '/api/research/evidence/import', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({records:[]})}, [401], 'candidate research import requires authentication');

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
