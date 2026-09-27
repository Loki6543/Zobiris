export type KrakenPairStatus = "online" | "cancel_only" | "post_only" | string;

export interface KrakenPairRaw {
  altname?: string;
  wsname?: string;
  base?: string;
  quote?: string;
  status?: KrakenPairStatus;
  ordermin?: string;
  costmin?: string;
  tick_size?: string;
  pair_decimals?: number;
  lot_decimals?: number;
}

export interface KrakenUsdInstrument {
  symbol: string;
  pairKey: string;
  altname: string | null;
  wsname: string | null;
  status: KrakenPairStatus;
  online: boolean;
  orderMin: number | null;
  costMinUsd: number | null;
  tickSize: number | null;
  pairDecimals: number | null;
  lotDecimals: number | null;
}

const ALIASES: Record<string, string> = {
  XBT: "BTC",
  XXBT: "BTC",
  XDG: "DOGE",
  XXDG: "DOGE",
  ZUSD: "USD",
  USD: "USD",
};

function finite(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function canonicalSymbol(value: string): string {
  const upper = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return ALIASES[upper] ?? upper.replace(/^X(?=[A-Z]{3,5}$)/, "");
}

function symbolsFromPair(pairKey: string, pair: KrakenPairRaw): { base: string; quote: string } | null {
  if (pair.wsname?.includes("/")) {
    const [base, quote] = pair.wsname.split("/");
    if (base && quote) return { base: canonicalSymbol(base), quote: canonicalSymbol(quote) };
  }

  const base = pair.base ? canonicalSymbol(pair.base) : null;
  const quote = pair.quote ? canonicalSymbol(pair.quote) : null;
  if (base && quote) return { base, quote };

  const alt = pair.altname?.toUpperCase();
  if (alt?.endsWith("USD")) return { base: canonicalSymbol(alt.slice(0, -3)), quote: "USD" };
  if (pairKey.toUpperCase().endsWith("USD")) return { base: canonicalSymbol(pairKey.slice(0, -3)), quote: "USD" };
  return null;
}

export function buildUsdInstrumentRegistry(raw: Record<string, KrakenPairRaw>): Map<string, KrakenUsdInstrument> {
  const registry = new Map<string, KrakenUsdInstrument>();

  for (const [pairKey, pair] of Object.entries(raw)) {
    const symbols = symbolsFromPair(pairKey, pair);
    if (!symbols || symbols.quote !== "USD") continue;

    const instrument: KrakenUsdInstrument = {
      symbol: symbols.base,
      pairKey,
      altname: pair.altname ?? null,
      wsname: pair.wsname ?? null,
      status: pair.status ?? "unknown",
      online: pair.status === "online",
      orderMin: finite(pair.ordermin),
      costMinUsd: finite(pair.costmin),
      tickSize: finite(pair.tick_size),
      pairDecimals: Number.isInteger(pair.pair_decimals) ? pair.pair_decimals! : null,
      lotDecimals: Number.isInteger(pair.lot_decimals) ? pair.lot_decimals! : null,
    };

    const prior = registry.get(instrument.symbol);
    if (!prior || (!prior.online && instrument.online)) registry.set(instrument.symbol, instrument);
  }

  return registry;
}

export type WatchlistInstrumentState =
  | { symbol: string; state: "ACTIVE"; instrument: KrakenUsdInstrument }
  | { symbol: string; state: "NO_KRAKEN_USD_MARKET"; instrument: null }
  | { symbol: string; state: "KRAKEN_MARKET_NOT_ONLINE"; instrument: KrakenUsdInstrument }
  | { symbol: string; state: "KRAKEN_IDENTITY_UNVERIFIED"; instrument: KrakenUsdInstrument; reason: string }
  | { symbol: string; state: "KRAKEN_ASSET_MISMATCH"; instrument: KrakenUsdInstrument; referencePrice: number; krakenPrice: number; gapPct: number };

export function resolveWatchlistInstruments(symbols: string[], registry: Map<string, KrakenUsdInstrument>): WatchlistInstrumentState[] {
  return symbols.map((raw) => {
    const symbol = canonicalSymbol(raw);
    const instrument = registry.get(symbol) ?? null;
    if (!instrument) return { symbol, state: "NO_KRAKEN_USD_MARKET", instrument };
    if (!instrument.online) return { symbol, state: "KRAKEN_MARKET_NOT_ONLINE", instrument };
    return { symbol, state: "ACTIVE", instrument };
  });
}


export function snapBuyLimitToTick(price:number|null,tickSize:number|null):number|null {
  if(price==null || !Number.isFinite(price) || price<=0) return null;
  if(tickSize==null || !Number.isFinite(tickSize) || tickSize<=0) return price;
  const steps=Math.floor((price+tickSize*1e-9)/tickSize);
  const snapped=steps*tickSize;
  const decimals=Math.min(12,Math.max(0,Math.ceil(-Math.log10(tickSize))+2));
  return Number(snapped.toFixed(decimals));
}


export interface KrakenIdentityTicker {
  pairKey:string;
  bid:number|null;
  ask:number|null;
  last:number|null;
}

export function verifyKrakenInstrumentPrices(
  states:WatchlistInstrumentState[],
  referencePrices:Map<string,number>,
  tickers:Map<string,KrakenIdentityTicker>,
  maxGapPct=0.10,
):WatchlistInstrumentState[] {
  return states.map(state=>{
    if(state.state!=="ACTIVE") return state;
    const referencePrice=referencePrices.get(state.symbol);
    if(referencePrice==null || !Number.isFinite(referencePrice) || referencePrice<=0) {
      return {symbol:state.symbol,state:"KRAKEN_IDENTITY_UNVERIFIED",instrument:state.instrument,reason:"reference_price_missing"};
    }
    const ticker=tickers.get(state.instrument.pairKey);
    if(!ticker) {
      return {symbol:state.symbol,state:"KRAKEN_IDENTITY_UNVERIFIED",instrument:state.instrument,reason:"kraken_ticker_missing"};
    }
    const krakenPrice=ticker.bid!=null&&ticker.ask!=null&&ticker.bid>0&&ticker.ask>0
      ? (ticker.bid+ticker.ask)/2
      : ticker.last;
    if(krakenPrice==null || !Number.isFinite(krakenPrice) || krakenPrice<=0) {
      return {symbol:state.symbol,state:"KRAKEN_IDENTITY_UNVERIFIED",instrument:state.instrument,reason:"kraken_price_missing"};
    }
    const gapPct=Math.abs(krakenPrice-referencePrice)/referencePrice;
    if(gapPct>maxGapPct) {
      return {symbol:state.symbol,state:"KRAKEN_ASSET_MISMATCH",instrument:state.instrument,referencePrice,krakenPrice,gapPct};
    }
    return state;
  });
}
