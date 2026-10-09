// @vitest-environment jsdom
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,it,expect} from 'vitest';
import {BitcoinChart} from '../ui/BitcoinChart';
afterEach(cleanup);
it('labels observed levels and changes both time range and inspected daily close',()=>{
 const points=Array.from({length:90},(_,i)=>({time:Date.UTC(2026,6,1)/1000+i*86400,close:60000+i*100}));
 render(<BitcoinChart points={points} lower={65000} upper={68900} ema50={64000}/>);
 const slider=screen.getByRole('slider');
 expect(slider.getAttribute('max')).toBe('29');
 fireEvent.click(screen.getByRole('button',{name:'90 days'}));
 expect(slider.getAttribute('max')).toBe('89');
 fireEvent.change(slider,{target:{value:'0'}});
 expect(screen.getByText(/2026-07-01 UTC/)).toBeTruthy();
 expect(screen.getByText('$60,000')).toBeTruthy();
 expect(screen.getByText(/not its historical path/)).toBeTruthy();
});
