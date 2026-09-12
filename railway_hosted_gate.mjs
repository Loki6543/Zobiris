#!/usr/bin/env node
import { randomUUID } from 'node:crypto';

const base = process.argv[2] ?? 'https://zobiris-production.up.railway.app';
const origin = new URL(base.endsWith('/') ? base : `${base}/`);
const token = process.env.ZOBIRIS_REFRESH_TOKEN;
if (!token) throw new Error('ZOBIRIS_REFRESH_TOKEN is missing');
if (!['http:', 'https:'].includes(origin.protocol)) throw new Error('invalid origin');

async function jsonCheck(path, options, expected, label) {
  const response = await fetch(new URL(path, origin), {
    ...options,
    redirect: 'manual',
    signal: AbortSignal.timeout(15000),
  });
  const contentType = response.headers.get('content-type') ?? '';
  let payload = null;
  try { payload = await response.json(); } catch {}
  const pass = expected.includes(response.status) && contentType.includes('application/json') && payload !== null;
  console.log(`${pass ? 'PASS' : 'FAIL'} ${label}: HTTP ${response.status}`);
  if (!pass) throw new Error(`${label} failed`);
  return { response, payload };
}

await jsonCheck('/api/health', {}, [200], 'health JSON');
for (const path of ['/api/refresh', '/api/strategy21/collect', '/api/agents/challenge']) {
  await jsonCheck(path, { method: 'POST' }, [401, 403], `anonymous ${path}`);
  await jsonCheck(path, {
    method: 'POST',
    headers: { Authorization: `Bearer invalid-${randomUUID()}` },
  }, [401, 403], `wrong-token ${path}`);
}

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

const readPaths = ['/', '/api/health', '/api/db-info', '/api/watchlist', '/api/providers', '/api/snapshots?limit=5'];
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
console.log(JSON.stringify({ checkedAt: new Date().toISOString(), origin: origin.origin, result: 'PASS' }));
