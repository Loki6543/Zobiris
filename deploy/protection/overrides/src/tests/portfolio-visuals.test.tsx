// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PortfolioVisuals } from '../ui/PortfolioVisuals';

afterEach(cleanup);
describe('portfolio visual states', () => {
  const rows = [{ symbol: 'TEST', value: 300, priceAvailable: true }];
  it('hides values and holdings when the account is locked, even if stale props remain', () => {
    render(<PortfolioVisuals rows={rows} cash={100} reserved={25} accountSynced={false} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Portfolio allocation is private');
    expect(screen.queryByText('TEST')).toBeNull();
    expect(screen.queryByText('$100.00')).toBeNull();
    expect(screen.queryByText('$300.00')).toBeNull();
    expect(screen.queryByText('25%')).toBeNull();
  });
  it('keeps allocation proportional to actual balances and excludes reserved buys from total capital', () => {
    render(<PortfolioVisuals rows={rows} cash={100} reserved={25} accountSynced />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Portfolio allocation: 25% cash, 75% invested');
    expect(screen.getByText('$100.00')).toBeTruthy();
    expect(screen.getByText('$25.00')).toBeTruthy();
    expect(screen.getByText('TEST')).toBeTruthy();
    expect(screen.getByText('$300.00 · 100.0%')).toBeTruthy();
  });
});
