'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export interface TradeInput {
  asset: string;
  entry_model: string;
  risk_reward: number;
  result: string;
  pnl_percentage: number;
  trade_date: string;
  notes?: string;
  screenshot_url?: string;
}

export async function getTrades() {
  try {
    const trades = await prisma.trade.findMany({
      orderBy: {
        trade_date: 'asc',
      },
    });
    
    // Map dates to string ISO format for client components compatibility
    return trades.map((t) => ({
      ...t,
      trade_date: t.trade_date.toISOString(),
      created_at: t.created_at.toISOString(),
    }));
  } catch (error) {
    console.error('Failed to get trades:', error);
    throw new Error('Database query failed');
  }
}

export async function addTrade(data: TradeInput) {
  try {
    const trade = await prisma.trade.create({
      data: {
        asset: data.asset,
        entry_model: data.entry_model,
        risk_reward: Number(data.risk_reward),
        result: data.result,
        pnl_percentage: Number(data.pnl_percentage),
        trade_date: new Date(data.trade_date),
        notes: data.notes || null,
        screenshot_url: data.screenshot_url || null,
      },
    });

    revalidatePath('/');
    return {
      ...trade,
      trade_date: trade.trade_date.toISOString(),
      created_at: trade.created_at.toISOString(),
    };
  } catch (error) {
    console.error('Failed to create trade:', error);
    throw new Error('Failed to create trade');
  }
}

export async function updateTrade(id: string, data: Partial<TradeInput>) {
  try {
    const trade = await prisma.trade.update({
      where: { id },
      data: {
        asset: data.asset,
        entry_model: data.entry_model,
        risk_reward: data.risk_reward !== undefined ? Number(data.risk_reward) : undefined,
        result: data.result,
        pnl_percentage: data.pnl_percentage !== undefined ? Number(data.pnl_percentage) : undefined,
        trade_date: data.trade_date ? new Date(data.trade_date) : undefined,
        notes: data.notes !== undefined ? (data.notes || null) : undefined,
        screenshot_url: data.screenshot_url !== undefined ? (data.screenshot_url || null) : undefined,
      },
    });

    revalidatePath('/');
    return {
      ...trade,
      trade_date: trade.trade_date.toISOString(),
      created_at: trade.created_at.toISOString(),
    };
  } catch (error) {
    console.error('Failed to update trade:', error);
    throw new Error('Failed to update trade');
  }
}

export async function deleteTrade(id: string) {
  try {
    await prisma.trade.delete({
      where: {
        id: id,
      },
    });
    
    revalidatePath('/');
  } catch (error) {
    console.error('Failed to delete trade:', error);
    throw new Error('Failed to delete trade');
  }
}

export async function clearAllTrades() {
  try {
    await prisma.trade.deleteMany({});
    revalidatePath('/');
  } catch (error) {
    console.error('Failed to clear trades:', error);
    throw new Error('Failed to clear trades');
  }
}
