import { useEffect, useMemo, useState } from "react";
import {
  EngineApiSuccessSchema,
  MinimumEvidenceResponseSchema,
  type EngineRow,
  type EngineSnapshot,
  type MinimumEvidence,
} from "../engine/types";

type Nav="ENGINE"|"COMPARE"|"PORTFOLIO"|"LEARNING";
const HORIZONS=["1H","4H","1D","3D","7D","14D","30D"] as const;

const money=(n:number|null,digits=2)=>n==null?"—":new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:digits,minimumFractionDigits:digits}).format(n);
const priceMoney=(n:number|null)=>{
  if(n==null) return "—";
  const digits=n<0.0001?8:n<0.01?6:n<1?4:2;
  return money(n,digits);
};
const pct=(n:number|null)=>n==null?"—":(n>=0?"+":"")+n.toFixed(1)+"%";
const stateLabel=(s:string)=>s.replaceAll("_"," ");
const ageLabel=(ms:number|null|undefined)=>{
  if(ms==null) return "—";
  if(ms<60_000) return Math.max(0,Math.round(ms/1000))+"s";
  if(ms<3_600_000) return Math.round(ms/60_000)+"m";
  return (ms/3_600_000).toFixed(1)+"h";
};
const gapPct=(row:EngineRow)=>row.priceUsd&&row.intendedLimitPrice
  ? (row.intendedLimitPrice/row.priceUsd-1)*100
  : null;

