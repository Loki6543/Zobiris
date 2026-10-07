export type HorizonCode = "T1" | "P2" | "L3";

export interface CoinTimeOutlook {
  symbol: string;
  horizon: HorizonCode;
  status: "CORE" | "L3_CANDIDATE" | "POSITION" | "REVIEW" | "TACTICAL";
  protected: boolean;
  role: string;
  reviewCadence: string;
  exitPolicy: string;
}

export const HORIZON_META: Record<HorizonCode, {
  title: string;
  window: string;
  reviewCadence: string;
  rule: string;
}> = {
  L3: {
    title: "L3 — Long-Term Core",
    window: "3–18+ months",
    reviewCadence: "Weekly / monthly",
    rule: "Routine weekly volatility, ordinary profit targets, RSI/MACD changes, or a normal pullback do not create a sell recommendation.",
  },
  P2: {
    title: "P2 — Position",
    window: "2–12 weeks",
    reviewCadence: "2–3× weekly",
    rule: "Hold while the medium-term thesis and trend remain valid. Adds and exits still require current evidence.",
  },
  T1: {
    title: "T1 — Tactical",
    window: "3–14 days",
    reviewCadence: "Daily",
    rule: "Entry quality and short-term confirmation matter most. A failed tactical trade does not become a long-term investment by default.",
  },
};

