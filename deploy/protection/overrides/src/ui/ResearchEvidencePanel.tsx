import { useEffect, useState } from "react";
export function useResearchEvidence() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let busy = false;
    const load = async () => {
      if (busy) return;
      busy = true;
      try {
        const r = await fetch("/api/research/evidence", {
          signal: controller.signal,
        });
        if (!r.ok) throw Error();
        const body = await r.json();
        if (!controller.signal.aborted) {
          setData(body);
          setError(false);
        }
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        busy = false;
      }
    };
    void load();
    const timer = setInterval(load, 60000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, []);
  return { data, error };
}
const date = (value: string | null) =>
  value ? new Date(value).toLocaleString() : "Unknown";
export function ResearchEvidenceContent({
  data,
  symbol,
}: {
  data: any;
  symbol?: string;
}) {
  const rows = (data?.assets ?? []).filter(
    (a: any) => !symbol || a.symbol === symbol,
  );
  const visible = rows.filter((a: any) => a.evidence?.length);
  return (
    <section className="daily-brief" aria-label="News and social investigation">
      <span className="visual-kicker">NEWS & SOCIAL INVESTIGATION</span>
      <h2>
        {symbol ? `${symbol}: what changed` : "Evidence requiring attention"}
      </h2>
      <p className="visual-muted">
        Research review flags are separate from investment rankings. Token
        demand, entry price and portfolio fit still need evaluation.
      </p>
      <p className="visual-footnote">Automatic feed connections</p>
      <div className="brief-returns">
        {(data?.providers ?? []).map((p: any) => (
          <div key={p.provider}>
            <strong>{p.provider}</strong>
            <span>
              {p.status === "NOT_CONFIGURED" ? "Not configured" : p.status}
            </span>
          </div>
        ))}
      </div>
      <p className="visual-footnote">
        Research available for {visible.length} of {rows.length} displayed assets. Last evidence received: {date(data?.asOf ?? null)}. Imported research is
        not continuous monitoring.
      </p>
      {!visible.length ? (
        <p>
          No research evidence collected{symbol ? ` for ${symbol}` : ""}. News
          and social attention are unavailable; absence of evidence is not low
          popularity.
        </p>
      ) : null}
      {visible.map((a: any) => (
        <details className="protection-details" key={a.symbol}>
          <summary>
            {a.symbol} ·{" "}
            {a.review?.status?.replaceAll("_", " ") ?? "Evidence incomplete"} ·{" "}
            {a.evidence.length} records
          </summary>
          <p>
            News: {a.newsStatus} · Social: {a.socialStatus}
          </p>
          <p>{a.review?.nextReviewCondition}</p>
          {a.review?.missingEvidence?.map((m: string) => (
            <p key={m} className="visual-muted">
              {m}
            </p>
          ))}
          {a.evidence.slice(0, 15).map((e: any) => (
            <article
              key={e.id}
              style={{
                borderTop: "1px solid #314965",
                padding: "12px 0",
                overflowWrap: "anywhere",
              }}
            >
              <strong>{e.summary}</strong>
              <p>{e.claim}</p>
              <p className="visual-muted">{e.relevance}</p>
              <p className="visual-footnote">
                {e.dataMode === "IMPORTED"
                  ? "Imported research"
                  : "Live provider observation"}{" "}
                · {e.verification} · {e.polarity}
                {Date.parse(e.expiresAt) <= Date.now() ? " · STALE" : ""}
              </p>
              <p className="visual-footnote">
                Published: {date(e.publishedAt)} · Retrieved:{" "}
                {date(e.retrievedAt)}
              </p>
              <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer">
                Read source
              </a>
              {e.verificationSourceUrl &&
              e.verificationSourceUrl !== e.sourceUrl ? (
                <a
                  href={e.verificationSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {" "}
                  · Verification source
                </a>
              ) : null}
            </article>
          ))}
        </details>
      ))}
    </section>
  );
}
export function ResearchEvidencePanel({
  data,
  error,
  symbol,
}: {
  data: any;
  error?: boolean;
  symbol?: string;
}) {
  if (error)
    return (
      <section className="daily-brief">
        <h2>News & social investigation</h2>
        <p>Research refresh failed. Evidence freshness cannot be confirmed.</p>
      </section>
    );
  if (!data)
    return (
      <section className="daily-brief">
        <p>Loading research coverage…</p>
      </section>
    );
  return <ResearchEvidenceContent data={data} symbol={symbol} />;
}
