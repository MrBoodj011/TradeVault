'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import TradeForm from '@/components/TradeForm';
import TradeHistory from '@/components/TradeHistory';
import RapidSession from '@/components/RapidSession';
import { getTrades } from '@/app/actions/trades';
import { Trade } from '@/types/trade';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadTrades = async () => {
    try {
      const data = await getTrades();
      setTrades(data as any);
    } catch (err) {
      console.error('Error fetching trades:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch trades on mount
  useEffect(() => {
    loadTrades();
  }, []);

  const handleTradeAdded = (newTrade: any) => {
    setTrades((prev) => {
      const updated = [...prev, newTrade];
      // Sort chronologically after adding
      return updated.sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());
    });
  };

  const handleTradeDeleted = (id: string) => {
    setTrades((prev) => prev.filter((t) => t.id !== id));
  };

  const handleTradeUpdated = (updatedTrade: any) => {
    setTrades((prev) => {
      const filtered = prev.filter((t) => t.id !== updatedTrade.id);
      const updated = [...filtered, updatedTrade];
      // Sort chronologically after editing
      return updated.sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());
    });
  };

  const handleTradesCleared = () => {
    setTrades([]);
  };

  const handleTradesImported = () => {
    setIsLoading(true);
    loadTrades();
  };

  return (
    <div className="flex min-h-screen bg-[#fafafa] dark:bg-[#030303] text-zinc-800 dark:text-zinc-100 selection:bg-amber-400 selection:text-black transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMockMode={false}
      />

      {/* Main Viewport */}
      <main className="flex-1 overflow-y-auto glow-bg relative min-h-screen">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[80vh] gap-3">
            <Loader2 className="w-8 h-8 text-amber-500 dark:text-amber-400 animate-spin" />
            <p className="text-sm text-zinc-500 font-medium">Loading trading workspace...</p>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {activeTab === 'dashboard' && <Dashboard trades={trades} />}
            {activeTab === 'rapid-session' && (
              <div className="py-6">
                <RapidSession trades={trades} onTradeAdded={handleTradeAdded} setActiveTab={setActiveTab} />
              </div>
            )}
            {activeTab === 'new-trade' && (
              <div className="py-6">
                <TradeForm onTradeAdded={handleTradeAdded} setActiveTab={setActiveTab} />
              </div>
            )}
            {activeTab === 'history' && (
              <TradeHistory
                trades={trades}
                onTradeDeleted={handleTradeDeleted}
                onTradeUpdated={handleTradeUpdated}
                onTradesCleared={handleTradesCleared}
                onTradesImported={handleTradesImported}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
