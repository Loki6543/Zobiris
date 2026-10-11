/**
 * Advisory workspace categories follow the supplied Zobiris HTML reference,
 * but not its mocked prices, model probabilities, financing fees or trade authority.
 */
export const ADVISORY_CATEGORIES=[
 {id:'signal',label:'Signal validation',detail:'Market evidence, not forecast odds'},
 {id:'margin',label:'Margin risk',detail:'Paper controls and account eligibility'},
 {id:'funding',label:'Funding & basis',detail:'Provider coverage and financing gaps'},
 {id:'stress',label:'Execution & stress',detail:'Illustrative losses under price shocks'},
] as const;
export type AdvisoryCategory=(typeof ADVISORY_CATEGORIES)[number]['id'];

export type GrossStress={exposure:number;grossPnl:number;returnOnCapitalPct:number};
const cents=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
/** Scenario arithmetic only. Never a margin, liquidation or order authorization. */
export function calculateGrossStress(capital:number,leverage:number,movePct:number):GrossStress|null {
 if(![capital,leverage,movePct].every(Number.isFinite)||capital<=0||capital>1e9
    ||leverage<1||leverage>1.5||movePct< -100||movePct>100)return null;
 const exposure=capital*leverage;
 return {exposure:cents(exposure),grossPnl:cents(exposure*movePct/100),returnOnCapitalPct:cents(leverage*movePct)};
}
