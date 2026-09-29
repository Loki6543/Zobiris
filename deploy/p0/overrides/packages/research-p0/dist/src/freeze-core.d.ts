import type { ReproductionTier } from './types.js';
export interface ToolCaller {
    listTools(): Promise<unknown>;
    callTool(name: string, args: Record<string, unknown>): Promise<unknown>;
    close?(): Promise<void>;
}
export interface FreezeOptions {
    bundleDir: string;
    provider?: string;
    surface?: 'DIRECT_MCP' | 'CHATGPT_CONNECTOR' | 'WEB_UI' | 'OTHER';
    endpoint?: string;
    accountFingerprint?: string;
    pageSize?: number;
    capturedBy?: string;
    captureGlobalSymbolData?: boolean;
    /** Exact user-owned original input bytes captured by symbol/data id before provider run. */
    originalInputs?: Record<string, {
        sha256: string;
        relativePath: string;
        byteLen: number;
    }>;
}
export interface CaptureRecord {
    key: string;
    tool: string;
    argsCanonicalSha256: string;
    responseSha256: string;
    responsePath: string;
    capturedAt: string;
    captureMethod: 'sdk_decoded_json';
    pageIndex?: number;
}
export interface FrozenReportSummary {
    reportId: string;
    strategyId?: string;
    tier: ReproductionTier;
    sourceCaptured: boolean;
    fullReportCaptured: boolean;
    reason: string;
    datasetRefs: string[];
    r1InputsPinned: boolean;
}
export interface FreezeSummary {
    bundleId: string;
    bundleHash: string;
    capabilityManifestHash: string;
    toolCount: number;
    pagesFetched: Record<string, number>;
    strategies: number;
    reports: number;
    symbols: number;
    reportTiers: FrozenReportSummary[];
    warnings: string[];
}
export declare class FreezeRecorder {
    readonly bundleDir: string;
    readonly storeDir: string;
    readonly recordsPath: string;
    readonly statePath: string;
    private state;
    records: CaptureRecord[];
    constructor(bundleDir: string);
    init(): Promise<void>;
    has(key: string): boolean;
    prior(key: string): CaptureRecord | undefined;
    capture(key: string, tool: string, args: Record<string, unknown>, response: unknown, pageIndex?: number): Promise<CaptureRecord>;
}
export declare function listAllPaged(caller: ToolCaller, recorder: FreezeRecorder, tool: string, itemKeys: string[], baseArgs?: Record<string, unknown>, pageSize?: number): Promise<{
    items: any[];
    pages: number;
}>;
export declare function freezeLona(caller: ToolCaller, options: FreezeOptions): Promise<FreezeSummary>;
