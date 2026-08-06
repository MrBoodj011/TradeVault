import { z } from "zod";

const finiteNumber = z.number().finite();
const optionalPrice = finiteNumber.positive().optional();

export const tradeSchema = z.object({
  id: z.string().min(1).max(100),
  symbol: z.string().trim().min(1).max(20),
  market: z.enum(["Forex", "Crypto", "Stocks", "Futures", "Options"]),
  side: z.enum(["Long", "Short"]),
  setup: z.string().trim().min(1).max(80),
  session: z.string().trim().min(1).max(40),
  result: z.enum(["Win", "Loss", "Breakeven"]),
  rMultiple: finiteNumber.min(-100).max(100),
  pnl: finiteNumber.min(-100000000).max(100000000),
  fees: finiteNumber.min(0).max(1000000),
  riskAmount: finiteNumber.min(0).max(100000000),
  entryPrice: optionalPrice,
  stopPrice: optionalPrice,
  targetPrice: optionalPrice,
  exitPrice: optionalPrice,
  openedAt: z.iso.datetime(),
  closedAt: z.iso.datetime().optional(),
  confidence: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  followedPlan: z.boolean(),
  emotion: z.string().trim().max(80),
  mistake: z.string().trim().max(200).optional(),
  notes: z.string().max(2000),
  screenshotUrl: z.url().max(2000).optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(20),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const tradeVaultDataSchema = z.object({
  schemaVersion: z.literal(1),
  trades: z.array(tradeSchema).max(100000),
  playbook: z
    .array(
      z.object({
        id: z.string().min(1).max(100),
        name: z.string().trim().min(1).max(80),
        description: z.string().max(500),
        checklist: z.array(z.string().trim().min(1).max(160)).max(30),
        active: z.boolean(),
      }),
    )
    .max(100),
  settings: z.object({
    account: z.object({
      name: z.string().trim().min(1).max(80),
      currency: z.enum(["USD", "EUR", "GBP", "MAD"]),
      startingBalance: finiteNumber.min(0).max(1000000000),
      riskLimitPercent: finiteNumber.positive().max(100),
      dailyLossLimitPercent: finiteNumber.positive().max(100),
    }),
    privacyMode: z.boolean(),
    encryptionEnabled: z.boolean(),
    theme: z.enum(["dark", "light"]),
  }),
  updatedAt: z.iso.datetime(),
});
