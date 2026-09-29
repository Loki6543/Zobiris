import { afterEach, expect, it, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import Database from 'better-sqlite3';
import { ensureStrategy21Storage, loadStrategyLiquidity } from '../strategy21/storage.js';
const dirs: string[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const d of dirs.splice(0)) rmSync(d, { force: true, recursive: true }); });

it('fails closed on oversized history before parsing, and still loads other assets without deleting history', () => {
  const dir = mkdtempSync(join(tmpdir(), 'zobiris-memory-')); dirs.push(dir);
  const path = join(dir, 'db.sqlite'); ensureStrategy21Storage(path);
  const db = new Database(path);
  const insert = db.prepare('INSERT INTO strategy21_book_snapshots VALUES(?,?,?,?,?,?,?,?)');
  // Invalid JSON padded over the per-symbol budget proves it is rejected before parsing.
  insert.run('big', 'BIG', 'BIG/USD', Date.now(), 'x'.repeat(65 * 1024 * 1024), '[]', 1, 100);
  insert.run('small', 'SMALL', 'SMALL/USD', Date.now(), '[{"price":99,"size":2}]', '[{"price":101,"size":2}]', 1, 100);
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const result = loadStrategyLiquidity(path, ['BIG', 'SMALL']);
  expect(result.has('BIG')).toBe(false);
  expect(result.get('SMALL')?.profile.snapshots).toHaveLength(1);
  expect(warning).toHaveBeenCalledWith(expect.stringContaining('LIQUIDITY_HISTORY_BUDGET_EXCEEDED'), expect.objectContaining({ symbol: 'BIG' }));
  expect(db.prepare('SELECT count(*) AS n FROM strategy21_book_snapshots').get()).toEqual({ n: 2 });
  db.close();
});

it('bounds the combined history even when every individual symbol fits', () => {
  const dir = mkdtempSync(join(tmpdir(), 'zobiris-memory-total-')); dirs.push(dir);
  const path = join(dir, 'db.sqlite'); ensureStrategy21Storage(path);
  const db = new Database(path);
  const insert = db.prepare('INSERT INTO strategy21_book_snapshots VALUES(?,?,?,?,?,?,?,?)');
  const bids = '[{"price":99,"size":2}]' + ' '.repeat(14 * 1024 * 1024);
  db.transaction(() => {
    for (let i = 0; i < 5; i++) insert.run(String(i), `A${i}`, `A${i}/USD`, Date.now(), bids, '[{"price":101,"size":2}]', 1, 100);
  })();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const result = loadStrategyLiquidity(path, ['A0', 'A1', 'A2', 'A3', 'A4', 'A0']);
  expect([...result.keys()]).toEqual(['A0', 'A1', 'A2', 'A3']);
  expect(db.prepare('SELECT count(*) AS n FROM strategy21_book_snapshots').get()).toEqual({ n: 5 });
  db.close();
});
