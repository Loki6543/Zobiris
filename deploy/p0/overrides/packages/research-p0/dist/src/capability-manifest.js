import { canonicalSha256 } from './canonical.js';
function normalizeSchema(value) {
    if (Array.isArray(value))
        return value.map(normalizeSchema);
    if (value && typeof value === 'object') {
        const obj = value;
        return Object.fromEntries(Object.keys(obj).sort().map((key) => [key, normalizeSchema(obj[key])]));
    }
    return value;
}
export function normalizeToolsList(tools) {
    const normalized = tools
        .map((tool) => ({ name: tool.name, inputSchema: normalizeSchema(tool.inputSchema ?? {}) }))
        .sort((a, b) => a.name.localeCompare(b.name));
    return { tools: normalized, hash: canonicalSha256(normalized) };
}
export function diffCapabilityManifests(a, b) {
    const left = new Map(a.map((x) => [x.name, canonicalSha256(x.inputSchema)]));
    const right = new Map(b.map((x) => [x.name, canonicalSha256(x.inputSchema)]));
    const added = [...right.keys()].filter((k) => !left.has(k)).sort();
    const removed = [...left.keys()].filter((k) => !right.has(k)).sort();
    const changed = [...right.keys()].filter((k) => left.has(k) && left.get(k) !== right.get(k)).sort();
    return { added, removed, changed };
}
