const rows = [
  ["—","AAVE","DATA WARMUP","—","—","—","—","—"],
  ["—","LINK","DATA WARMUP","—","—","—","—","—"],
  ["—","COMP","DATA WARMUP","—","—","—","—","—"],
];

export function App() {
  return <div className="shell">
    <header className="topbar">
      <div>
        <div className="eyebrow">ZOBIRIS CORE</div>
        <h1>ENGINE</h1>
      </div>
      <div className="telemetry">
        <span>MARKET <b>WARMUP</b></span>
        <span>KRAKEN <b>OFFLINE</b></span>
        <span>WATCHLIST <b>—</b></span>
        <span>QUALIFIED <b>—</b></span>
      </div>
    </header>
    <main className="workspace">
      <section className="rankings">
        <div className="sectionHead">
          <div><h2>Watchlist Rankings</h2><p>Every tracked coin stays visible. Recommendation authority arrives only after data gates pass.</p></div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Coin</th><th>State</th><th>Price</th><th>Limit Entry</th><th>7D</th><th>30D</th><th>90D</th></tr></thead>
          <tbody>{rows.map((r)=><tr key={r[1]}>{r.map((v,i)=><td key={i} className={i===2?"state":""}>{v}</td>)}</tr>)}</tbody>
        </table>
      </section>
      <aside className="inspector">
        <div className="eyebrow">SELECTED ASSET</div>
        <h2>AAVE</h2>
        <div className="decision">DATA WARMUP</div>
        <dl>
          <div><dt>Current price</dt><dd>—</dd></div>
          <div><dt>Zobiris entry</dt><dd>—</dd></div>
          <div><dt>Catch-up quality</dt><dd>—</dd></div>
          <div><dt>Kraken liquidity</dt><dd>—</dd></div>
        </dl>
        <div className="divider" />
        <h3>Why</h3>
        <p>Market and execution data have not been connected to the rebuilt engine yet.</p>
      </aside>
    </main>
  </div>;
}
