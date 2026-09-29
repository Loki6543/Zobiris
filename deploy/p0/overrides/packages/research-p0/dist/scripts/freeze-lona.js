import { basename, join, resolve } from 'node:path';
import { mkdir, copyFile, readFile } from 'node:fs/promises';
import { sha256Bytes } from '../src/canonical.js';
import { freezeLona } from '../src/freeze-core.js';
class McpToolCaller {
    client;
    transport;
    constructor(client, transport) {
        this.client = client;
        this.transport = transport;
    }
    static async connect(url, token) {
        const [{ Client }, { StreamableHTTPClientTransport }] = await Promise.all([
            import('@modelcontextprotocol/sdk/client/index.js'),
            import('@modelcontextprotocol/sdk/client/streamableHttp.js'),
        ]);
        const client = new Client({ name: 'zobiris-provenance-freezer', version: '0.1.0' });
        const transport = new StreamableHTTPClientTransport(new URL(url), {
            requestInit: { headers: { Authorization: `Bearer ${token}` } },
        });
        await client.connect(transport);
        return new McpToolCaller(client, transport);
    }
    async listTools() {
        return this.client.listTools();
    }
    async callTool(name, args) {
        return this.client.callTool({ name, arguments: args });
    }
    async close() {
        await this.client.close();
    }
}
async function captureOriginalInputs(bundleDir) {
    const raw = process.env.LONA_ORIGINAL_INPUT_MAP;
    if (!raw)
        return {};
    const parsed = JSON.parse(raw);
    const out = {};
    const dir = join(bundleDir, 'original-inputs');
    await mkdir(dir, { recursive: true });
    for (const [providerDataId, sourcePath] of Object.entries(parsed)) {
        const bytes = await readFile(resolve(sourcePath));
        const sha256 = sha256Bytes(bytes);
        const name = `${sha256}-${basename(sourcePath).replace(/[^A-Za-z0-9._-]/g, '_')}`;
        const dest = join(dir, name);
        await copyFile(resolve(sourcePath), dest);
        out[providerDataId] = { sha256, relativePath: `original-inputs/${name}`, byteLen: bytes.byteLength };
    }
    return out;
}
async function main() {
    const url = process.env.LONA_MCP_URL ?? 'https://mcp.lona.agency/mcp';
    const token = process.env.LONA_MCP_TOKEN;
    if (!token) {
        throw new Error('LONA_MCP_TOKEN is required. Acquire/rotate it outside this script; never commit it to the bundle.');
    }
    const bundleDir = resolve(process.env.FREEZE_DIR ?? `./lona-freeze-${new Date().toISOString().replace(/[:.]/g, '-')}`);
    await mkdir(bundleDir, { recursive: true });
    const originalInputs = await captureOriginalInputs(bundleDir);
    const caller = await McpToolCaller.connect(url, token);
    try {
        const summary = await freezeLona(caller, {
            bundleDir,
            provider: 'LONA',
            surface: 'DIRECT_MCP',
            endpoint: url,
            accountFingerprint: process.env.LONA_ACCOUNT_FINGERPRINT,
            pageSize: Number(process.env.LONA_PAGE_SIZE ?? 50),
            capturedBy: process.env.CAPTURED_BY ?? 'zobiris-p0-freezer',
            captureGlobalSymbolData: process.env.FREEZE_GLOBAL_DATA === '1',
            originalInputs,
        });
        console.log(JSON.stringify(summary, null, 2));
        console.log(`\nFreeze bundle: ${bundleDir}`);
        console.log('Witness BUNDLE.sha256 outside the SQLite DB before modifying any provider strategy/version.');
    }
    finally {
        await caller.close?.();
    }
}
main().catch((error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : error);
    process.exitCode = 1;
});
