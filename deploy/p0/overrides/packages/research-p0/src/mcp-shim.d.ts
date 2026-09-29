declare module '@modelcontextprotocol/sdk/client/index.js' {
  export class Client {
    constructor(info: { name: string; version: string }, options?: unknown);
    connect(transport: unknown): Promise<void>;
    close(): Promise<void>;
    listTools(): Promise<any>;
    callTool(input: { name: string; arguments?: Record<string, unknown> }): Promise<any>;
  }
}
declare module '@modelcontextprotocol/sdk/client/streamableHttp.js' {
  export class StreamableHTTPClientTransport {
    constructor(url: URL, options?: any);
  }
}
