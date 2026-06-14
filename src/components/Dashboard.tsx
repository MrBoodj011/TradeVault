import React, { useState, useMemo } from 'react';
import { Trade } from '@/types/trade';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp, Award, Activity, AlertCircle, Zap, ShieldCheck, ShieldAlert, BarChart3, Filter } from 'lucide-react';

interface DashboardProps {
  trades: Trade[];
}

export default function Dashboard({ trades }: DashboardProps) {
  // Filters State
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');

  // Months name array
  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Extract unique years from logged trades
  const uniqueYears = useMemo(() => {
    const years = trades.map((t) => new Date(t.trade_date).getFullYear());
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [trades]);

  // Sort trades chronologically ascending for consecutive streaks calculations & equity curve
  const chronTrades = useMemo(() => {
    return [...trades].sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());
  }, [trades]);

  // Calculate Streaks over ALL trades (not just filtered ones, to represent true account history streaks)
  const trueStreaks = useMemo(() => {
    if (chronTrades.length === 0) return { maxWin: 0, maxLoss: 0 };

    let maxWin = 0;
    let maxLoss = 0;
    let currentWin = 0;
    let currentLoss = 0;

    chronTrades.forEach((t) => {
      if (t.result === 'Win') {
        currentWin++;
        currentLoss = 0;
        if (currentWin > maxWin) maxWin = currentWin;
      } else if (t.result === 'Loss') {
        currentLoss++;
        currentWin = 0;
        if (currentLoss > maxLoss) maxLoss = currentLoss;
      } else {
        // Breakeven reset streaks
        currentWin = 0;
        currentLoss = 0;
      }
    });

    return { maxWin, maxLoss };
  }, [chronTrades]);

  // Filter Trades for Dashboard Stats
  const filteredTrades = useMemo(() => {
    return chronTrades.filter((t) => {
      const date = new Date(t.trade_date);
      const matchesYear = selectedYear === 'All' || date.getFullYear().toString() === selectedYear;
      const matchesMonth = selectedMonth === 'All' || MONTHS[date.getMonth()] === selectedMonth;
      return matchesYear && matchesMonth;
    });
  }, [chronTrades, selectedYear, selectedMonth]);

  // Filtered Stats Calculations
  const stats = useMemo(() => {
    const total = filteredTrades.length;
    if (total === 0) {
      return { total: 0, winRate: 0, totalPnl: 0, wins: 0, losses: 0, breakeven: 0, expectancy: 0 };
    }

    const wins = filteredTrades.filter((t) => t.result === 'Win').length;
    const losses = filteredTrades.filter((t) => t.result === 'Loss').length;
    const breakeven = filteredTrades.filter((t) => t.result === 'Breakeven').length;
    const winRate = (wins / total) * 100;
    const totalPnl = filteredTrades.reduce((sum, t) => sum + Number(t.pnl_percentage), 0);
    const expectancy = totalPnl / total;

    return { total, winRate, totalPnl, wins, losses, breakeven, expectancy };
  }, [filteredTrades]);

  // Equity Curve Data Generation (based on filtered trades)
  const chartData = useMemo(() => {
    if (filteredTrades.length === 0) return [];

    let runningPnl = 0;
    const data = [
      {
        index: 0,
        date: 'Start',
        tradeDetails: 'Initial Balance',
        pnl: 0,
        cumulative: 0,
      },
    ];

    filteredTrades.forEach((trade, idx) => {
      runningPnl += Number(trade.pnl_percentage);
      data.push({
        index: idx + 1,
        date: new Date(trade.trade_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        tradeDetails: `${trade.asset} (${trade.result})`,
        pnl: Number(trade.pnl_percentage),
        cumulative: Number(runningPnl.toFixed(2)),
      });
    });

    return data;
  }, [filteredTrades]);

  // Asset Diagnostics (Best pair vs Worst pair)
  const assetDiagnostics = useMemo(() => {
    if (filteredTrades.length === 0) return { best: { pair: 'N/A', pnl: 0 }, worst: { pair: 'N/A', pnl: 0 } };

    const assetMap: Record<string, number> = {};
    filteredTrades.forEach((t) => {
      assetMap[t.asset] = (assetMap[t.asset] || 0) + Number(t.pnl_percentage);
    });

    let bestPair = 'N/A';
    let bestPnl = -Infinity;
    let worstPair = 'N/A';
    let worstPnl = Infinity;

    Object.entries(assetMap).forEach(([pair, pnl]) => {
      if (pnl > bestPnl) {
        bestPnl = pnl;
        bestPair = pair;
      }
      if (pnl < worstPnl) {
        worstPnl = pnl;
        worstPair = pair;
      }
    });

    return {
      best: { pair: bestPair, pnl: bestPnl === -Infinity ? 0 : bestPnl },
      worst: { pair: worstPair, pnl: worstPnl === Infinity ? 0 : worstPnl }
    };
  }, [filteredTrades]);

  // Entry Model Edge Diagnostics
  const modelDiagnostics = useMemo(() => {
    const models: ('FVG post-sweep' | 'Balanced Price Range' | 'Turtle Soup sweep' | 'Other')[] = [
      'FVG post-sweep', 'Balanced Price Range', 'Turtle Soup sweep', 'Other'
    ];

    return models.map((model) => {
      const modelTrades = filteredTrades.filter((t) => t.entry_model === model);
      const total = modelTrades.length;
      if (total === 0) return { model, total: 0, winRate: 0, pnl: 0 };

      const wins = modelTrades.filter((t) => t.result === 'Win').length;
      const pnl = modelTrades.reduce((sum, t) => sum + Number(t.pnl_percentage), 0);
      return {
        model,
        total,
        winRate: (wins / total) * 100,
        pnl,
      };
    });
  }, [filteredTrades]);

  // Year/Month breakdown Matrix f chronological table
  const chronologicalBreakdown = useMemo(() => {
    const groups: Record<string, Trade[]> = {};
    
    trades.forEach((t) => {
      const d = new Date(t.trade_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });

    return Object.entries(groups)
      .map(([key, list]) => {
        const [year, monthNum] = key.split('-');
        const monthName = MONTHS[parseInt(monthNum) - 1];
        const wins = list.filter((t) => t.result === 'Win').length;
        const pnl = list.reduce((sum, t) => sum + Number(t.pnl_percentage), 0);
        return {
          key,
          year,
          month: monthName,
          trades: list.length,
          winRate: (wins / list.length) * 100,
          pnl,
        };
      })
      .sort((a, b) => b.key.localeCompare(a.key)); // sort descending
  }, [trades]);

  return (
    <div className="space-y-8 animate-fade-in p-6">
      {/* Page Header & Filtering Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-zinc-550 dark:text-zinc-400 text-sm mt-1">Real-time statistics and backtesting performance analytics.</p>
        </div>

        {/* Filters Panel */}
        <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 px-1.5">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Period:</span>
          </div>

          {/* Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 rounded-lg px-2 py-1 focus:outline-none"
          >
            <option value="All">All Years</option>
            {uniqueYears.map((y) => (
              <option key={y} value={y.toString()}>{y}</option>
            ))}
          </select>

          {/* Month Filter */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 rounded-lg px-2 py-1 focus:outline-none"
          >
            <option value="All">All Months</option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Trades Card */}
        <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 relative overflow-hidden group hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all duration-300 shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity className="w-24 h-24 text-zinc-400 dark:text-white" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Total Trades</h3>
            <div className="p-2 bg-zinc-50 dark:bg-zinc-800/80 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <Activity className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">{stats.total}</span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">logged</span>
          </div>
          <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-400 flex gap-3">
            <span><span className="text-emerald-600 dark:text-emerald-500 font-semibold">{stats.wins}</span> Win</span>
            <span><span className="text-rose-650 dark:text-rose-500 font-semibold">{stats.losses}</span> Loss</span>
            <span><span className="text-zinc-550 dark:text-zinc-650 font-semibold">{stats.breakeven}</span> BE</span>
          </div>
        </div>

        {/* Win Rate Card */}
        <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 relative overflow-hidden group hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all duration-300 shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Award className="w-24 h-24 text-zinc-400 dark:text-white" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Win Rate</h3>
            <div className="p-2 bg-zinc-50 dark:bg-zinc-800/80 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <Award className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">{stats.winRate.toFixed(1)}%</span>
          </div>
          <div className="mt-4">
            <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-200 dark:border-zinc-800">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.winRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Cumulative PnL Card */}
        <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 relative overflow-hidden group hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all duration-300 shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="w-24 h-24 text-zinc-400 dark:text-white" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Cumulative PnL</h3>
            <div className="p-2 bg-zinc-50 dark:bg-zinc-800/80 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <TrendingUp className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-extrabold tracking-tight ${
              stats.totalPnl > 0 ? 'text-emerald-600 dark:text-emerald-400' : stats.totalPnl < 0 ? 'text-rose-650 dark:text-rose-400' : 'text-zinc-900 dark:text-white'
            }`}>
              {stats.totalPnl >= 0 ? '+' : ''}{stats.totalPnl.toFixed(2)}%
            </span>
          </div>
          <div className="mt-4 text-xs text-zinc-550 dark:text-zinc-500">
            Account growth based on fixed target risk reward
          </div>
        </div>
      </div>

      {/* Streaks & Expectancy KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Win Streak Card */}
        <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 block">Max Consecutive Wins</span>
            <span className="text-2xl font-extrabold text-zinc-900 dark:text-white">{trueStreaks.maxWin}</span>
          </div>
        </div>

        {/* Loss Streak Card */}
        <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 block">Max Consecutive Losses</span>
            <span className="text-2xl font-extrabold text-zinc-900 dark:text-white">{trueStreaks.maxLoss}</span>
          </div>
        </div>

        {/* Expectancy Card */}
        <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-150 dark:border-amber-900/40 text-amber-600 dark:text-amber-500">
            <Zap className="w-6 h-6" />
          </div>
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 block">Expectancy (Average R)</span>
            <span className={`text-2xl font-extrabold ${stats.expectancy >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {stats.expectancy >= 0 ? '+' : ''}{stats.expectancy.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Equity Curve Chart */}
      <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Equity Curve</h2>
            <p className="text-zinc-550 dark:text-zinc-500 text-xs mt-0.5">Visualizing cumulative profit & loss percentages over time.</p>
          </div>
          {filteredTrades.length > 0 && (
            <div className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg font-medium">
              Initial: <span className="font-semibold text-zinc-800 dark:text-zinc-300">0.0%</span> &rarr; Peak: <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {Math.max(...chartData.map((d) => d.cumulative)).toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        {filteredTrades.length === 0 ? (
          <div className="h-[350px] flex flex-col items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-6 bg-zinc-50/50 dark:bg-zinc-950/20">
            <AlertCircle className="w-12 h-12 text-zinc-400 dark:text-zinc-650 mb-3" />
            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No trading data available</h4>
            <p className="text-zinc-550 dark:text-zinc-500 text-xs mt-1 text-center max-w-[260px]">
              No trades logged for this filtered year/month selection.
            </p>
          </div>
        ) : (
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="var(--muted-foreground)" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="var(--muted-foreground)" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `${val}%`}
                  dx={-10}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const isPositive = data.pnl >= 0;
                      return (
                        <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xl space-y-1 text-left">
                          <p className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 dark:text-zinc-500">{data.date}</p>
                          <p className="text-xs font-semibold text-zinc-900 dark:text-white">{data.tradeDetails}</p>
                          <div className="flex gap-4 pt-1">
                            <div>
                              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">Trade PnL</span>
                              <span className={`text-xs font-bold ${isPositive ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                                {isPositive ? '+' : ''}{data.pnl}%
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">Cumulative PnL</span>
                              <span className="text-xs font-extrabold text-amber-500 dark:text-amber-400">
                                {data.cumulative.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#d4af37"
                  strokeWidth={2.5}
                  dot={{ r: 4, stroke: '#d4af37', strokeWidth: 1, fill: 'var(--card)' }}
                  activeDot={{ r: 6, stroke: '#d4af37', strokeWidth: 2, fill: 'var(--background)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Asset Diagnostics & Edge Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Edge Diagnostics */}
        <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-500" />
              Setup Model Edges
            </h2>
            <p className="text-zinc-500 text-xs mt-0.5">Win rate and PnL metrics breakdown per entry model.</p>
          </div>
          <div className="space-y-4 flex-1 py-2">
            {modelDiagnostics.map((d) => (
              <div key={d.model} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-zinc-700 dark:text-zinc-300">{d.model}</span>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {d.total} trades &bull; <span className="text-amber-500">{d.winRate.toFixed(0)}% WR</span> &bull;{' '}
                    <span className={d.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                      {d.pnl >= 0 ? '+' : ''}{d.pnl.toFixed(1)}%
                    </span>
                  </span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
                    style={{ width: `${d.winRate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Asset Performance Diagnostics */}
        <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              Asset Performance
            </h2>
            <p className="text-zinc-500 text-xs mt-0.5">Diagnosing your highest edge pairs vs your worst pairs.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 py-6">
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-center">
              <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 block uppercase">Best Asset</span>
              <span className="text-xl font-extrabold text-zinc-900 dark:text-white mt-1 block">{assetDiagnostics.best.pair}</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold block mt-1">
                +{assetDiagnostics.best.pnl.toFixed(1)}%
              </span>
            </div>
            <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl text-center">
              <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400 block uppercase">Worst Asset</span>
              <span className="text-xl font-extrabold text-zinc-900 dark:text-white mt-1 block">{assetDiagnostics.worst.pair}</span>
              <span className="text-xs text-rose-600 dark:text-rose-455 font-bold block mt-1">
                {assetDiagnostics.worst.pnl.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chronological year/month breakdown Table */}
      <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-zinc-150 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Monthly Breakdown Matrix</h2>
          <p className="text-zinc-500 text-xs mt-0.5">Chronological breakdown of results grouped by year and month.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-zinc-50 dark:bg-zinc-950/40">
                <th className="px-6 py-3">Year</th>
                <th className="px-6 py-3">Month</th>
                <th className="px-6 py-3 text-center">Trades</th>
                <th className="px-6 py-3 text-center">Win Rate (%)</th>
                <th className="px-6 py-3 text-center">Net Return (PnL)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-sm">
              {chronologicalBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-450">
                    No trade logs generated yet.
                  </td>
                </tr>
              ) : (
                chronologicalBreakdown.map((row) => (
                  <tr key={row.key} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/10 transition-colors">
                    <td className="px-6 py-3 font-semibold text-zinc-900 dark:text-white">{row.year}</td>
                    <td className="px-6 py-3 text-zinc-650 dark:text-zinc-300 font-medium">{row.month}</td>
                    <td className="px-6 py-3 text-center text-zinc-600 dark:text-zinc-400">{row.trades}</td>
                    <td className="px-6 py-3 text-center text-amber-500 font-bold">{row.winRate.toFixed(0)}%</td>
                    <td className={`px-6 py-3 text-center font-extrabold ${row.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {row.pnl >= 0 ? '+' : ''}{row.pnl.toFixed(2)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
