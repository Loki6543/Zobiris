export type HoldingSeed = {
  symbol: string;
  name: string;
  quantity: number;
  avgPriceUsd: number | null;
  fallbackPriceUsd: number;
};

export type OrderSeed = {
  side: "BUY" | "SELL";
  symbol: string;
  name: string;
  targetPriceUsd: number;
  amountUsd: number;
};

export type TradeMemory = {
  id: string;
  at: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  usd: number | null;
  orderType: "MARKET" | "LIMIT" | "INSTANT" | "INSTANT_MICRO";
  source: "Kraken trades export" | "Kraken ledger screenshot";
};

export const PORTFOLIO_CAPTURED_AT = "2026-09-24T19:29:00-07:00";
export const CASH_BEFORE_INFLOW_USD = 513.74;
export const CASH_INFLOW_USD = 200;
export const CASH_UPDATED_AT = "2026-09-25";
export const CASH_USD = CASH_BEFORE_INFLOW_USD + CASH_INFLOW_USD;

export const MANEUVER_CAPITAL_USD = 1850;
export const PROBE_TYPICAL_USD = MANEUVER_CAPITAL_USD * 0.02;
export const PROBE_MAX_USD = MANEUVER_CAPITAL_USD * 0.025;
export const STATE_DEPLOYMENT_CAPS_USD = {
  UNCERTAIN: MANEUVER_CAPITAL_USD * 0.15,
  DELEVERAGED_ACCUMULATION: MANEUVER_CAPITAL_USD * 0.55,
  BROAD_EXPANSION: MANEUVER_CAPITAL_USD * 0.85,
  LEVERAGED_EXPANSION: MANEUVER_CAPITAL_USD * 0.45,
  EUPHORIA: MANEUVER_CAPITAL_USD * 0.10,
  DETERIORATION: MANEUVER_CAPITAL_USD * 0.10,
  CAPITULATION: MANEUVER_CAPITAL_USD * 0.35,
  SYSTEMIC_BREAK: 0,
} as const;

export const HOLDINGS: HoldingSeed[] = [
  { symbol: "KAS", name: "Kaspa", quantity: 424.939, avgPriceUsd: 0.03, fallbackPriceUsd: 0.03975 },
  { symbol: "SOL", name: "Solana", quantity: 0.47815, avgPriceUsd: 100.56, fallbackPriceUsd: 116.97 },
  { symbol: "LINK", name: "Chainlink", quantity: 2.01255, avgPriceUsd: 12.11, fallbackPriceUsd: 13.28 },
  { symbol: "BTC", name: "Bitcoin", quantity: 0.00029, avgPriceUsd: 77372.35, fallbackPriceUsd: 84276.10 },
  { symbol: "AAVE", name: "Aave", quantity: 0.09220, avgPriceUsd: 133.45, fallbackPriceUsd: 145.10 },
  { symbol: "EGLD", name: "MultiversX", quantity: 9.47748, avgPriceUsd: 4.22, fallbackPriceUsd: 4.47 },
  { symbol: "ETH", name: "Ethereum", quantity: 0.01671, avgPriceUsd: 2573.24, fallbackPriceUsd: 2677.15 },
];

export const OPEN_ORDERS: OrderSeed[] = [
  { side: "BUY", symbol: "QNT", name: "Quant", targetPriceUsd: 64.25, amountUsd: 22 },
  { side: "BUY", symbol: "QNT", name: "Quant", targetPriceUsd: 65.50, amountUsd: 18 },
  { side: "BUY", symbol: "HBAR", name: "Hedera", targetPriceUsd: 0.08699, amountUsd: 22 },
  { side: "BUY", symbol: "XRP", name: "XRP", targetPriceUsd: 1.44, amountUsd: 40 },
  { side: "SELL", symbol: "ETH", name: "Ethereum", targetPriceUsd: 2790, amountUsd: 12 },
  { side: "SELL", symbol: "SOL", name: "Solana", targetPriceUsd: 124, amountUsd: 18 },
  { side: "SELL", symbol: "SOL", name: "Solana", targetPriceUsd: 120, amountUsd: 12 },
];

