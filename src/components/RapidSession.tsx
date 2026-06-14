import React, { useState, useEffect } from 'react';
import { addTrade } from '@/app/actions/trades';
import { Trade } from '@/types/trade';
import { Play, Square, FastForward, Check, X, Slash, ChevronLeft, Camera } from 'lucide-react';

interface RapidSessionProps {
  trades: Trade[];
  onTradeAdded: (trade: Trade) => void;
  setActiveTab: (tab: string) => void;
}

export default function RapidSession({ trades, onTradeAdded, setActiveTab }: RapidSessionProps) {
  // Session Configuration State
  const [inSession, setInSession] = useState(false);
  const [asset, setAsset] = useState('EURUSD');
  const [entryModel, setEntryModel] = useState('FVG post-sweep');
  const [currentDateStr, setCurrentDateStr] = useState(new Date().toISOString().split('T')[0]);

  // Active Session Running State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [sessionTrades, setSessionTrades] = useState<Trade[]>([]);

  // Suggest last trade date + 1 day to resume session cleanly
  useEffect(() => {
    if (trades.length > 0) {
      const dates = trades.map((t) => new Date(t.trade_date).getTime());
      const latestTime = Math.max(...dates);
      const nextDate = new Date(latestTime);
      nextDate.setDate(nextDate.getDate() + 1);
      setCurrentDateStr(nextDate.toISOString().split('T')[0]);
    }
  }, [trades]);

  // Hotkey support during active session
  useEffect(() => {
    if (!inSession) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys if user is focusing input/textarea fields
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'w') {
        handleLogTrade('Win');
      } else if (key === 'l') {
        handleLogTrade('Loss');
      } else if (key === 'b') {
        handleLogTrade('Breakeven');
      } else if (key === 's') {
        handleSkipDay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inSession, currentDate, notes, screenshotUrl, asset, entryModel]);

  const handleStartSession = () => {
    setCurrentDate(new Date(currentDateStr));
    setSessionTrades([]);
    setInSession(true);
  };

  const handleLogTrade = async (result: 'Win' | 'Loss' | 'Breakeven') => {
    let pnl = 3.0;
    if (result === 'Loss') pnl = -1.0;
    else if (result === 'Breakeven') pnl = 0.0;

    const tradeData = {
      asset,
      entry_model: entryModel,
      risk_reward: 3.0,
      result,
      pnl_percentage: pnl,
      trade_date: currentDate.toISOString().split('T')[0],
      notes: notes || undefined,
      screenshot_url: screenshotUrl || undefined,
    };

    try {
      const added = await addTrade(tradeData);
      onTradeAdded(added as any);
      setSessionTrades((prev) => [added as any, ...prev]);
      
      // Reset logging variables for the next day
      setNotes('');
      setScreenshotUrl('');
      
      advanceDate(1);
    } catch (err) {
      console.error(err);
      alert('Error logging trade session.');
    }
  };

  const handleSkipDay = () => {
    advanceDate(1);
  };

  const handlePrevDay = () => {
    advanceDate(-1);
  };

  const advanceDate = (days: number) => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + days);
      return next;
    });
  };

  const sessionStats = React.useMemo(() => {
    const total = sessionTrades.length;
    if (total === 0) return { total: 0, winRate: 0, pnl: 0 };
    const wins = sessionTrades.filter((t) => t.result === 'Win').length;
    const pnl = sessionTrades.reduce((sum, t) => sum + Number(t.pnl_percentage), 0);
    return {
      total,
      winRate: (wins / total) * 100,
      pnl,
    };
  }, [sessionTrades]);

  if (!inSession) {
    return (
      <div className="max-w-md mx-auto p-6 bg-[#09090b] dark:bg-[#09090b] light:bg-white border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl space-y-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Play className="w-5 h-5 text-amber-400 fill-amber-400/20" />
            Start Rapid Backtest Session
          </h2>
          <p className="text-zinc-500 text-xs mt-1">
            Log your setups rapidly day-by-day in sequence. Use hotkeys to speed up your process!
          </p>
        </div>

        <div className="space-y-4">
          {/* Asset Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Asset Pair</label>
            <input
              type="text"
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
          </div>

          {/* Model */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Default Entry Model</label>
            <select
              value={entryModel}
              onChange={(e) => setEntryModel(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            >
              <option value="FVG post-sweep">FVG post-sweep</option>
              <option value="Balanced Price Range">Balanced Price Range</option>
              <option value="Turtle Soup sweep">Turtle Soup sweep</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Start Date <span className="text-[10px] text-amber-500 font-normal normal-case">(Resumed from last trade)</span>
            </label>
            <input
              type="date"
              value={currentDateStr}
              onChange={(e) => setCurrentDateStr(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
          </div>

          <button
            onClick={handleStartSession}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-600 text-black py-2.5 rounded-lg text-sm font-bold shadow-md hover:from-amber-300 hover:to-amber-500 transition-all cursor-pointer"
          >
            Start Backtesting Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto p-4">
      {/* Session Logger (Left) */}
      <div className="lg:col-span-2 bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              Backtesting Session
            </h2>
            <p className="text-zinc-500 text-xs mt-0.5">Asset: <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{asset}</span> | Model: <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{entryModel}</span></p>
          </div>
          <button
            onClick={() => setInSession(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Square className="w-3.5 h-3.5" />
            End Session
          </button>
        </div>

        {/* Big Date Header */}
        <div className="bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-850 p-6 rounded-xl text-center space-y-1 relative overflow-hidden group">
          <span className="text-[10px] text-amber-500 uppercase tracking-widest font-bold">Current Testing Date</span>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {currentDate.toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </h1>
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={handlePrevDay}
              className="p-1 hover:text-zinc-900 dark:hover:text-white text-zinc-400 dark:text-zinc-500 transition-colors flex items-center gap-1 text-xs"
            >
              <ChevronLeft className="w-4 h-4" /> Prev Day
            </button>
            <span className="text-zinc-300 dark:text-zinc-800">|</span>
            <button
              onClick={handleSkipDay}
              className="p-1 hover:text-zinc-900 dark:hover:text-white text-zinc-400 dark:text-zinc-500 transition-colors flex items-center gap-1 text-xs"
            >
              Skip Day <FastForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-zinc-400" />
              Screenshot URL
            </label>
            <input
              type="text"
              placeholder="Paste screenshot link here (e.g. tradingview link)"
              value={screenshotUrl}
              onChange={(e) => setScreenshotUrl(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Quick Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Price swept liquidity at London open, displacement up"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-amber-400 resize-none"
            ></textarea>
          </div>
        </div>

        {/* Action Logger Buttons */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-semibold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider text-center block">Record Day Outcome</label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleLogTrade('Win')}
              className="group py-4 px-3 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 animate-fade-in"
            >
              <div className="p-2 bg-emerald-500/10 rounded-full text-emerald-500 dark:text-emerald-400">
                <Check className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm text-emerald-600 dark:text-emerald-300">Win</span>
              <kbd className="text-[10px] bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-600 dark:text-emerald-400">W</kbd>
            </button>

            <button
              onClick={() => handleLogTrade('Loss')}
              className="group py-4 px-3 bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              <div className="p-2 bg-rose-500/10 rounded-full text-rose-500 dark:text-rose-400">
                <X className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm text-rose-600 dark:text-rose-300">Loss</span>
              <kbd className="text-[10px] bg-rose-100 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/20 px-1.5 py-0.5 rounded text-rose-600 dark:text-rose-400">L</kbd>
            </button>

            <button
              onClick={() => handleLogTrade('Breakeven')}
              className="group py-4 px-3 bg-zinc-50 dark:bg-zinc-500/10 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-750 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              <div className="p-2 bg-zinc-200 dark:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-300">
                <Slash className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm text-zinc-700 dark:text-zinc-300">Breakeven</span>
              <kbd className="text-[10px] bg-zinc-150 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400">B</kbd>
            </button>
          </div>

          <div className="flex justify-between items-center text-[10px] text-zinc-400 dark:text-zinc-500 px-1 pt-1">
            <span>Tip: Click hotkeys W, L, B or S on your keyboard to log outcomes instantly.</span>
            <button
              onClick={handleSkipDay}
              className="text-amber-500 font-semibold hover:underline"
            >
              Skip Day [S]
            </button>
          </div>
        </div>
      </div>

      {/* Session Progress Side Panel (Right) */}
      <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-xl space-y-6 flex flex-col h-full">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Session Progress</h3>
          <p className="text-zinc-400 dark:text-zinc-500 text-xs">Logged performance in this current run.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 border-y border-zinc-150 dark:border-zinc-800 py-4">
          <div className="text-center">
            <span className="text-[10px] text-zinc-500 block uppercase">Trades</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-white">{sessionStats.total}</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-zinc-500 block uppercase">Win %</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-white">{sessionStats.winRate.toFixed(0)}%</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-zinc-500 block uppercase">PnL</span>
            <span className={`text-lg font-bold ${sessionStats.pnl >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
              {sessionStats.pnl >= 0 ? '+' : ''}{sessionStats.pnl}%
            </span>
          </div>
        </div>

        {/* Small Log */}
        <div className="flex-1 space-y-2 overflow-y-auto max-h-[280px] pr-1">
          {sessionTrades.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-600 text-center py-8">Log outcomes to view log history.</p>
          ) : (
            sessionTrades.map((t, idx) => {
              const outcomeColor = t.result === 'Win' ? 'text-emerald-500 dark:text-emerald-400' : t.result === 'Loss' ? 'text-rose-500 dark:text-rose-400' : 'text-zinc-500 dark:text-zinc-400';
              return (
                <div key={t.id || idx} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 p-2.5 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300 block">{new Date(t.trade_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{t.asset} &bull; {t.entry_model}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${outcomeColor}`}>{t.result}</span>
                    <span className="block text-[10px] text-zinc-400 dark:text-zinc-500">{t.pnl_percentage >= 0 ? '+' : ''}{t.pnl_percentage}%</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
