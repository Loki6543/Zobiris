// @vitest-environment jsdom
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {AdvisoryDesk} from '../ui/AdvisoryDesk';
import {CommandCenter} from '../ui/CommandCenter';
import {calculateGrossStress,ADVISORY_CATEGORIES} from '../ui/advisoryModel';

afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.restoreAllMocks();});

describe('advisory research categories',()=>{
 it('routes dashboard category shortcuts to their existing analysis workspaces',()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>new Response('offline',{status:503})));
  const onNavigate=vi.fn();
  render(<CommandCenter refreshKey={1} snapshotAsOf={Date.now()} snapshotFresh={true}
    regime="RANGE" accountSynced={false} accountAsOf="" portfolioValue={0}
    cash={0} freeCash={0} reservedBuys={0} orders={[]} watch={[]} trades={[]}
    onNavigate={onNavigate} onAnalyze={()=>{}}/>);
  fireEvent.click(screen.getByRole('button',{name:/Signals & stress/i}));
  expect(onNavigate).toHaveBeenCalledWith('advisory');
  fireEvent.click(screen.getByRole('button',{name:/Margin research/i}));
  expect(onNavigate).toHaveBeenCalledWith('tactical');
 });
 it('defines four real, individually accessible category controls',()=>{
  expect(ADVISORY_CATEGORIES.map(item=>item.id)).toEqual(['signal','margin','funding','stress']);
 });
 it('fails closed on invalid stress assumptions and caps the study at 1.5x',()=>{
  expect(calculateGrossStress(300,1.5,-10)).toEqual({exposure:450,grossPnl:-45,returnOnCapitalPct:-15});
  expect(calculateGrossStress(300,1,-10)).toEqual({exposure:300,grossPnl:-30,returnOnCapitalPct:-10});
  expect(calculateGrossStress(300,2,-10)).toBeNull();
  expect(calculateGrossStress(300,1.5,Number.NaN)).toBeNull();
  expect(calculateGrossStress(-1,1,-10)).toBeNull();
  expect(calculateGrossStress(300,1,-110)).toBeNull();
 });
 it('shows research-only status and missing-provider states instead of invented accuracy and financing fees',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>new Response('unavailable',{status:503})));
  const navigate=vi.fn();
  render(<AdvisoryDesk onNavigate={navigate}/>);
  expect(screen.getByRole('heading',{name:/Advisory Research/i})).toBeTruthy();
  expect(screen.getByText(/no order permissions/i)).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:/Funding & basis/i}));
  expect(await screen.findByText(/not connected/i)).toBeTruthy();
  expect(screen.getByText(/no live funding rate/i)).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:/Execution & stress/i}));
  expect(screen.getByText(/gross only/i)).toBeTruthy();
  expect(screen.queryByText(/68\.4%|\$25,000|p_meta.*0\.82/)).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:/Spot watchlist/i}));
  expect(navigate).toHaveBeenCalledWith('watchlist');
 });
 it('uses validated completed daily BTC data and never displays a calibrated meta-probability',async()=>{
  vi.stubGlobal('fetch',vi.fn(async(req:string)=>{
   if(String(req).includes('/api/market-brief'))return new Response(JSON.stringify({
    asOf:new Date().toISOString(),close:80000,bias:'MIXED / RANGE',
    chart:[{time:1,close:79000},{time:2,close:80000}],
    daily:{rsi14:42,ema50:81000,atrPct:3},returns:[{symbol:'BTC',week:-1}],
    cycleResearch:{watch:'NO_CONFLUENCE'}
   }),{status:200,headers:{'content-type':'application/json'}});
   return new Response(JSON.stringify({counts:{closed:2,complete:1},paused:false,lastSuccess:Date.now()}),{status:200,headers:{'content-type':'application/json'}});
  }));
  render(<AdvisoryDesk onNavigate={()=>{}}/>);
  await waitFor(()=>expect(screen.getByText('MIXED / RANGE')).toBeTruthy());
  expect(screen.getByText(/42\.0/)).toBeTruthy();
  expect(screen.getByText(/uncalibrated/i)).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:/Margin risk/i}));
  expect(screen.getByText(/2 closed/i)).toBeTruthy();
 });
});