function EngineTable({snapshot,selected,onSelect}:{snapshot:EngineSnapshot;selected:string|null;onSelect:(symbol:string)=>void}) {
  return <div className="tableWrap">
    <table className="engineTable">
      <thead><tr>
        <th>#</th><th>Coin</th><th>State</th><th className="num">Price</th><th className="num">Limit Entry</th>
        <th className="num">7D</th><th className="num">30D</th><th className="num">90D</th>
        <th className="num">vs BTC 30D</th><th className="num">Catch-Up</th><th className="num">Entry</th><th>Kraken Liquidity</th><th>Risk</th>
      </tr></thead>
      <tbody>{snapshot.rows.map(row=><tr key={row.symbol} className={selected===row.symbol?"selected":""} onClick={()=>onSelect(row.symbol)}>
        <td className="rank">{row.rank}</td>
        <td><strong>{row.symbol}</strong><small>{row.name}</small></td>
        <td><span className={"status status-"+row.state.toLowerCase()}>{stateLabel(row.state)}</span></td>
        <td className="num">{priceMoney(row.priceUsd)}</td>
        <td className="num entry">{priceMoney(row.intendedLimitPrice)}</td>
        <td className={"num "+((row.change7dPct??0)>=0?"pos":"neg")}>{pct(row.change7dPct)}</td>
        <td className={"num "+((row.change30dPct??0)>=0?"pos":"neg")}>{pct(row.change30dPct)}</td>
        <td className={"num "+((row.change90dPct??0)>=0?"pos":"neg")}>{pct(row.change90dPct)}</td>
        <td className={"num "+((row.relative30dVsBtcPct??0)>=0?"pos":"neg")}>{pct(row.relative30dVsBtcPct)}</td>
        <td className="num score">{row.catchUpQuality.toFixed(0)}</td>
        <td className="num score">{row.entryQuality.toFixed(0)}</td>
        <td>{row.marketDepthGrade??(row.krakenPair?"WARMUP":"—")}</td>
        <td>{row.state==="DATA_STALE"?"STALE":row.reasonCodes.some(x=>x.includes("risk"))?"BLOCKED":row.personalExecutionPass===false?"EXECUTION":"—"}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}

function Inspector({row}:{row:EngineRow|null}) {
  if(!row) return <aside className="inspector"><div className="eyebrow">SELECTED ASSET</div><p>Select a watchlist row.</p></aside>;
  const gap=gapPct(row);
  return <aside className="inspector">
    <div className="eyebrow">SELECTED ASSET · #{row.rank}</div>
    <div className="assetTitle"><h2>{row.symbol}</h2><span>{row.name}</span></div>
    <div className={"decision decision-"+row.state.toLowerCase()}>{stateLabel(row.state)}</div>
    <section className="inspectorSection">
      <h3>Decision</h3>
      <dl>
        <div><dt>Current price</dt><dd>{priceMoney(row.priceUsd)}</dd></div>
        <div><dt>Zobiris entry</dt><dd className="cyan">{priceMoney(row.intendedLimitPrice)}</dd></div>
        <div><dt>Limit gap</dt><dd>{pct(gap)}</dd></div>
        <div><dt>Max new order</dt><dd>{row.maxNewOrderUsd>0?money(row.maxNewOrderUsd):"—"}</dd></div>
      </dl>
    </section>
    <section className="inspectorSection">
      <h3>Rotation</h3>
      <dl>
        <div><dt>7D</dt><dd>{pct(row.change7dPct)}</dd></div>
        <div><dt>30D</dt><dd>{pct(row.change30dPct)}</dd></div>
        <div><dt>90D</dt><dd>{pct(row.change90dPct)}</dd></div>
        <div><dt>30D vs BTC</dt><dd>{pct(row.relative30dVsBtcPct)}</dd></div>
        <div><dt>Catch-up quality</dt><dd>{row.catchUpQuality.toFixed(0)}</dd></div>
      </dl>
    </section>
    <section className="inspectorSection">
      <h3>Execution</h3>
      <dl>
        <div><dt>Kraken market</dt><dd>{row.krakenPair??"None"}</dd></div>
        <div><dt>Personal-size gate</dt><dd>{row.personalExecutionPass==null?"NOT SAMPLED":row.personalExecutionPass?"PASS":"FAIL"}</dd></div>
        <div><dt>Depth grade</dt><dd>{row.marketDepthGrade??"—"}</dd></div>
      </dl>
    </section>
    <section className="inspectorSection">
      <h3>Why</h3>
      <div className="reasonList">{row.reasonCodes.slice(0,6).map(reason=><div key={reason}>• {reason.replaceAll("_"," ")}</div>)}</div>
    </section>
  </aside>;
}

function CompareView({
  snapshot,
  selectedSymbols,
  onToggle,
}:{
  snapshot:EngineSnapshot|null;
  selectedSymbols:string[];
  onToggle:(symbol:string)=>void;
}) {
  if(!snapshot) return <main className="viewPanel"><div className="emptyState">Engine snapshot not ready.</div></main>;
  const selectedRows=selectedSymbols
    .map(symbol=>snapshot.rows.find(row=>row.symbol===symbol))
    .filter((row):row is EngineRow=>Boolean(row));
  const maxed=selectedRows.length>=4;

  return <main className="viewPanel">
    <div className="sectionHead">
      <div><h2>Side-by-Side Opportunity Compare</h2><p>Compare up to four live watchlist candidates using the same decision, rotation and execution evidence.</p></div>
      <div className="refreshState">{selectedRows.length}/4 SELECTED · SNAPSHOT {new Date(snapshot.generatedAt).toLocaleTimeString()}</div>
    </div>
    <div className="compareLayout">
      <aside className="comparePicker">
        <div className="eyebrow">TOP WATCHLIST</div>
        <p>Select assets to compare. Ranking alone never overrides execution or entry-quality gates.</p>
        <div className="pickerList">{snapshot.rows.slice(0,20).map(row=>{
          const active=selectedSymbols.includes(row.symbol);
          return <button
            key={row.symbol}
            type="button"
            className={"pickerRow "+(active?"selected":"")}
            disabled={!active&&maxed}
            aria-pressed={active}
            onClick={()=>onToggle(row.symbol)}
          >
            <span className="pickerRank">#{row.rank}</span>
            <span className="pickerCoin"><b>{row.symbol}</b><small>{stateLabel(row.state)}</small></span>
            <span className="pickerScore">{row.entryQuality.toFixed(0)}</span>
          </button>;
        })}</div>
      </aside>
      <section className="compareGrid">
        {selectedRows.length?selectedRows.map(row=><article className="compareCard" key={row.symbol}>
          <div className="compareCardHead">
            <div><div className="eyebrow">RANK #{row.rank}</div><h2>{row.symbol}</h2><span>{row.name}</span></div>
            <span className={"status status-"+row.state.toLowerCase()}>{stateLabel(row.state)}</span>
          </div>
          <div className="comparePrice">
            <div><span>MARKET</span><strong>{priceMoney(row.priceUsd)}</strong></div>
            <div><span>ZOBIRIS ENTRY</span><strong className="cyan">{priceMoney(row.intendedLimitPrice)}</strong></div>
            <div><span>ENTRY GAP</span><strong>{pct(gapPct(row))}</strong></div>
          </div>
          <dl className="compareMetrics">
            <div><dt>Entry quality</dt><dd className="cyan">{row.entryQuality.toFixed(0)}</dd></div>
            <div><dt>Catch-up quality</dt><dd>{row.catchUpQuality.toFixed(0)}</dd></div>
            <div><dt>7D move</dt><dd className={(row.change7dPct??0)>=0?"pos":"neg"}>{pct(row.change7dPct)}</dd></div>
            <div><dt>30D move</dt><dd className={(row.change30dPct??0)>=0?"pos":"neg"}>{pct(row.change30dPct)}</dd></div>
            <div><dt>90D move</dt><dd className={(row.change90dPct??0)>=0?"pos":"neg"}>{pct(row.change90dPct)}</dd></div>
            <div><dt>30D vs BTC</dt><dd className={(row.relative30dVsBtcPct??0)>=0?"pos":"neg"}>{pct(row.relative30dVsBtcPct)}</dd></div>
            <div><dt>Kraken depth</dt><dd>{row.marketDepthGrade??"WARMUP"}</dd></div>
            <div><dt>Execution gate</dt><dd>{row.personalExecutionPass==null?"UNSAMPLED":row.personalExecutionPass?"PASS":"FAIL"}</dd></div>
            <div><dt>Max new order</dt><dd>{row.maxNewOrderUsd>0?money(row.maxNewOrderUsd):"—"}</dd></div>
          </dl>
          <div className="compareReasons">
            <div className="eyebrow">PRIMARY EVIDENCE</div>
            {row.reasonCodes.slice(0,4).map(reason=><span key={reason}>{reason.replaceAll("_"," ")}</span>)}
          </div>
        </article>):<div className="emptyState">Select at least one watchlist asset.</div>}
      </section>
    </div>
  </main>;
}

function PortfolioView({snapshot}:{snapshot:EngineSnapshot|null}) {
  if(!snapshot) return <main className="viewPanel"><div className="emptyState">Engine snapshot not ready.</div></main>;
  const candidates=snapshot.rows.filter(row=>row.qualifiesForNewCapital).slice(0,8);
  const providers=Object.entries(snapshot.health.providers);

  return <main className="viewPanel">
    <div className="sectionHead">
      <div><h2>Portfolio & Execution Readiness</h2><p>Core staging is read-only. It does not infer private Kraken balances or pretend unverified holdings are known.</p></div>
      <div className={"authorityBadge "+(snapshot.authority.newBuyEnabled?"on":"off")}>{snapshot.authority.newBuyEnabled?"NEW-BUY AUTHORITY ON":"NEW-BUY AUTHORITY BLOCKED"}</div>
    </div>
    <div className="portfolioGrid">
      <section className="infoCard">
        <div className="eyebrow">AUTHORITY</div>
        <h3>{snapshot.authority.newBuyEnabled?"Global evidence gates are currently open.":"One or more global evidence gates are closed."}</h3>
        <div className="reasonList authorityReasons">
          {snapshot.authority.reasons.length
            ? snapshot.authority.reasons.map(reason=><div key={reason}>• {reason.replaceAll("_"," ")}</div>)
            : <div>• all authority gates passed</div>}
        </div>
      </section>
      <section className="infoCard">
        <div className="eyebrow">MARKET CONTEXT</div>
        <div className="bigMetric">{snapshot.market.state}</div>
        <dl>
          <div><dt>BTC 7D</dt><dd>{pct(snapshot.market.btc7dPct)}</dd></div>
          <div><dt>BTC 30D</dt><dd>{pct(snapshot.market.btc30dPct)}</dd></div>
          <div><dt>BTC 90D</dt><dd>{pct(snapshot.market.btc90dPct)}</dd></div>
          <div><dt>7D positive breadth</dt><dd>{snapshot.market.breadth7dPositive==null?"—":(snapshot.market.breadth7dPositive*100).toFixed(0)+"%"}</dd></div>
        </dl>
      </section>
      <section className="infoCard">
        <div className="eyebrow">DATA PROVIDERS</div>
        <div className="providerList">{providers.map(([name,health])=><div key={name}>
          <span>{name.replaceAll(/([A-Z])/g," $1")}</span>
          <b className={"providerState state-"+health.status.toLowerCase()}>{health.status}</b>
          <small>{health.mode??"—"} · {ageLabel(health.ageMs)}</small>
        </div>)}</div>
      </section>
      <section className="infoCard candidateCard">
        <div className="eyebrow">CLEARED FOR NEW CAPITAL</div>
        {candidates.length?<div className="candidateList">{candidates.map(row=><div key={row.symbol}>
          <span><b>#{row.rank} {row.symbol}</b><small>{stateLabel(row.state)}</small></span>
          <span><strong>{priceMoney(row.intendedLimitPrice)}</strong><small>{row.maxNewOrderUsd>0?money(row.maxNewOrderUsd)+" max":"no size"}</small></span>
        </div>)}</div>:<div className="emptyInline">No asset currently clears every per-asset capital gate.</div>}
      </section>
    </div>
    <div className="readOnlyNotice"><b>PRIVATE PORTFOLIO NOT CONNECTED TO CORE STAGING.</b> This is deliberate: the rebuild will not fabricate holdings, cost basis, or sell authority from missing account evidence.</div>
  </main>;
}

function LearningView({
  evidence,
  loading,
  error,
}:{
  evidence:MinimumEvidence[];
  loading:boolean;
  error:string|null;
}) {
  return <main className="viewPanel">
    <div className="sectionHead">
      <div><h2>Learning Evidence Ledger</h2><p>Promotion stays blocked until outcomes include enough qualified, control and independent market episodes under the current policy hash.</p></div>
      <div className="refreshState">{loading?"REFRESHING":error??(evidence.length?evidence[0]?.policyVersion+" POLICY":"NO EVIDENCE")}</div>
    </div>
    {error&&!evidence.length?<div className="emptyState">Learning evidence unavailable: {error}</div>:<div className="learningGrid">
      {evidence.map(item=><article className={"evidenceCard "+(item.promotable?"promotable":"blocked")} key={item.horizon}>
        <div className="evidenceHead">
          <div><div className="eyebrow">HORIZON</div><h2>{item.horizon}</h2></div>
          <span>{item.promotable?"PROMOTABLE":"EVIDENCE BUILDING"}</span>
        </div>
        <div className="evidenceCounts">
          <div><strong>{item.qualifiedEpisodes}</strong><span>Qualified</span></div>
          <div><strong>{item.controlEpisodes}</strong><span>Controls</span></div>
          <div><strong>{item.independentMarketEpisodes}</strong><span>Market episodes</span></div>
        </div>
        <dl>
          <div><dt>Largest episode share</dt><dd>{item.maxMarketEpisodeShare==null?"—":(item.maxMarketEpisodeShare*100).toFixed(1)+"%"}</dd></div>
          <div><dt>Policy</dt><dd>{item.policyVersion}</dd></div>
        </dl>
        <div className="evidenceReasons">
          {item.reasons.length?item.reasons.slice(0,4).map(reason=><span key={reason}>{reason.replaceAll("_"," ")}</span>):<span>minimum evidence gates passed</span>}
        </div>
      </article>)}
      {loading&&!evidence.length?<div className="emptyState">Loading learning evidence…</div>:null}
    </div>}
  </main>;
}

export function App() {
  const [nav,setNav]=useState<Nav>("ENGINE");
  const [snapshot,setSnapshot]=useState<EngineSnapshot|null>(null);
  const [selected,setSelected]=useState<string|null>(null);
  const [compareSymbols,setCompareSymbols]=useState<string[]>([]);
  const [error,setError]=useState<string|null>(null);
  const [evidence,setEvidence]=useState<MinimumEvidence[]>([]);
  const [evidenceLoading,setEvidenceLoading]=useState(false);
  const [evidenceError,setEvidenceError]=useState<string|null>(null);

  useEffect(()=>{
    let active=true;
    const load=async()=>{
      try{
        const response=await fetch("/api/engine",{cache:"no-store"});
        if(response.status===503){ if(active)setError("ENGINE WARMUP"); return; }
        if(!response.ok) throw new Error("HTTP "+response.status);
        const body=EngineApiSuccessSchema.parse(await response.json());
        if(active){
          setSnapshot(body.snapshot);
          setError(null);
          setSelected(current=>current??body.snapshot.rows[0]?.symbol??null);
          setCompareSymbols(current=>{
            const available=new Set(body.snapshot.rows.map(row=>row.symbol));
            const valid=current.filter(symbol=>available.has(symbol));
            return valid.length?valid:body.snapshot.rows.slice(0,3).map(row=>row.symbol);
          });
        }
      }catch(e){
        if(active)setError(e instanceof Error?e.message:String(e));
      }
    };
    void load();
    const timer=setInterval(()=>void load(),30_000);
    return()=>{active=false;clearInterval(timer);};
  },[]);

  useEffect(()=>{
    if(nav!=="LEARNING") return;
    let active=true;
    const loadEvidence=async()=>{
      if(active)setEvidenceLoading(true);
      try{
        const results=await Promise.all(HORIZONS.map(async horizon=>{
          const response=await fetch("/api/learning/evidence/"+horizon,{cache:"no-store"});
          if(!response.ok) throw new Error(horizon+" HTTP "+response.status);
          return MinimumEvidenceResponseSchema.parse(await response.json()).evidence;
        }));
        if(active){setEvidence(results);setEvidenceError(null);}
      }catch(e){
        if(active)setEvidenceError(e instanceof Error?e.message:String(e));
      }finally{
        if(active)setEvidenceLoading(false);
      }
    };
    void loadEvidence();
    const timer=setInterval(()=>void loadEvidence(),60_000);
    return()=>{active=false;clearInterval(timer);};
  },[nav]);

  const selectedRow=useMemo(()=>snapshot?.rows.find(r=>r.symbol===selected)??null,[snapshot,selected]);
  const dataAge=useMemo(()=>{
    if(!snapshot) return null;
    const values=[
      snapshot.health.providers.cmcQuotes.ageMs,
      snapshot.health.providers.krakenInstruments.ageMs,
      snapshot.health.providers.krakenTicker.ageMs,
    ].filter((x):x is number=>x!=null);
    return values.length?Math.max(...values):null;
  },[snapshot]);

  const toggleCompare=(symbol:string)=>{
    setCompareSymbols(current=>{
      if(current.includes(symbol)) return current.filter(item=>item!==symbol);
      if(current.length>=4) return current;
      return [...current,symbol];
    });
  };

  return <div className="shell">
    <header className="topbar">
      <div className="brand"><div className="eyebrow">ZOBIRIS CORE</div><h1>ENGINE</h1></div>
      <nav>{(["ENGINE","COMPARE","PORTFOLIO","LEARNING"] as Nav[]).map(item=><button key={item} className={nav===item?"active":""} onClick={()=>setNav(item)}>{item}</button>)}</nav>
      <div className="telemetry">
        <span>MARKET <b>{snapshot?.market.state??"WARMUP"}</b></span>
        <span>BTC <b>{money(snapshot?.market.btcPriceUsd??null,0)}</b></span>
        <span>WATCHLIST <b>{snapshot?.health.watchlistCount??"—"}</b></span>
        <span>QUALIFIED <b>{snapshot?.qualifiedCount??"—"}</b></span>
        <span>AUTHORITY <b className={snapshot?.authority.newBuyEnabled?"authorityOn":"authorityOff"}>{snapshot?snapshot.authority.newBuyEnabled?"ENABLED":"DISABLED":"WARMUP"}</b></span>
        <span>DATA AGE <b>{ageLabel(dataAge)}</b></span>
        <span>KRAKEN <b>{snapshot?.health.krakenInstruments??"WARMUP"}</b></span>
      </div>
    </header>

    {nav==="ENGINE"?<main className="workspace">
      <section className="rankings">
        <div className="sectionHead">
          <div><h2>Watchlist Rankings</h2><p>Every tracked coin stays visible. Ranked by current opportunity; personal-size Kraken execution controls new-buy authority.</p></div>
          <div className="refreshState">{error??(snapshot
            ? (snapshot.authority.newBuyEnabled?"LIVE":"AUTH BLOCKED")+" · DATA "+ageLabel(dataAge)+" · UPDATED "+new Date(snapshot.generatedAt).toLocaleTimeString()
            : "ENGINE WARMUP")}</div>
        </div>
        {snapshot?<EngineTable snapshot={snapshot} selected={selected} onSelect={setSelected}/>:<div className="emptyState">Collecting market context and Kraken execution data…</div>}
      </section>
      <Inspector row={selectedRow}/>
    </main>:null}

    {nav==="COMPARE"?<CompareView snapshot={snapshot} selectedSymbols={compareSymbols} onToggle={toggleCompare}/>:null}
    {nav==="PORTFOLIO"?<PortfolioView snapshot={snapshot}/>:null}
    {nav==="LEARNING"?<LearningView evidence={evidence} loading={evidenceLoading} error={evidenceError}/>:null}
  </div>;
}
