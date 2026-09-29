import { canonicalSha256 } from './canonical.js';
import type { CapabilityTool, Sha256 } from './types.js';

export interface NormalizedCapabilityManifest {
  tools: CapabilityTool[];
  hash: Sha256;
}

function normalizeSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeSchema);
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(obj).sort().map((key) => [key, normalizeSchema(obj[key])]),
    );
  }
  return value;
}

export function normalizeToolsList(tools: Array<{ name: string; inputSchema?: unknown }>): NormalizedCapabilityManifest {
  const normalized = tools
    .map((tool) => ({ name: tool.name, inputSchema: normalizeSchema(tool.inputSchema ?? {}) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { tools: normalized, hash: canonicalSha256(normalized) };
}

export interface CapabilityDiff {
  added: string[];
  removed: string[];
  changed: string[];
}

export function diffCapabilityManifests(a: CapabilityTool[], b: CapabilityTool[]): CapabilityDiff {
  const left = new Map(a.map((x) => [x.name, canonicalSha256(x.inputSchema)]));
  const right = new Map(b.map((x) => [x.name, canonicalSha256(x.inputSchema)]));
  const added = [...right.keys()].filter((k) => !left.has(k)).sort();
  const removed = [...left.keys()].filter((k) => !right.has(k)).sort();
  const changed = [...right.keys()].filter((k) => left.has(k) && left.get(k) !== right.get(k)).sort();
  return { added, removed, changed };
}
