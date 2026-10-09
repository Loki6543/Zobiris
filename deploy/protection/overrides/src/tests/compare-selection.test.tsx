// @vitest-environment jsdom
import {useState} from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {CompareLab} from '../ui/CompareLab';
import {ResearchEvidenceContent} from '../ui/ResearchEvidencePanel';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('keeps the research panel on the coin selected in Crypto analysis',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:false,json:async()=>({error:'History unavailable in this UI fixture'})})));
 const assets=['BTC','QNT'].map(symbol=>({symbol,evidence:[{id:symbol,summary:'Test evidence',sourceUrl:'https://example.com',expiresAt:'2030-01-01'}]}));
 function View(){const [symbol,setSymbol]=useState('BTC');return <><ResearchEvidenceContent data={{assets}} symbol={symbol}/><CompareLab rankedAssets={assets} focusSymbol={symbol} onAnalyzeSymbol={setSymbol}/></>;}
 render(<View/>);
 fireEvent.click(screen.getByRole('button',{name:'Crypto analysis'}));
 fireEvent.change(screen.getByRole('combobox',{name:'Analyze coin'}),{target:{value:'QNT'}});
 expect(await screen.findByRole('heading',{name:'QNT: what changed'})).toBeTruthy();
 expect(screen.queryByRole('heading',{name:'BTC: what changed'})).toBeNull();
 expect(screen.getByRole('heading',{name:'QNT crypto analysis'})).toBeTruthy();
});
