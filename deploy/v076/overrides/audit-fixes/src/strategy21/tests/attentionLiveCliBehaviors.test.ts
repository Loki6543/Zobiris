import test from 'node:test';
import assert from 'node:assert/strict';

interface RunResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

// Minimal local typings for the bits of Node the strategy21 tsconfig does not
// pull in via @types/node. Keeping these inline lets the CLI behavior test
// compile without expanding the production types configuration.
interface ChildLike {
  stdout: { on(event: 'data', cb: (chunk: string) => void): void };
  stderr: { on(event: 'data', cb: (chunk: string) => void): void };
  on(event: 'error', cb: (error: unknown) => void): void;
  on(event: 'close', cb: (status: number | null) => void): void;
}
interface SpawnLike {
  (cmd: string, args: string[], opts: { cwd: string; env: Record<string, string | undefined>; stdio: ['ignore', 'pipe', 'pipe'] }): ChildLike;
}

async function runCli(args: string[]): Promise<RunResult> {
  // Use the dynamic import API (universal, typed by @types/node in the
  // production config) and ignore the strategy21 tsconfig's types: [].
  // The @actual compiled module lives in ESM land where dynamic import works.
  const cpMod = 'node:child_process';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cp = await import(cpMod) as unknown as { spawn: SpawnLike };
  return await new Promise((resolve, reject) => {
    const child = cp.spawn('node', ['--import', 'tsx', 'src/scripts/collect-attention-live.ts', ...args], {
      cwd: process.cwd(),
      env: process.env as Record<string, string | undefined>,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: string) => { stdout += chunk; });
    child.stderr.on('data', (chunk: string) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (status: number | null) => resolve({ status, stdout, stderr }));
  });
}

test('CLI exits non-zero when an unknown option is supplied', async () => {
  const result = await runCli(['--no-such-flag']);
  assert.notEqual(result.status, 0, `expected non-zero exit, got ${result.status}`);
  assert.match(result.stderr, /unknown option/);
});

test('CLI help text advertises the new --fetch-timeout-ms flag', async () => {
  const result = await runCli(['--help']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /--fetch-timeout-ms/);
  assert.match(result.stdout, /--dry-run/);
  assert.match(result.stdout, /--stocktwits-file/);
});

test('CLI exits non-zero when --scheduled-for is unparseable', async () => {
  const result = await runCli(['--dry-run', '--db=:memory:', '--scheduled-for=not-a-date']);
  assert.notEqual(result.status, 0, `expected non-zero exit, got ${result.status}`);
  assert.match(result.stderr, /--scheduled-for/);
});

test('CLI exits non-zero when --fetch-timeout-ms is non-numeric', async () => {
  const result = await runCli(['--dry-run', '--db=:memory:', '--fetch-timeout-ms=abc']);
  assert.notEqual(result.status, 0, `expected non-zero exit, got ${result.status}`);
  assert.match(result.stderr, /--fetch-timeout-ms/);
});

test('CLI exits non-zero when --stocktwits-file points at a missing path', async () => {
  const result = await runCli(['--dry-run', '--db=:memory:', '--scheduled-for=2026-09-14T01:00:00Z', '--stocktwits-file=/tmp/__zobiris_missing__.json']);
  assert.notEqual(result.status, 0, `expected non-zero exit, got ${result.status}`);
  assert.match(result.stderr, /stocktwits-file not readable/);
});
