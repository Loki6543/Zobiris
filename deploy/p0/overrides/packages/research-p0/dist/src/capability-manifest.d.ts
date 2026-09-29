import type { CapabilityTool, Sha256 } from './types.js';
export interface NormalizedCapabilityManifest {
    tools: CapabilityTool[];
    hash: Sha256;
}
export declare function normalizeToolsList(tools: Array<{
    name: string;
    inputSchema?: unknown;
}>): NormalizedCapabilityManifest;
export interface CapabilityDiff {
    added: string[];
    removed: string[];
    changed: string[];
}
export declare function diffCapabilityManifests(a: CapabilityTool[], b: CapabilityTool[]): CapabilityDiff;
