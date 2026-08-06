import type { Trade } from "@/domain/types";

export interface PerformanceMetrics {
  total: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number;
  netPnl: number;
  netR: number;
  expectancyR: number;
  profitFactor: number;
  averageWinR: number;
  averageLossR: number;
  maxDrawdown: number;
  planAdherence: number;
  currentStreak: number;
  streakType: "Win" | "Loss" | "None";
}

export function calculateMetrics(trades: Trade[]): PerformanceMetrics {
  const ordered = [...trades].sort(
    (a, b) => new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime(),
  );
  const wins = ordered.filter((trade) => trade.result === "Win");
  const losses = ordered.filter((trade) => trade.result === "Loss");
  const breakeven = ordered.filter((trade) => trade.result === "Breakeven");
  const grossProfit = ordered.reduce(
    (sum, trade) => sum + Math.max(0, trade.pnl - trade.fees),
    0,
  );
  const grossLoss = Math.abs(
    ordered.reduce(
      (sum, trade) => sum + Math.min(0, trade.pnl - trade.fees),
      0,
    ),
  );
  const netPnl = ordered.reduce(
    (sum, trade) => sum + trade.pnl - trade.fees,
    0,
  );
  const netR = ordered.reduce((sum, trade) => sum + trade.rMultiple, 0);

  let equity = 0;
  let peak = 0;
  let maxDrawdown = 0;
  ordered.forEach((trade) => {
    equity += trade.pnl - trade.fees;
    peak = Math.max(peak, equity);
    maxDrawdown = Math.max(maxDrawdown, peak - equity);
  });

  let currentStreak = 0;
  let streakType: PerformanceMetrics["streakType"] = "None";
  for (let index = ordered.length - 1; index >= 0; index -= 1) {
    const result = ordered[index].result;
    if (result === "Breakeven") break;
    if (streakType === "None") streakType = result;
    if (result !== streakType) break;
    currentStreak += 1;
  }

  return {
    total: ordered.length,
    wins: wins.length,
    losses: losses.length,
    breakeven: breakeven.length,
    winRate: ordered.length ? (wins.length / ordered.length) * 100 : 0,
    netPnl,
    netR,
    expectancyR: ordered.length ? netR / ordered.length : 0,
    profitFactor: grossLoss
      ? grossProfit / grossLoss
      : grossProfit
        ? Number.POSITIVE_INFINITY
        : 0,
    averageWinR: wins.length
      ? wins.reduce((sum, trade) => sum + trade.rMultiple, 0) / wins.length
      : 0,
    averageLossR: losses.length
      ? losses.reduce((sum, trade) => sum + trade.rMultiple, 0) / losses.length
      : 0,
    maxDrawdown,
    planAdherence: ordered.length
      ? (ordered.filter((trade) => trade.followedPlan).length /
          ordered.length) *
        100
      : 0,
    currentStreak,
    streakType,
  };
}

export function createEquityCurve(trades: Trade[], startingBalance: number) {
  let balance = startingBalance;
  return [
    { index: 0, label: "Start", balance, pnl: 0 },
    ...[...trades]
      .sort(
        (a, b) =>
          new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime(),
      )
      .map((trade, index) => {
        const pnl = trade.pnl - trade.fees;
        balance += pnl;
        return {
          index: index + 1,
          label: new Date(trade.openedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          balance: Number(balance.toFixed(2)),
          pnl,
        };
      }),
  ];
}

export interface SegmentPerformance {
  name: string;
  trades: number;
  winRate: number;
  netR: number;
  pnl: number;
}

export function groupPerformance(
  trades: Trade[],
  selector: (trade: Trade) => string,
): SegmentPerformance[] {
  const groups = new Map<string, Trade[]>();
  trades.forEach((trade) => {
    const key = selector(trade) || "Unspecified";
    groups.set(key, [...(groups.get(key) ?? []), trade]);
  });
  return [...groups.entries()]
    .map(([name, values]) => ({
      name,
      trades: values.length,
      winRate: values.length
        ? (values.filter((trade) => trade.result === "Win").length /
            values.length) *
          100
        : 0,
      netR: values.reduce((sum, trade) => sum + trade.rMultiple, 0),
      pnl: values.reduce((sum, trade) => sum + trade.pnl - trade.fees, 0),
    }))
    .sort((a, b) => b.netR - a.netR);
}

export function dailyRiskUsed(trades: Trade[], day: string): number {
  return trades
    .filter((trade) => trade.openedAt.slice(0, 10) === day)
    .reduce((sum, trade) => sum + Math.max(0, trade.riskAmount), 0);
}
