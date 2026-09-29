import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { canonicalSha256, writeContentAddressed } from './canonical.js';
import { normalizeToolsList } from './capability-manifest.js';
function nowIso() { return new Date().toISOString(); }
function unpack(result) {
    if (result == null)
        return result;
    if (result.structuredContent !== undefined)
        return result.structuredContent;
    const content = result.content;
    if (Array.isArray(content)) {
        for (const part of content) {
            if (part && typeof part === 'object' && typeof part.text === 'string') {
                try {
                    return JSON.parse(part.text);
                }
                catch { /* preserve outer object below */ }
            }
        }
    }
    if (typeof result.text === 'string') {
        try {
            return JSON.parse(result.text);
        }
        catch {
            return result;
        }
    }
    return result;
}
function extractItems(payload, keys) {
    for (const key of keys)
        if (Array.isArray(payload?.[key]))
            return payload[key];
    if (Array.isArray(payload))
        return payload;
    return [];
}
function hasNext(payload) {
    return Boolean(payload?.hasNext ?? payload?.has_next ?? payload?.hasMore ?? payload?.has_more);
}
function nextPagination(payload) {
    const candidates = [
        ['page_token', payload?.next_page_token],
        ['pageToken', payload?.nextPageToken],
        ['cursor', payload?.next_cursor],
        ['cursor', payload?.nextCursor],
    ];
    for (const [arg, value] of candidates)
        if (typeof value === 'string' && value)
            return { arg, value };
    return undefined;
}
async function loadState(path) {
    try {
        return JSON.parse(await readFile(path, 'utf8'));
    }
    catch (err) {
        if (err?.code === 'ENOENT')
            return { completed: {} };
        throw err;
    }
}
async function saveState(path, state) {
    await writeFile(path, JSON.stringify(state, null, 2));
}
export class FreezeRecorder {
    bundleDir;
    storeDir;
    recordsPath;
    statePath;
    state;
    records = [];
    constructor(bundleDir) {
        this.bundleDir = bundleDir;
        this.storeDir = join(bundleDir, 'store');
        this.recordsPath = join(bundleDir, 'records.jsonl');
        this.statePath = join(bundleDir, 'freeze_state.json');
    }
    async init() {
        await mkdir(this.bundleDir, { recursive: true });
        await mkdir(this.storeDir, { recursive: true });
        this.state = await loadState(this.statePath);
        try {
            const lines = (await readFile(this.recordsPath, 'utf8')).trim().split(/\r?\n/).filter(Boolean);
            this.records = lines.map((line) => JSON.parse(line));
        }
        catch (err) {
            if (err?.code !== 'ENOENT')
                throw err;
        }
    }
    has(key) { return Boolean(this.state.completed[key]); }
    prior(key) { return this.state.completed[key]; }
    async capture(key, tool, args, response, pageIndex) {
        const decodedBytes = Buffer.from(JSON.stringify(response), 'utf8');
        const stored = await writeContentAddressed(this.storeDir, decodedBytes, 'json');
        const record = {
            key, tool,
            argsCanonicalSha256: canonicalSha256(args),
            responseSha256: stored.sha256,
            responsePath: relative(this.bundleDir, stored.path),
            capturedAt: nowIso(),
            captureMethod: 'sdk_decoded_json',
            pageIndex,
        };
        this.state.completed[key] = record;
        this.records.push(record);
        await writeFile(this.recordsPath, `${this.records.map((r) => JSON.stringify(r)).join('\n')}\n`);
        await saveState(this.statePath, this.state);
        return record;
    }
}
async function callCaptured(caller, recorder, key, tool, args, pageIndex) {
    if (recorder.has(key)) {
        const prior = recorder.prior(key);
        const bytes = await readFile(join(recorder.bundleDir, prior.responsePath), 'utf8');
        return JSON.parse(bytes);
    }
    const response = await caller.callTool(tool, args);
    await recorder.capture(key, tool, args, response, pageIndex);
    return response;
}
export async function listAllPaged(caller, recorder, tool, itemKeys, baseArgs = {}, pageSize = 50) {
    const items = [];
    let skip = 0;
    let continuation;
    let page = 0;
    for (;;) {
        const args = { ...baseArgs };
        if (continuation)
            args[continuation.arg] = continuation.value;
        else {
            args.skip = skip;
            args.limit = pageSize;
        }
        const key = `${tool}:page:${page}:${canonicalSha256(args)}`;
        const outer = await callCaptured(caller, recorder, key, tool, args, page);
        const payload = unpack(outer);
        const got = extractItems(payload, itemKeys);
        items.push(...got);
        page += 1;
        const nc = nextPagination(payload);
        if (nc) {
            continuation = nc;
            continue;
        }
        if (hasNext(payload)) {
            skip += pageSize;
            continue;
        }
        if (!hasNext(payload) && got.length >= pageSize && Number(payload?.total) > items.length) {
            skip += pageSize;
            continue;
        }
        break;
    }
    return { items, pages: page };
}
function toolNames(toolsPayload) {
    const payload = unpack(toolsPayload);
    return extractItems(payload, ['tools']).map((t) => t?.name).filter((x) => typeof x === 'string');
}
function findId(x) {
    for (const key of ['id', 'report_id', 'reportId', 'strategy_id', 'strategyId', 'symbol_id', 'symbolId']) {
        if (typeof x?.[key] === 'string')
            return x[key];
    }
    return undefined;
}
function extractDatasetRefs(value) {
    const out = new Set();
    const visit = (node) => {
        if (Array.isArray(node)) {
            for (const x of node)
                visit(x);
            return;
        }
        if (!node || typeof node !== 'object')
            return;
        for (const [key, v] of Object.entries(node)) {
            if (['data_id', 'dataId', 'symbol_id', 'symbolId'].includes(key) && typeof v === 'string')
                out.add(v);
            else if (['data_ids', 'dataIds', 'symbol_ids', 'symbolIds'].includes(key) && Array.isArray(v)) {
                for (const x of v)
                    if (typeof x === 'string')
                        out.add(x);
            }
            visit(v);
        }
    };
    visit(value);
    return [...out].sort();
}
export async function freezeLona(caller, options) {
    const provider = options.provider ?? 'LONA';
    const surface = options.surface ?? 'DIRECT_MCP';
    const pageSize = options.pageSize ?? 50;
    const recorder = new FreezeRecorder(options.bundleDir);
    await recorder.init();
    const warnings = [];
    const pagesFetched = {};
    const toolsRaw = await caller.listTools();
    if (!recorder.has('mcp:tools/list'))
        await recorder.capture('mcp:tools/list', 'tools/list', {}, toolsRaw);
    const toolsPayload = unpack(toolsRaw);
    const tools = extractItems(toolsPayload, ['tools']);
    const normalized = normalizeToolsList(tools.map((t) => ({ name: String(t.name), inputSchema: t.inputSchema ?? t.input_schema ?? {} })));
    const names = new Set(toolNames(toolsRaw));
    const strategyListTool = names.has('lona_list_strategies') ? 'lona_list_strategies' : undefined;
    const reportListTool = names.has('lona_list_reports') ? 'lona_list_reports' : undefined;
    const symbolListTool = names.has('lona_list_symbols') ? 'lona_list_symbols' : undefined;
    if (!strategyListTool)
        warnings.push('lona_list_strategies unavailable');
    if (!reportListTool)
        warnings.push('lona_list_reports unavailable');
    if (!symbolListTool)
        warnings.push('lona_list_symbols unavailable');
    let strategies = [];
    if (strategyListTool) {
        const r = await listAllPaged(caller, recorder, strategyListTool, ['strategies', 'items', 'results'], {}, pageSize);
        strategies = r.items;
        pagesFetched[strategyListTool] = r.pages;
        for (const s of strategies) {
            const id = findId(s);
            if (!id)
                continue;
            if (names.has('lona_get_strategy'))
                await callCaptured(caller, recorder, `strategy:${id}:metadata`, 'lona_get_strategy', { id });
            if (names.has('lona_get_strategy_code'))
                await callCaptured(caller, recorder, `strategy:${id}:code`, 'lona_get_strategy_code', { id });
            else
                warnings.push(`strategy ${id}: source code tool unavailable; manual/gateway capture required before editing version`);
        }
    }
    let symbols = [];
    if (symbolListTool) {
        for (const isGlobal of [false, true]) {
            const label = isGlobal ? 'global' : 'uploaded';
            const r = await listAllPaged(caller, recorder, symbolListTool, ['symbols', 'items', 'results'], { is_global: isGlobal }, pageSize);
            symbols.push(...r.items.map((x) => ({ ...x, __scope: label })));
            pagesFetched[`${symbolListTool}:${label}`] = r.pages;
            for (const sym of r.items) {
                const id = findId(sym);
                if (!id)
                    continue;
                if (names.has('lona_get_symbol'))
                    await callCaptured(caller, recorder, `symbol:${id}:metadata`, 'lona_get_symbol', { id });
                if (names.has('lona_get_symbol_data') && (!isGlobal || options.captureGlobalSymbolData === true)) {
                    // This is a provider observation, not proof of the original uploaded bytes.
                    await callCaptured(caller, recorder, `symbol:${id}:data-current-vintage`, 'lona_get_symbol_data', { id });
                }
            }
        }
    }
    if (symbolListTool && options.captureGlobalSymbolData !== true)
        warnings.push('global symbol data bytes not fetched by default; metadata catalog only (set captureGlobalSymbolData=true for current-vintage snapshots)');
    let reports = [];
    const reportTiers = [];
    if (reportListTool) {
        const r = await listAllPaged(caller, recorder, reportListTool, ['reports', 'items', 'results'], {}, pageSize);
        reports = r.items;
        pagesFetched[reportListTool] = r.pages;
        for (const report of reports) {
            const id = findId(report);
            if (!id)
                continue;
            let full = false;
            let fullResponse = undefined;
            if (names.has('lona_get_report'))
                await callCaptured(caller, recorder, `report:${id}:summary`, 'lona_get_report', { id });
            if (names.has('lona_get_full_report')) {
                fullResponse = await callCaptured(caller, recorder, `report:${id}:full`, 'lona_get_full_report', { id });
                full = true;
            }
            if (names.has('lona_get_report_chart'))
                await callCaptured(caller, recorder, `report:${id}:chart`, 'lona_get_report_chart', { id });
            if (names.has('lona_list_report_trades')) {
                const tr = await listAllPaged(caller, recorder, 'lona_list_report_trades', ['trades', 'items', 'results'], { id }, pageSize);
                pagesFetched[`lona_list_report_trades:${id}`] = tr.pages;
            }
            const strategyId = typeof report?.strategyId === 'string' ? report.strategyId : typeof report?.strategy_id === 'string' ? report.strategy_id : undefined;
            const sourceCaptured = Boolean(strategyId && recorder.has(`strategy:${strategyId}:code`));
            const datasetRefs = extractDatasetRefs(unpack(fullResponse));
            const r1InputsPinned = datasetRefs.length > 0 && datasetRefs.every((ref) => Boolean(options.originalInputs?.[ref]?.sha256));
            // R1 is awarded only when exact original user-owned dataset bytes are explicitly pinned.
            const tier = sourceCaptured && full && r1InputsPinned
                ? 'R1_BYTE_REPRODUCIBLE'
                : sourceCaptured && full
                    ? 'R2_CONFIG_REPRODUCIBLE_INPUTS_UNPINNED'
                    : 'R3_CONTEXTUAL_ONLY';
            const reason = tier === 'R1_BYTE_REPRODUCIBLE'
                ? 'strategy/config/full report captured and every referenced input id is bound to exact original bytes'
                : tier === 'R2_CONFIG_REPRODUCIBLE_INPUTS_UNPINNED'
                    ? 'strategy/config captured; one or more historical market-data input vintages are not byte-pinned'
                    : 'missing full source and/or full report provenance';
            reportTiers.push({ reportId: id, strategyId, tier, sourceCaptured, fullReportCaptured: full, reason, datasetRefs, r1InputsPinned });
        }
    }
    const manifestCore = {
        format: 'zobiris-lona-freeze-v1', provider, surface,
        endpoint: options.endpoint ?? null,
        accountFingerprint: options.accountFingerprint ?? null,
        capturedBy: options.capturedBy ?? 'zobiris-p0-freezer',
        captureSemantics: 'provider responses are SDK-decoded JSON, not raw HTTP wire bytes',
        capabilityManifestHash: normalized.hash,
        toolCount: normalized.tools.length,
        originalInputs: options.originalInputs ?? {},
        records: recorder.records.map((r) => ({ key: r.key, tool: r.tool, argsCanonicalSha256: r.argsCanonicalSha256, responseSha256: r.responseSha256, responsePath: r.responsePath, captureMethod: r.captureMethod, pageIndex: r.pageIndex ?? null })),
    };
    const bundleHash = canonicalSha256(manifestCore);
    const bundleId = `lona-freeze-${bundleHash.slice(0, 16)}`;
    const manifest = { ...manifestCore, bundleId, bundleHash, createdAt: nowIso(), pagesFetched, warnings, reportTiers };
    await writeFile(join(options.bundleDir, 'MANIFEST.json'), JSON.stringify(manifest, null, 2));
    await writeFile(join(options.bundleDir, 'BUNDLE.sha256'), `${bundleHash}  MANIFEST-CONTENT\n`);
    await writeFile(join(options.bundleDir, 'WITNESS.txt'), `Bundle: ${bundleId}\nHash: ${bundleHash}\n\nAnchor this hash outside the SQLite database (for example a signed git tag or other append-only audit witness).\n`);
    return { bundleId, bundleHash, capabilityManifestHash: normalized.hash, toolCount: normalized.tools.length, pagesFetched, strategies: strategies.length, reports: reports.length, symbols: symbols.length, reportTiers, warnings };
}
