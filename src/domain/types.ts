export const markets = [
  "Forex",
  "Crypto",
  "Stocks",
  "Futures",
  "Options",
] as const;
export type Market = (typeof markets)[number];
export type TradeSide = "Long" | "Short";
export type TradeResult = "Win" | "Loss" | "Breakeven";
export type Confidence = 1 | 2 | 3 | 4 | 5;

export interface Trade {
  id: string;
  symbol: string;
  market: Market;
  side: TradeSide;
  setup: string;
  session: string;
  result: TradeResult;
  rMultiple: number;
  pnl: number;
  fees: number;
  riskAmount: number;
  entryPrice?: number;
  stopPrice?: number;
  targetPrice?: number;
  exitPrice?: number;
  openedAt: string;
  closedAt?: string;
  confidence: Confidence;
  followedPlan: boolean;
  emotion: string;
  mistake?: string;
  notes: string;
  screenshotUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PlaybookSetup {
  id: string;
  name: string;
  description: string;
  checklist: string[];
  active: boolean;
}

export interface TradingAccount {
  name: string;
  currency: "USD" | "EUR" | "GBP" | "MAD";
  startingBalance: number;
  riskLimitPercent: number;
  dailyLossLimitPercent: number;
}

export interface TradeVaultSettings {
  account: TradingAccount;
  privacyMode: boolean;
  encryptionEnabled: boolean;
  theme: "dark" | "light";
}

export interface TradeVaultData {
  schemaVersion: 1;
  trades: Trade[];
  playbook: PlaybookSetup[];
  settings: TradeVaultSettings;
  updatedAt: string;
}

export function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}
