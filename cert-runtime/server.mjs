import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.PORT || 3000);
const INTERVAL_MS = 30 * 60 * 1000;
const TIMEOUT_MS = 20_000;
const DATA_DIR = process.env.ZOBIRIS_CERT_DATA_DIR || '/data';
const SNAPSHOT_PATH = path.join(DATA_DIR, 'icp-cert-latest.json');
const AUTHORITY = 'SHADOW_ONLY_NO_TRADING_AUTHORITY';

const endpoints = {
  messageExecutionRate: 'https://metrics-api.internetcomputer.org/api/v1/message-execution-rate',
  canisters: 'https://ic-api.internetcomputer.org/api/v4/canisters/count',
  icpTransactionsPerDay: 'https://ledger-api.internetcomputer.org/metrics/transactions-per-day',
  icrcLedgers: 'https://icrc-api.internetcomputer.org/api/v2/ledgers/count',
  ckBtcTransactionVolume: 'https://icrc-api.internetcomputer.org/api/v1/ledgers/mxzaz-hqaaa-aaaar-qaada-cai/transaction-volume',
  snses: 'https://sns-api.internetcomputer.org/api/v2/snses/count',
};

let persistedAtBoot = null;
let persistence = { enabled: false, path: SNAPSHOT_PATH, lastWriteOk: false, error: null };
let latest = {
  status: 'STARTING',
  checkedAt: null,
  authority: AUTHORITY,
  results: {},
};

function loadPersistedSnapshot() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    persistence.enabled = true;
    if (!fs.existsSync(SNAPSHOT_PATH)) return;
    const parsed = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
    if (parsed && typeof parsed === 'object') {
      persistedAtBoot = parsed;
      latest = parsed;
      console.log(`ICP_CERT_PERSISTENCE_RESTORED ${JSON.stringify({ checkedAt: parsed.checkedAt, path: SNAPSHOT_PATH })}`);
    }
  } catch (error) {
    persistence = { enabled: false, path: SNAPSHOT_PATH, lastWriteOk: false, error: String(error) };
    console.error(`ICP_CERT_PERSISTENCE_LOAD_ERROR ${String(error)}`);
  }
}

function persistSnapshot(snapshot) {
  if (!persistence.enabled) return;
  try {
    const tempPath = `${SNAPSHOT_PATH}.tmp`;
    fs.writeFileSync(tempPath, `${JSON.stringify(snapshot)}\n`, 'utf8');
    fs.renameSync(tempPath, SNAPSHOT_PATH);
    persistence = { enabled: true, path: SNAPSHOT_PATH, lastWriteOk: true, error: null };
    console.log(`ICP_CERT_PERSISTED ${JSON.stringify({ checkedAt: snapshot.checkedAt, path: SNAPSHOT_PATH })}`);
  } catch (error) {
    persistence = { enabled: true, path: SNAPSHOT_PATH, lastWriteOk: false, error: String(error) };
    console.error(`ICP_CERT_PERSISTENCE_WRITE_ERROR ${String(error)}`);
  }
}

function summarize(name, json) {
  if (!json || typeof json !== 'object') return { shape: typeof json };
  if (name === 'messageExecutionRate') {
    const rows = json.message_execution_rate;
    const last = Array.isArray(rows) && rows.length ? rows.at(-1) : null;
    return {
      shape: 'message_execution_rate',
      timestamp: Array.isArray(last) ? last[0] : null,
      value: Array.isArray(last) ? Number(last[1]) : null,
    };
  }
  if (name === 'canisters' || name === 'icrcLedgers' || name === 'snses') {
    return { shape: 'count', total: Number(json.total) };
  }
  if (name === 'ckBtcTransactionVolume') {
    const row = Array.isArray(json.data) && json.data.length ? json.data.at(-1) : null;
    return {
      shape: 'transaction_volume',
      date: row?.date ?? null,
      count: row ? Number(row.count) : null,
      volume: row ? Number(row.volume) : null,
      countOverTime: row ? Number(row.count_over_time) : null,
      totalTransactionsAllTime: json.meta ? Number(json.meta.total_transactions_for_all_time) : null,
      totalVolumeAllTime: json.meta ? Number(json.meta.total_volume_for_all_time) : null,
    };
  }
  if (name === 'icpTransactionsPerDay') {
    const rows = json.daily_transactions;
    const last = Array.isArray(rows) && rows.length ? rows.at(-1) : null;
    return {
      shape: 'transactions_per_day',
      date: last?.date ?? null,
      count: last ? Number(last.count) : null,
      volume: last ? Number(last.volume) : null,
      totalTransactionsAllTime: Number(json.total_transactions_for_all_time),
      totalVolumeAllTime: Number(json.total_volume_for_all_time),
    };
  }
  return { shape: Object.keys(json).slice(0, 12) };
}

async function probe(name, url) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { accept: 'application/json', 'user-agent': 'Zobiris-v0.7.5-ICP-Cert/1.1' },
      signal: controller.signal,
    });
    const text = await response.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return {
      ok: response.ok && json !== null,
      httpStatus: response.status,
      latencyMs: Date.now() - started,
      bytes: Buffer.byteLength(text),
      data: summarize(name, json),
    };
  } catch (error) {
    return { ok: false, error: String(error), latencyMs: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
}

async function runCertification() {
  const pairs = await Promise.all(
    Object.entries(endpoints).map(async ([name, url]) => [name, await probe(name, url)]),
  );
  const results = Object.fromEntries(pairs);
  latest = {
    status: Object.values(results).every((r) => r.ok) ? 'PASS' : 'FAIL',
    checkedAt: new Date().toISOString(),
    authority: AUTHORITY,
    results,
  };
  if (latest.status === 'PASS') persistSnapshot(latest);
  console.log(`ICP_CERT_REPORT ${JSON.stringify(latest)}`);
}

loadPersistedSnapshot();

const server = http.createServer((req, res) => {
  res.setHeader('content-type', 'application/json; charset=utf-8');
  if (req.url === '/health') {
    res.statusCode = latest.status === 'FAIL' ? 503 : 200;
    res.end(JSON.stringify({ ok: latest.status !== 'FAIL', status: latest.status, checkedAt: latest.checkedAt, persistence }));
    return;
  }
  if (req.url === '/report') {
    res.statusCode = 200;
    res.end(JSON.stringify(latest));
    return;
  }
  if (req.url === '/snapshot') {
    res.statusCode = persistedAtBoot || persistence.lastWriteOk ? 200 : 404;
    res.end(JSON.stringify({ restoredAtBoot: persistedAtBoot?.checkedAt ?? null, persistence, latestPersisted: persistence.lastWriteOk ? latest : persistedAtBoot }));
    return;
  }
  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'not_found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`ICP_CERT_LISTEN ${PORT}`);
  void runCertification();
});

setInterval(() => void runCertification(), INTERVAL_MS).unref();
