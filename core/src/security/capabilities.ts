export const CAPABILITY_MANIFEST = {
  marketDataRead:true,
  exchangePrivateRead:false,
  exchangeBalancesRead:false,
  exchangeOpenOrdersRead:false,
  exchangeTradeHistoryRead:false,
  exchangeExecutionStreamRead:false,

  exchangeOrderSubmission:false,
  exchangeOrderModification:false,
  exchangeOrderCancellation:false,
  exchangeFundTransfer:false,
  exchangeWithdrawal:false,
  walletKeyAccess:false,
  walletSigning:false,
  transactionBroadcast:false,
} as const;

export type CapabilityName=keyof typeof CAPABILITY_MANIFEST;

export const FORBIDDEN_CAPABILITIES:CapabilityName[]=[
  "exchangeOrderSubmission",
  "exchangeOrderModification",
  "exchangeOrderCancellation",
  "exchangeFundTransfer",
  "exchangeWithdrawal",
  "walletKeyAccess",
  "walletSigning",
  "transactionBroadcast",
];
