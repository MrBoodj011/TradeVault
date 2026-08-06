import type { Trade, TradeVaultData } from "./types";

const now = new Date();

function date(daysAgo: number, hour = 14): string {
  const value = new Date(now);
  value.setUTCDate(value.getUTCDate() - daysAgo);
  value.setUTCHours(hour, 0, 0, 0);
  return value.toISOString();
}

const samples: Array<
  Partial<Trade> & Pick<Trade, "symbol" | "result" | "rMultiple" | "pnl">
> = [
  { symbol: "EURUSD", result: "Win", rMultiple: 2.4, pnl: 240 },
  { symbol: "NQ", result: "Loss", rMultiple: -1, pnl: -110 },
  { symbol: "GBPUSD", result: "Win", rMultiple: 1.8, pnl: 185 },
  { symbol: "BTCUSD", result: "Breakeven", rMultiple: 0.05, pnl: 4 },
  { symbol: "ES", result: "Win", rMultiple: 3.1, pnl: 315 },
  { symbol: "EURUSD", result: "Loss", rMultiple: -0.8, pnl: -82 },
  { symbol: "XAUUSD", result: "Win", rMultiple: 2.2, pnl: 221 },
  { symbol: "GBPUSD", result: "Loss", rMultiple: -1, pnl: -104 },
  { symbol: "NQ", result: "Win", rMultiple: 1.6, pnl: 168 },
  { symbol: "EURUSD", result: "Win", rMultiple: 2.7, pnl: 278 },
  { symbol: "BTCUSD", result: "Loss", rMultiple: -0.7, pnl: -72 },
  { symbol: "XAUUSD", result: "Win", rMultiple: 1.9, pnl: 194 },
];

export function createDemoData(): TradeVaultData {
  const trades = samples.map((sample, index): Trade => {
    const timestamp = date((samples.length - index) * 3);
    const market = sample.symbol.includes("BTC")
      ? "Crypto"
      : ["NQ", "ES"].includes(sample.symbol)
        ? "Futures"
        : "Forex";
    return {
      id: `demo_${index + 1}`,
      symbol: sample.symbol,
      market,
      side: index % 3 === 0 ? "Short" : "Long",
      setup: index % 2 === 0 ? "Liquidity sweep" : "Break and retest",
      session: index % 3 === 0 ? "New York" : "London",
      result: sample.result,
      rMultiple: sample.rMultiple,
      pnl: sample.pnl,
      fees: market === "Crypto" ? 4 : 2,
      riskAmount: 100,
      openedAt: timestamp,
      closedAt: new Date(
        new Date(timestamp).getTime() + 90 * 60 * 1000,
      ).toISOString(),
      confidence: ((index % 5) + 1) as Trade["confidence"],
      followedPlan: index !== 1 && index !== 6,
      emotion: index % 4 === 0 ? "Focused" : "Calm",
      mistake: index === 1 ? "Entered before confirmation" : undefined,
      notes:
        index % 3 === 0
          ? "Clean execution after confirmation."
          : "Managed according to plan.",
      tags: index % 2 === 0 ? ["A-setup", "backtest"] : ["reviewed"],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  });

  return {
    schemaVersion: 1,
    trades,
    playbook: [
      {
        id: "setup_liquidity",
        name: "Liquidity sweep",
        description:
          "Sweep, displacement, then entry from a validated area of interest.",
        checklist: [
          "Higher-timeframe bias aligned",
          "Liquidity taken",
          "Displacement confirmed",
          "Minimum 2R available",
        ],
        active: true,
      },
      {
        id: "setup_retest",
        name: "Break and retest",
        description:
          "Structure break followed by a controlled retest and continuation signal.",
        checklist: [
          "Structure break closed",
          "Retest held",
          "Volume confirmed",
          "Invalidation is clear",
        ],
        active: true,
      },
    ],
    settings: {
      account: {
        name: "Primary account",
        currency: "USD",
        startingBalance: 10000,
        riskLimitPercent: 1,
        dailyLossLimitPercent: 3,
      },
      privacyMode: false,
      encryptionEnabled: false,
      theme: "dark",
    },
    updatedAt: new Date().toISOString(),
  };
}

export function createEmptyData(): TradeVaultData {
  const demo = createDemoData();
  return { ...demo, trades: [], updatedAt: new Date().toISOString() };
}
