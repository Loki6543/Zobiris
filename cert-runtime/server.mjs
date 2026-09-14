import http from 'node:http';

const PORT = Number(process.env.PORT || 3000);
const INTERVAL_MS = 30 * 60 * 1000;
const TIMEOUT_MS = 20_000;

const endpoints = {
  messageExecutionRate: 'https://metrics-api.internetcomputer.org/api/v1/message-execution-rate',
  canisters: 'https://ic-api.internetcomputer.org/api/v4/canisters/count',
  icpTransactionsPerDay: 'https://ledger-api.internetcomputer.org/metrics/transactions-per-day',
  icrcLedgers: 'https://icrc-api.internetcomputer.org/api/v2/ledgers/count',
  ckBtcTransactionVolume: 'https://icrc-api.internetcomputer.org/api/v1/ledgers/mxzaz-hqaaa-aaaar-qaada-cai/transaction-volume',
  snses: 'https://sns-api.internetcomputer.org/api/v2/snses/count',
};

let latest = {
  status: 'STARTING',
  checkedAt: null,
  authority: 'SHADOW_ONLY_NO_TRADING_AUTHORITY',
  results: {},
};

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
      headers: { accept: 'application/json', 'user-agent': 'Zobiris-v0.7.5-ICP-Cert/1.0' },
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
    authority: 'SHADOW_ONLY_NO_TRADING_AUTHORITY',
    results,
  };
  console.log(`ICP_CERT_REPORT ${JSON.stringify(latest)}`);
}

const server = http.createServer((req, res) => {
  res.setHeader('content-type', 'application/json; charset=utf-8');
  if (req.url === '/health') {
    res.statusCode = latest.status === 'FAIL' ? 503 : 200;
    res.end(JSON.stringify({ ok: latest.status !== 'FAIL', status: latest.status, checkedAt: latest.checkedAt }));
    return;
  }
  if (req.url === '/report') {
    res.statusCode = 200;
    res.end(JSON.stringify(latest));
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