export const TIME_OUTLOOK: CoinTimeOutlook[] = [
  { symbol: "BTC", horizon: "L3", status: "CORE", protected: true, role: "Core monetary / market anchor", reviewCadence: "Weekly / monthly", exitPolicy: "No routine harvest. Downgrade only after a documented thesis break, structural deterioration, or explicit user decision." },
  { symbol: "ETH", horizon: "L3", status: "CORE", protected: true, role: "Core smart-contract exposure", reviewCadence: "Weekly / monthly", exitPolicy: "No routine harvest. Downgrade only after a documented thesis break, structural deterioration, or explicit user decision." },
  { symbol: "SOL", horizon: "L3", status: "CORE", protected: true, role: "Core high-growth chain exposure", reviewCadence: "Weekly / monthly", exitPolicy: "No routine harvest from short-term strength alone. Downgrade to P2 before normal sell logic resumes." },

  { symbol: "TAO", horizon: "P2", status: "L3_CANDIDATE", protected: false, role: "High-conviction growth position; may graduate to L3", reviewCadence: "2–3× weekly", exitPolicy: "Position-trade rules apply until explicitly promoted to L3." },
  { symbol: "ONDO", horizon: "P2", status: "L3_CANDIDATE", protected: false, role: "RWA / tokenization position; may graduate to L3", reviewCadence: "2–3× weekly", exitPolicy: "Position-trade rules apply until explicitly promoted to L3." },

  { symbol: "BCH", horizon: "P2", status: "POSITION", protected: false, role: "Medium-term support / trend setup", reviewCadence: "2–3× weekly", exitPolicy: "Manage as a 2–12 week position unless the thesis is upgraded." },
  { symbol: "XDC", horizon: "P2", status: "POSITION", protected: false, role: "Medium-term trend / pullback position", reviewCadence: "2–3× weekly", exitPolicy: "Exit or reduce only when current P2 evidence weakens materially." },
  { symbol: "CC", horizon: "P2", status: "POSITION", protected: false, role: "Institutional-network / RWA position", reviewCadence: "2–3× weekly", exitPolicy: "Position-trade rules; not a protected long-term core holding." },
  { symbol: "KAS", horizon: "P2", status: "POSITION", protected: false, role: "Medium-term trend position", reviewCadence: "2–3× weekly", exitPolicy: "Manage as a position trade; do not average down solely because it is red." },
  { symbol: "HYPE", horizon: "P2", status: "POSITION", protected: false, role: "High-strength position setup", reviewCadence: "2–3× weekly", exitPolicy: "Hold while trend and structure remain intact." },
  { symbol: "TIA", horizon: "P2", status: "POSITION", protected: false, role: "Medium-term recovery / growth position", reviewCadence: "2–3× weekly", exitPolicy: "Position-trade rules; require fresh confirmation for adds." },
  { symbol: "HBAR", horizon: "P2", status: "POSITION", protected: false, role: "Medium-term network adoption position", reviewCadence: "2–3× weekly", exitPolicy: "Position-trade rules; no automatic promotion to long-term." },
  { symbol: "CRO", horizon: "P2", status: "POSITION", protected: false, role: "Medium-term recovery position", reviewCadence: "2–3× weekly", exitPolicy: "Position-trade rules." },
  { symbol: "ICP", horizon: "P2", status: "POSITION", protected: false, role: "Medium-term trend / recovery position", reviewCadence: "2–3× weekly", exitPolicy: "Position-trade rules." },
  { symbol: "XLM", horizon: "P2", status: "POSITION", protected: false, role: "Medium-term payments / recovery position", reviewCadence: "2–3× weekly", exitPolicy: "Position-trade rules." },
  { symbol: "ATOM", horizon: "P2", status: "POSITION", protected: false, role: "Medium-term ecosystem position", reviewCadence: "2–3× weekly", exitPolicy: "Position-trade rules." },
  { symbol: "APT", horizon: "P2", status: "POSITION", protected: false, role: "Medium-term recovery setup with dilution penalty", reviewCadence: "2–3× weekly", exitPolicy: "Position-trade rules; supply risk must remain part of the thesis." },
  { symbol: "GRAM", horizon: "P2", status: "REVIEW", protected: false, role: "Existing position under medium-term review", reviewCadence: "2–3× weekly", exitPolicy: "Do not treat as L3. Reassess if recovery confirmation fails." },
  { symbol: "EIGEN", horizon: "P2", status: "POSITION", protected: false, role: "Medium-term infrastructure position", reviewCadence: "2–3× weekly", exitPolicy: "Position-trade rules." },
  { symbol: "IMX", horizon: "P2", status: "POSITION", protected: false, role: "Medium-term gaming / infrastructure position", reviewCadence: "2–3× weekly", exitPolicy: "Position-trade rules; avoid chasing extension." },
  { symbol: "DOT", horizon: "P2", status: "REVIEW", protected: false, role: "Medium-term recovery candidate under review", reviewCadence: "2–3× weekly", exitPolicy: "Needs stabilization; not protected from position-level exits." },
  { symbol: "COMP", horizon: "P2", status: "REVIEW", protected: false, role: "Existing recovery thesis under review", reviewCadence: "2–3× weekly", exitPolicy: "No blind averaging and no conversion into L3 merely because it is below cost." },

  { symbol: "ZBCN", horizon: "T1", status: "TACTICAL", protected: false, role: "High-beta tactical / short position-trade bridge", reviewCadence: "Daily", exitPolicy: "Must earn a longer hold through confirmation." },
  { symbol: "DYDX", horizon: "T1", status: "TACTICAL", protected: false, role: "Tactical recovery trade", reviewCadence: "Daily", exitPolicy: "Do not turn a failed tactical entry into a long-term bag." },
  { symbol: "CHZ", horizon: "T1", status: "TACTICAL", protected: false, role: "Tactical recovery / momentum trade", reviewCadence: "Daily", exitPolicy: "Short-horizon rules until stronger evidence appears." },
  { symbol: "APE", horizon: "T1", status: "TACTICAL", protected: false, role: "Speculative tactical trade", reviewCadence: "Daily", exitPolicy: "Short-horizon rules; no automatic averaging down." },
  { symbol: "TEL", horizon: "T1", status: "TACTICAL", protected: false, role: "Higher-risk tactical / recovery trade", reviewCadence: "Daily", exitPolicy: "Must earn a longer hold through confirmation." },
  { symbol: "MON", horizon: "T1", status: "TACTICAL", protected: false, role: "High-upside tactical setup with dilution risk", reviewCadence: "Daily", exitPolicy: "Small sizing and short-horizon review." },
  { symbol: "KITE", horizon: "T1", status: "TACTICAL", protected: false, role: "Speculative tactical setup", reviewCadence: "Daily", exitPolicy: "Small sizing; graduate only after sustained confirmation." },
  { symbol: "BONK", horizon: "T1", status: "TACTICAL", protected: false, role: "Meme / high-beta tactical exposure", reviewCadence: "Daily", exitPolicy: "Tactical only." },
  { symbol: "SHIB", horizon: "T1", status: "TACTICAL", protected: false, role: "Meme tactical exposure", reviewCadence: "Daily", exitPolicy: "Tactical only." },
  { symbol: "DOGE", horizon: "T1", status: "TACTICAL", protected: false, role: "Large-cap meme tactical exposure", reviewCadence: "Daily", exitPolicy: "Tactical by default unless explicitly reclassified." },
  { symbol: "ORDI", horizon: "T1", status: "TACTICAL", protected: false, role: "High-volatility tactical setup", reviewCadence: "Daily", exitPolicy: "Tactical only." },
  { symbol: "ZRX", horizon: "T1", status: "TACTICAL", protected: false, role: "Smaller-cap tactical setup", reviewCadence: "Daily", exitPolicy: "Tactical only." },
  { symbol: "GALA", horizon: "T1", status: "TACTICAL", protected: false, role: "Speculative tactical recovery setup", reviewCadence: "Daily", exitPolicy: "Tactical only." },
  { symbol: "ASTER", horizon: "T1", status: "TACTICAL", protected: false, role: "Short-horizon recovery watch", reviewCadence: "Daily", exitPolicy: "Tactical only." },
  { symbol: "TLM", horizon: "T1", status: "TACTICAL", protected: false, role: "Very high-risk tactical watch", reviewCadence: "Daily", exitPolicy: "No long-term assumption." },
  { symbol: "DASH", horizon: "T1", status: "TACTICAL", protected: false, role: "Short-horizon recovery watch", reviewCadence: "Daily", exitPolicy: "Wait for stabilization; tactical only." },
  { symbol: "NEO", horizon: "T1", status: "TACTICAL", protected: false, role: "Short-horizon recovery watch", reviewCadence: "Daily", exitPolicy: "Tactical until stronger evidence appears." },
];

export function timeOutlookFor(symbol: string): CoinTimeOutlook | null {
  const normalized = symbol.trim().toUpperCase();
  return TIME_OUTLOOK.find((item) => item.symbol === normalized) ?? null;
}

export function isLongTermProtected(symbol: string): boolean {
  const outlook = timeOutlookFor(symbol);
  return outlook?.horizon === "L3" && outlook.protected;
}
