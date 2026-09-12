#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import Database from 'better-sqlite3';

const port = Number(process.env.PORT ?? '3000');
const localOrigin = `http://127.0.0.1:${port}`;
const mode = process.env.ZOBIRIS_PERSISTENCE_MODE ?? 'none';
const token = process.env.ZOBIRIS_REFRESH_TOKEN;
const expectedId = process.env.ZOBIRIS_PERSISTENCE_EXPECTED_ID ?? '';
const dbPath = process.env.ZOBIRIS_DB_PATH ?? '/data/zobiris.sqlite';

const child = spawn(process.execPath, ['--import', 'tsx', 'src/server/server.ts'], {
  cwd: process.cwd(),
  env: process.env,
  stdio: ['ignore', 'pipe', 'pipe'],
});
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

let exiting = false;
function stop(signal = 'SIGTERM') {
  if (exiting) return;
  exiting = true;
  try { child.kill(signal); } catch {}
}
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => stop(sig));
}

async function waitForHealth() {
  const deadline = Date.now() + 30000;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${localOrigin}/api/health`, { signal: AbortSignal.timeout(2000) });
      if (r.status === 200) return;
      lastError = new Error(`health HTTP ${r.status}`);
    } catch (e) {
      lastError = e;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw lastError ?? new Error('health timeout');
}

async function confirmVolumeWal() {
  const db = new Database(dbPath);
  try {
    db.pragma('journal_mode = WAL');
    db.prepare('SELECT 1').get();
    const names = await readdir('/data');
    const base = dbPath.split('/').pop();
    const required = [base, `${base}-wal`, `${base}-shm`];
    const missing = required.filter((name) => !names.includes(name));
    console.log(`VOLUME_FILES ${names.filter((n) => n.startsWith(base)).sort().join(',')}`);
    if (missing.length) throw new Error(`missing SQLite volume files: ${missing.join(',')}`);
    console.log('PASS SQLite DB/WAL/SHM are on /data');
  } finally {
    db.close();
  }
}

async function seed() {
  if (!token) throw new Error('missing ZOBIRIS_REFRESH_TOKEN');
  const before = await fetch(`${localOrigin}/api/snapshots?limit=100`).then((r) => r.json());
  const beforeCount = Array.isArray(before.snapshots) ? before.snapshots.length : 0;
  const response = await fetch(`${localOrigin}/api/refresh`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(120000),
  });
  const payload = await response.json().catch(() => null);
  if (response.status !== 200 || !payload?.snapshotId) {
    throw new Error(`authorized fixture refresh failed: HTTP ${response.status}`);
  }
  const snapshotId = String(payload.snapshotId);
  const verify = await fetch(`${localOrigin}/api/snapshot/${encodeURIComponent(snapshotId)}`);
  if (verify.status !== 200) throw new Error(`new snapshot unreadable: HTTP ${verify.status}`);
  console.log(`PERSISTENCE_BEFORE_COUNT=${beforeCount}`);
  console.log(`PERSISTENCE_SEED_ID=${snapshotId}`);
  console.log('PASS staging-only fixture refresh created persistence record');
  await confirmVolumeWal();
}

async function verifyPersistence() {
  if (!expectedId) throw new Error('missing ZOBIRIS_PERSISTENCE_EXPECTED_ID');
  const response = await fetch(`${localOrigin}/api/snapshot/${encodeURIComponent(expectedId)}`, {
    signal: AbortSignal.timeout(15000),
  });
  const payload = await response.json().catch(() => null);
  if (response.status !== 200 || String(payload?.snapshot?.id ?? '') !== expectedId) {
    throw new Error(`persisted snapshot did not survive restart: HTTP ${response.status}`);
  }
  console.log(`PERSISTENCE_VERIFIED_ID=${expectedId}`);
  console.log('PASS exact staging snapshot survived Railway restart');
  await confirmVolumeWal();
}

(async () => {
  try {
    await waitForHealth();
    if (mode === 'seed') await seed();
    else if (mode === 'verify') await verifyPersistence();
    else console.log('Persistence wrapper running with no verification mode');
  } catch (e) {
    console.error(`PERSISTENCE_GATE_FAIL ${e instanceof Error ? e.message : String(e)}`);
    stop('SIGTERM');
    setTimeout(() => process.exit(1), 250).unref();
    return;
  }
})();

const code = await new Promise((resolve) => child.on('exit', (c) => resolve(c ?? 0)));
process.exit(code);
