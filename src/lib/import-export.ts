import Papa from "papaparse";
import { tradeVaultDataSchema } from "@/domain/schema";
import { createId, type Trade, type TradeVaultData } from "@/domain/types";

function safeSpreadsheetValue(value: string): string {
  return /^[=+\-@]/.test(value.trimStart()) ? `'${value}` : value;
}

export function exportTradesCsv(data: TradeVaultData): string {
  return Papa.unparse(
    data.trades.map((trade) => ({
      openedAt: trade.openedAt,
      symbol: safeSpreadsheetValue(trade.symbol),
      market: trade.market,
      side: trade.side,
      setup: safeSpreadsheetValue(trade.setup),
      session: safeSpreadsheetValue(trade.session),
      result: trade.result,
      rMultiple: trade.rMultiple,
      pnl: trade.pnl,
      fees: trade.fees,
      riskAmount: trade.riskAmount,
      confidence: trade.confidence,
      followedPlan: trade.followedPlan,
      emotion: safeSpreadsheetValue(trade.emotion),
      mistake: safeSpreadsheetValue(trade.mistake ?? ""),
      notes: safeSpreadsheetValue(trade.notes),
      tags: trade.tags.map(safeSpreadsheetValue).join("|"),
    })),
  );
}

interface CsvRow {
  openedAt?: string;
  symbol?: string;
  market?: string;
  side?: string;
  setup?: string;
  session?: string;
  result?: string;
  rMultiple?: string;
  pnl?: string;
  fees?: string;
  riskAmount?: string;
  confidence?: string;
  followedPlan?: string;
  emotion?: string;
  mistake?: string;
  notes?: string;
  tags?: string;
}

export function importTradesCsv(csv: string): {
  trades: Trade[];
  errors: string[];
} {
  if (csv.length > 10_000_000)
    throw new Error("CSV files are limited to 10 MB.");
  const result = Papa.parse<CsvRow>(csv, {
    header: true,
    skipEmptyLines: true,
  });
  const errors = result.errors.map(
    (error) => `Row ${error.row ?? "?"}: ${error.message}`,
  );
  const trades: Trade[] = [];
  result.data.slice(0, 100_000).forEach((row, index) => {
    const now = new Date().toISOString();
    const openedAt =
      row.openedAt && !Number.isNaN(Date.parse(row.openedAt))
        ? new Date(row.openedAt).toISOString()
        : now;
    const candidate: Trade = {
      id: createId("trade"),
      symbol: row.symbol?.trim().toUpperCase() ?? "",
      market: (["Forex", "Crypto", "Stocks", "Futures", "Options"].includes(
        row.market ?? "",
      )
        ? row.market
        : "Forex") as Trade["market"],
      side: row.side === "Short" ? "Short" : "Long",
      setup: row.setup?.trim() || "Imported",
      session: row.session?.trim() || "Unspecified",
      result: (["Win", "Loss", "Breakeven"].includes(row.result ?? "")
        ? row.result
        : "Breakeven") as Trade["result"],
      rMultiple: Number(row.rMultiple ?? 0),
      pnl: Number(row.pnl ?? 0),
      fees: Number(row.fees ?? 0),
      riskAmount: Number(row.riskAmount ?? 0),
      openedAt,
      confidence: Math.min(
        5,
        Math.max(1, Number(row.confidence ?? 3)),
      ) as Trade["confidence"],
      followedPlan: row.followedPlan?.toLowerCase() !== "false",
      emotion: row.emotion?.slice(0, 80) || "Unspecified",
      mistake: row.mistake?.slice(0, 200) || undefined,
      notes: row.notes?.slice(0, 2000) || "",
      tags: (row.tags ?? "")
        .split("|")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 20),
      createdAt: now,
      updatedAt: now,
    };
    const parsed =
      tradeVaultDataSchema.shape.trades.element.safeParse(candidate);
    if (parsed.success) trades.push(parsed.data);
    else errors.push(`Row ${index + 2}: invalid or missing trade fields.`);
  });
  return { trades, errors };
}

export function parseTradeVaultJson(text: string): TradeVaultData {
  if (text.length > 25_000_000)
    throw new Error("Backup files are limited to 25 MB.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }
  const result = tradeVaultDataSchema.safeParse(parsed);
  if (!result.success)
    throw new Error("The file does not match the TradeVault data schema.");
  return result.data;
}

export function downloadText(
  filename: string,
  value: string,
  type: string,
): void {
  const url = URL.createObjectURL(new Blob([value], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
