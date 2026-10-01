// @vitest-environment jsdom
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {WatchlistPage} from '../ui/WatchlistPage';
afterEach(cleanup);
it('keeps strategy order, searches and opens coin analysis',()=>{
 const now=Date.now(),analyze=vi.fn();const rows=['ETH','BTC'].map(symbol=>({symbol,asset:null,confidence:0,rotationScore:0,move:'Wait',reason:'Missing quote',ready:false}));
 render(<WatchlistPage rows={rows} now={now} snapshotFresh={true} onAnalyze={analyze}/>);
 expect(screen.getAllByRole('button')[0]!.textContent).toContain('ETH');
 fireEvent.change(screen.getByLabelText('Find a watchlist coin'),{target:{value:'btc'}});
 expect(screen.getAllByRole('button')).toHaveLength(1);fireEvent.click(screen.getAllByRole('button')[0]!);expect(analyze).toHaveBeenCalledWith('BTC');
 expect(screen.getByText('Quote unavailable')).toBeTruthy();
});

it('withholds readiness and unusable quote coverage',()=>{
 const now=Date.now();const asset={strategy21:{explanation:{observations:[{claim:JSON.stringify({cmcId:1}),observedAt:new Date(now).toISOString(),expiresAt:new Date(now+3600000).toISOString()}]}}};
 render(<WatchlistPage rows={[{symbol:'BTC',asset,confidence:80,rotationScore:90,move:'Delayed-rotation limit',reason:'test',ready:true}]} now={now} snapshotFresh={false} onAnalyze={()=>{}}/>);
 expect(screen.getByText('0 with current CMC data')).toBeTruthy();expect(screen.getByText('Entry readiness unavailable — refresh')).toBeTruthy();
});
