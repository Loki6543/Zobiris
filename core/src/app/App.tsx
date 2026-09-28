import { useEffect, useMemo, useState } from "react";
import { EngineApiSuccessSchema, type EngineRow, type EngineSnapshot } from "../engine/types";

type Nav="ENGINE"|"COMPARE"|"PORTFOLIO"|"LEARNING";
const money=(n:number|null,digits=2)=>n==null?"—":new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:digits,minimumFractionDigits:digits}).format(n);
const priceMoney=(n:number|null)=>{
  if(n==null) return "—";
  const digits=n<0.0001?8:n<0.01?6:n<1?4:2;
  return money(n,digits);
};
const pct=(n:number|null)=>n==null?"—":`${n>=0?"+":""}${n.toFixed(1)}%`;
const stateLabel=(s:string)=>s.replaceAll("_"," ");
const ageLabel=(ms:number|null|undefined)=>{
  if(ms==null) return "—";
  if(ms<60_000) return `${Math.max(0,Math.round(ms/1000))}s`;
  if(ms<3_600_000) return `${Math.round(ms/60_000)}m`;
  return `${(ms/3_600_000).toFixed(1)}h`;
};

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
        <td><span className={`status status-${row.state.toLowerCase()}`}>{stateLabel(row.state)}</span></td>
        <td className="num">{priceMoney(row.priceUsd)}</td>
        <td className="num entry">{priceMoney(row.intendedLimitPrice)}</td>
        <td className={`num ${(row.change7dPct??0)>=0?"pos":"neg"}`}>{pct(row.change7dPct)}</td>
        <td className={`num ${(row.change30dPct??0)>=0?"pos":"neg"}`}>{pct(row.change30dPct)}</td>
        <td className={`num ${(row.change90dPct??0)>=0?"pos":"neg"}`}>{pct(row.change90dPct)}</td>
        <td className={`num ${(row.relative30dVsBtcPct??0)>=0?"pos":"neg"}`}>{pct(row.relative30dVsBtcPct)}</td>
        <td className="num score">{row.catchUpQuality?row.catchUpQuality.toFixed(0):"—"}</td>
        <td className="num score">{row.entryQuality?row.entryQuality.toFixed(0):"—"}</td>
        <td>{row.marketDepthGrade??(row.krakenPair?"WARMUP":"—")}</td>
        <td>{row.state==="DATA_STALE"?"STALE":row.reasonCodes.some(x=>x.includes("risk"))?"BLOCKED":row.personalExecutionPass===false?"EXECUTION":"—"}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}

function Inspector({row}:{row:EngineRow|null}) {
  if(!row) return <aside className="inspector"><div className="eyebrow">SELECTED ASSET</div><p>Select a watchlist row.</p></aside>;
  const gap=row.priceUsd&&row.intendedLimitPrice?((row.intendedLimitPrice/row.priceUsd-1)*100):null;
  return <aside className="inspector">
    <div className="eyebrow">SELECTED ASSET · #{row.rank}</div>
    <div className="assetTitle"><h2>{row.symbol}</h2><span>{row.name}</span></div>
    <div className={`decision decision-${row.state.toLowerCase()}`}>{stateLabel(row.state)}</div>
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
        <div><dt>Catch-up quality</dt><dd>{row.catchUpQuality?row.catchUpQuality.toFixed(0):"—"}</dd></div>
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

export function App() {
  const [nav,setNav]=useState<Nav>("ENGINE");
  const [snapshot,setSnapshot]=useState<EngineSnapshot|null>(null);
  const [selected,setSelected]=useState<string|null>(null);
  const [error,setError]=useState<string|null>(null);

  useEffect(()=>{
    let active=true;
    const load=async()=>{
      try{
        const response=await fetch("/api/engine",{cache:"no-store"});
        if(response.status===503){ if(active)setError("ENGINE WARMUP"); return; }
        if(!response.ok) throw new Error(`HTTP ${response.status}`);
        const body=EngineApiSuccessSchema.parse(await response.json());
        if(active){setSnapshot(body.snapshot);setError(null);setSelected(s=>s??body.snapshot.rows[0]?.symbol??null);}
      }catch(e){if(active)setError(e instanceof Error?e.message:String(e));}
    };
    void load();
    const timer=setInterval(()=>void load(),30_000);
    return()=>{active=false;clearInterval(timer);};
  },[]);

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
            ? `${snapshot.authority.newBuyEnabled?"LIVE":"AUTH BLOCKED"} · DATA ${ageLabel(dataAge)} · UPDATED ${new Date(snapshot.generatedAt).toLocaleTimeString()}`
            : "ENGINE WARMUP")}</div>
        </div>
        {snapshot?<EngineTable snapshot={snapshot} selected={selected} onSelect={setSelected}/>:<div className="emptyState">Collecting market context and Kraken execution data…</div>}
      </section>
      <Inspector row={selectedRow}/>
    </main>:<main className="placeholder"><div><div className="eyebrow">{nav}</div><h2>{nav} is being rebuilt on the canonical core.</h2><p>Engine comes first; this workspace will activate in its implementation milestone.</p></div></main>}
  </div>;
}
