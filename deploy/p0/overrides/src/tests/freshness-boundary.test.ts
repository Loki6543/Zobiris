import { describe, expect, it } from 'vitest';
import { isFreshBookSnapshot } from '../strategy21/integration.js';

describe('Strategy 2.1 liquidity timestamp boundary', () => {
  const now = '2026-10-10T12:00:00.000Z';

  it('accepts current and exact 15-minute-old observations', () => {
    expect(isFreshBookSnapshot(now, now)).toBe(true);
    expect(isFreshBookSnapshot(now, '2026-10-10T11:45:00.000Z')).toBe(true);
  });

  it('rejects future observations even when their negative age is under the TTL', () => {
    expect(isFreshBookSnapshot(now, '2026-10-10T12:00:00.001Z')).toBe(false);
    expect(isFreshBookSnapshot(now, '2026-10-10T13:00:00.000Z')).toBe(false);
  });

  it('rejects stale, unparseable and missing timestamp strings', () => {
    expect(isFreshBookSnapshot(now, '2026-10-10T11:44:59.999Z')).toBe(false);
    expect(isFreshBookSnapshot('not a date', now)).toBe(false);
    expect(isFreshBookSnapshot(now, 'invalid')).toBe(false);
    expect(isFreshBookSnapshot(now, '')).toBe(false);
  });

  it('rejects invalid TTL overrides without granting freshness', () => {
    for (const ttl of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(isFreshBookSnapshot(now, now, ttl)).toBe(false);
    }
  });
});
