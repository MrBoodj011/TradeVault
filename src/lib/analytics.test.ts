import { describe, expect, it } from "vitest";
import {
  calculateMetrics,
  createEquityCurve,
  groupPerformance,
} from "./analytics";
import { createDemoData } from "@/domain/demo-data";

describe("trading analytics", () => {
  const data = createDemoData();

  it("calculates performance without producing invalid values", () => {
    const metrics = calculateMetrics(data.trades);
    expect(metrics.total).toBe(12);
    expect(metrics.winRate).toBeGreaterThan(0);
    expect(metrics.netR).toBeCloseTo(12.25);
    expect(metrics.profitFactor).toBeGreaterThan(1);
    expect(Number.isFinite(metrics.maxDrawdown)).toBe(true);
  });

  it("creates an equity point for every trade plus the opening balance", () => {
    const curve = createEquityCurve(data.trades, 10_000);
    expect(curve).toHaveLength(data.trades.length + 1);
    expect(curve[0].balance).toBe(10_000);
  });

  it("groups performance by setup", () => {
    const groups = groupPerformance(data.trades, (trade) => trade.setup);
    expect(groups).toHaveLength(2);
    expect(groups[0].trades + groups[1].trades).toBe(data.trades.length);
  });
});
