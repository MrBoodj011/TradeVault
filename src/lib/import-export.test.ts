import { describe, expect, it } from "vitest";
import { createDemoData } from "@/domain/demo-data";
import {
  exportTradesCsv,
  importTradesCsv,
  parseTradeVaultJson,
} from "./import-export";

describe("TradeVault import and export", () => {
  it("escapes values that spreadsheet software may execute", () => {
    const data = createDemoData();
    data.trades[0].notes = '=HYPERLINK("https://example.test")';
    expect(exportTradesCsv(data)).toContain("'=HYPERLINK");
  });

  it("round-trips valid JSON backups", () => {
    const data = createDemoData();
    expect(parseTradeVaultJson(JSON.stringify(data)).trades).toHaveLength(
      data.trades.length,
    );
  });

  it("rejects invalid CSV rows without importing partial garbage", () => {
    const result = importTradesCsv(
      "symbol,rMultiple,pnl\n,not-a-number,broken",
    );
    expect(result.trades).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
  });
});