export const TRADE_MEMORY: TradeMemory[] = [
  { id:"TVRPMC-2PEM5-PUN72P",at:"2026-09-05T02:49:58Z",symbol:"ONDO",side:"BUY",quantity:244.1582,usd:90,orderType:"MARKET",source:"Kraken trades export" },
  { id:"TB2WTQ-ELZ5N-P4AFF3",at:"2026-09-05T02:53:28Z",symbol:"KAS",side:"BUY",quantity:2358.853,usd:70,orderType:"MARKET",source:"Kraken trades export" },
  { id:"TAFFQ3-2JN33-EANAR6",at:"2026-09-05T02:54:48Z",symbol:"SUI",side:"BUY",quantity:78.4724,usd:60,orderType:"MARKET",source:"Kraken trades export" },
  { id:"TKJJAL-2MEKO-FGPS7W",at:"2026-09-05T02:56:21Z",symbol:"TAO",side:"BUY",quantity:0.2626,usd:60,orderType:"MARKET",source:"Kraken trades export" },
  { id:"TGI3HB-YJOFZ-7NQ4EV",at:"2026-09-05T04:28:05Z",symbol:"RENDER",side:"BUY",quantity:19.1448,usd:27.76,orderType:"LIMIT",source:"Kraken trades export" },
  { id:"TEJJXU-NOWEW-Z53IU5",at:"2026-09-06T02:42:23Z",symbol:"DYDX",side:"BUY",quantity:265.4867,usd:30,orderType:"LIMIT",source:"Kraken trades export" },
  { id:"TZM5TD-NUJZE-TJ3OJQ",at:"2026-09-07T02:32:16Z",symbol:"TAO",side:"SELL",quantity:0.04,usd:10.8773,orderType:"LIMIT",source:"Kraken trades export" },
  { id:"TOXVUS-MV2XH-UP7XXU",at:"2026-09-07T02:47:04Z",symbol:"TAO",side:"SELL",quantity:0.0756,usd:20.8401,orderType:"MARKET",source:"Kraken trades export" },
  { id:"TEUNMF-OMTNJ-3DG2NY",at:"2026-09-07T08:46:02Z",symbol:"KAS",side:"SELL",quantity:919.9527,usd:31.9592,orderType:"MARKET",source:"Kraken trades export" },
  { id:"TARM4G-NL6VS-3V5X46",at:"2026-09-07T15:40:32Z",symbol:"XRP",side:"BUY",quantity:22.2222,usd:30.6667,orderType:"LIMIT",source:"Kraken trades export" },
  { id:"TO4UOK-S7HCA-AJ23SG",at:"2026-09-07T15:40:40Z",symbol:"AAVE",side:"BUY",quantity:0.2372,usd:31,orderType:"LIMIT",source:"Kraken trades export" },
  { id:"TOMVJK-Q7PMR-HXJCQV",at:"2026-09-07T15:41:13Z",symbol:"TAO",side:"BUY",quantity:0.1,usd:25.5,orderType:"LIMIT",source:"Kraken trades export" },
  { id:"T4LAY6-EWWNF-LIWAJ7",at:"2026-09-08T13:36:07Z",symbol:"RENDER",side:"BUY",quantity:10.0671,usd:15,orderType:"LIMIT",source:"Kraken trades export" },
  { id:"TLNTZQ-WYXML-SW4E6B",at:"2026-09-09T01:46:58Z",symbol:"DYDX",side:"SELL",quantity:265.4867,usd:32.1797,orderType:"LIMIT",source:"Kraken trades export" },
  { id:"ledger-0910-btc-buy",at:"2026-09-10T22:43:00Z",symbol:"BTC",side:"BUY",quantity:0.00057698,usd:45,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0910-ondo-buy",at:"2026-09-10T22:48:00Z",symbol:"ONDO",side:"BUY",quantity:113.882,usd:40,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0910-render-buy",at:"2026-09-10T22:49:00Z",symbol:"RENDER",side:"BUY",quantity:25.8167,usd:37,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0910-kas-sell",at:"2026-09-10T23:14:00Z",symbol:"KAS",side:"SELL",quantity:283.452,usd:10,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0911-aave-buy",at:"2026-09-11T21:07:00Z",symbol:"AAVE",side:"BUY",quantity:0.14306,usd:18,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0912-cc-buy",at:"2026-09-12T01:48:00Z",symbol:"CC",side:"BUY",quantity:331.559,usd:33,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0912-bch-buy-unknown",at:"2026-09-12T04:23:00Z",symbol:"BCH",side:"BUY",quantity:0.09553393,usd:null,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0912-kas-sell-10",at:"2026-09-12T19:34:00Z",symbol:"KAS",side:"SELL",quantity:288.429,usd:10,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0912-ondo-sell",at:"2026-09-12T22:43:00Z",symbol:"ONDO",side:"SELL",quantity:358.04,usd:124.19,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0912-kas-sell-2972",at:"2026-09-12T22:44:00Z",symbol:"KAS",side:"SELL",quantity:859.659,usd:29.72,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0912-bch-sell-2099",at:"2026-09-12T22:44:30Z",symbol:"BCH",side:"SELL",quantity:0.0945658,usd:20.99,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0912-xrp-sell-2953",at:"2026-09-12T22:47:00Z",symbol:"XRP",side:"SELL",quantity:21.99408,usd:29.53,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0912-xrp-buy-2",at:"2026-09-12T22:48:00Z",symbol:"XRP",side:"BUY",quantity:1.44573,usd:2,orderType:"INSTANT_MICRO",source:"Kraken ledger screenshot" },
  { id:"ledger-0912-xrp-sell-224",at:"2026-09-12T22:49:00Z",symbol:"XRP",side:"SELL",quantity:1.67387,usd:2.24,orderType:"INSTANT_MICRO",source:"Kraken ledger screenshot" },
  { id:"ledger-0912-bch-buy-2",at:"2026-09-12T22:49:10Z",symbol:"BCH",side:"BUY",quantity:0.00873791,usd:2,orderType:"INSTANT_MICRO",source:"Kraken ledger screenshot" },
  { id:"ledger-0912-bch-sell-215",at:"2026-09-12T22:49:20Z",symbol:"BCH",side:"SELL",quantity:0.00970604,usd:2.15,orderType:"INSTANT_MICRO",source:"Kraken ledger screenshot" },
  { id:"ledger-0912-sui-sell",at:"2026-09-12T23:43:00Z",symbol:"SUI",side:"SELL",quantity:78.473,usd:55.98,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"TQ4WSN-43QJC-Y7LVAU",at:"2026-09-12T23:58:35Z",symbol:"LINK",side:"BUY",quantity:1.4095,usd:16.23,orderType:"MARKET",source:"Kraken trades export" },
  { id:"TRVISI-NVUJ2-P2FPRY",at:"2026-09-13T00:40:35Z",symbol:"BTC",side:"BUY",quantity:0.00033316,usd:25.72,orderType:"LIMIT",source:"Kraken trades export" },
  { id:"TLH5PA-S6L35-EW5V5W",at:"2026-09-13T01:25:40Z",symbol:"TAO",side:"SELL",quantity:0.2463,usd:57.4994,orderType:"LIMIT",source:"Kraken trades export" },
  { id:"ledger-0913-s-buy",at:"2026-09-13T02:01:00Z",symbol:"S",side:"BUY",quantity:1148.208,usd:32,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0913-render-sell",at:"2026-09-13T06:57:00Z",symbol:"RENDER",side:"SELL",quantity:54.952,usd:75.26,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0913-sol-buy",at:"2026-09-13T08:31:00Z",symbol:"SOL",side:"BUY",quantity:0.77565,usd:78,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0913-eth-buy",at:"2026-09-13T08:33:00Z",symbol:"ETH",side:"BUY",quantity:0.01115556,usd:28,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0913-btc-buy-25",at:"2026-09-13T09:24:00Z",symbol:"BTC",side:"BUY",quantity:0.00032529,usd:25,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0913-egld-buy",at:"2026-09-13T12:05:00Z",symbol:"EGLD",side:"BUY",quantity:9.47748,usd:40,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0915-tao-buy",at:"2026-09-15T08:11:00Z",symbol:"TAO",side:"BUY",quantity:0.09739,usd:22,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0915-kas-buy",at:"2026-09-15T18:42:00Z",symbol:"KAS",side:"BUY",quantity:1217.211,usd:40,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0915-aave-sell",at:"2026-09-15T18:47:00Z",symbol:"AAVE",side:"SELL",quantity:0.15643,usd:19,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0915-cc-sell",at:"2026-09-15T22:01:00Z",symbol:"CC",side:"SELL",quantity:166.926,usd:15,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0919-s-sell",at:"2026-09-19T02:04:00Z",symbol:"S",side:"SELL",quantity:499.707,usd:17,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0919-aave-buy",at:"2026-09-19T03:14:00Z",symbol:"AAVE",side:"BUY",quantity:0.07471,usd:11,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0919-tao-buy",at:"2026-09-19T09:11:00Z",symbol:"TAO",side:"BUY",quantity:0.05347,usd:14,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0919-link-buy",at:"2026-09-19T10:25:00Z",symbol:"LINK",side:"BUY",quantity:1.74563,usd:22,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0919-kas-sell",at:"2026-09-19T15:12:00Z",symbol:"KAS",side:"SELL",quantity:524.938,usd:21,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0920-cc-sell",at:"2026-09-20T02:44:00Z",symbol:"CC",side:"SELL",quantity:94.227,usd:10,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0920-sol-sell",at:"2026-09-20T02:56:00Z",symbol:"SOL",side:"SELL",quantity:0.29781,usd:32,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0920-s-sell",at:"2026-09-20T05:27:00Z",symbol:"S",side:"SELL",quantity:598.534,usd:20.36,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0920-aave-sell",at:"2026-09-20T08:50:00Z",symbol:"AAVE",side:"SELL",quantity:0.12556,usd:17,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0920-s-sell-micro",at:"2026-09-20T12:47:00Z",symbol:"S",side:"SELL",quantity:76.705,usd:2.63,orderType:"INSTANT_MICRO",source:"Kraken ledger screenshot" },
  { id:"ledger-0920-s-buy-micro",at:"2026-09-20T12:47:10Z",symbol:"S",side:"BUY",quantity:27.55932,usd:1,orderType:"INSTANT_MICRO",source:"Kraken ledger screenshot" },
  { id:"ledger-0920-cc-sell-718",at:"2026-09-20T16:32:00Z",symbol:"CC",side:"SELL",quantity:66.871,usd:7.18,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0921-eth-buy",at:"2026-09-21T00:21:00Z",symbol:"ETH",side:"BUY",quantity:0.00555497,usd:15,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0921-tao-sell-13",at:"2026-09-21T08:21:00Z",symbol:"TAO",side:"SELL",quantity:0.04701,usd:13,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0921-btc-sell-31",at:"2026-09-21T08:38:00Z",symbol:"BTC",side:"SELL",quantity:0.00037433,usd:31,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0921-btc-sell-15a",at:"2026-09-21T12:06:00Z",symbol:"BTC",side:"SELL",quantity:0.00017691,usd:15,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0921-link-sell",at:"2026-09-21T13:06:00Z",symbol:"LINK",side:"SELL",quantity:1.14257,usd:15,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0921-tao-sell-10",at:"2026-09-21T16:57:00Z",symbol:"TAO",side:"SELL",quantity:0.03555,usd:10,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0921-kas-sell-12",at:"2026-09-21T20:10:00Z",symbol:"KAS",side:"SELL",quantity:267.334,usd:12,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0921-btc-sell-15b",at:"2026-09-21T20:26:00Z",symbol:"BTC",side:"SELL",quantity:0.00017257,usd:15,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0922-tao-sell",at:"2026-09-22T05:37:00Z",symbol:"TAO",side:"SELL",quantity:0.06798,usd:21.57,orderType:"INSTANT",source:"Kraken ledger screenshot" },
  { id:"ledger-0923-aave-sell",at:"2026-09-23T01:13:00Z",symbol:"AAVE",side:"SELL",quantity:0.08076,usd:12,orderType:"INSTANT",source:"Kraken ledger screenshot" }
];

export const LEARNING_RULES = [
  { title: "Prefer planned limits to clustered market buys", detail: "Four market entries were opened within minutes on Sep 5. The engine should slow new entries and stage them instead of stacking correlated risk." },
  { title: "Partial harvesting has worked", detail: "KAS and TAO both produced profitable partial exits. Preserve a runner instead of treating every winner as all-in or all-out." },
  { title: "Re-entry needs a deeper pullback", detail: "TAO was harvested well, then re-entered high enough to give back part of the first cycle. Recent winners get a larger re-entry discount." },
  { title: "Limit-order discipline gets extra weight", detail: "DYDX is the cleanest early closed example: limit entry, limit exit, positive spread. New-position ideas default to limits rather than market orders." }
];
