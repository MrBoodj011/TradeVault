import React, { useState, useMemo } from 'react';
import { Trade } from '@/types/trade';
import { deleteTrade, updateTrade, clearAllTrades } from '@/app/actions/trades';
import { Download, Upload, Search, Trash2, Edit, SlidersHorizontal, ArrowUpDown, ExternalLink, X, Loader2 } from 'lucide-react';

interface TradeHistoryProps {
  trades: Trade[];
  onTradeDeleted: (id: string) => void;
  onTradeUpdated: (trade: Trade) => void;
  onTradesCleared: () => void;
  onTradesImported: () => void;
}

export default function TradeHistory({ trades, onTradeDeleted, onTradeUpdated, onTradesCleared, onTradesImported }: TradeHistoryProps) {
  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState('All');
  const [modelFilter, setModelFilter] = useState('All');
  const [isExporting, setIsExporting] = useState(false);

  // Editing states
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    asset: '',
    entry_model: '',
    risk_reward: 3.0,
    result: 'Win',
    pnl_percentage: 3.0,
    trade_date: '',
    screenshot_url: '',
    notes: '',
  });

  // Sorting
  const [sortField, setSortField] = useState<keyof Trade>('trade_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof Trade) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Filtered and Sorted Trades
  const processedTrades = useMemo(() => {
    return trades
      .filter((trade) => {
        const matchesSearch =
          trade.asset.toLowerCase().includes(search.toLowerCase()) ||
          (trade.notes && trade.notes.toLowerCase().includes(search.toLowerCase())) ||
          (trade.screenshot_url && trade.screenshot_url.toLowerCase().includes(search.toLowerCase())) ||
          trade.entry_model.toLowerCase().includes(search.toLowerCase());

        const matchesResult = resultFilter === 'All' || trade.result === resultFilter;
        const matchesModel = modelFilter === 'All' || trade.entry_model === modelFilter;

        return matchesSearch && matchesResult && matchesModel;
      })
      .sort((a, b) => {
        let aVal = a[sortField] ?? '';
        let bVal = b[sortField] ?? '';

        if (sortField === 'trade_date') {
          return sortOrder === 'asc'
            ? new Date(aVal).getTime() - new Date(bVal).getTime()
            : new Date(bVal).getTime() - new Date(aVal).getTime();
        }

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortOrder === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        return sortOrder === 'asc'
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      });
  }, [trades, search, resultFilter, modelFilter, sortField, sortOrder]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trade log?')) return;
    try {
      await deleteTrade(id);
      onTradeDeleted(id);
    } catch (err) {
      console.error(err);
      alert('Failed to delete trade.');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('WARNING: This will permanently delete ALL logged trades. Are you sure?')) return;
    if (!confirm('Double check: Are you absolutely sure you want to delete everything?')) return;
    
    try {
      await clearAllTrades();
      onTradesCleared();
    } catch (err) {
      console.error(err);
      alert('Failed to clear data.');
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsExporting(true);
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');

      alert(`Successfully imported ${data.count} trades!`);
      onTradesImported();
    } catch (err: any) {
      console.error(err);
      alert(`Import failed: ${err.message}`);
    } finally {
      setIsExporting(false);
      e.target.value = '';
    }
  };

  // Trigger Edit Mode
  const startEdit = (trade: Trade) => {
    setEditingTrade(trade);
    setEditForm({
      asset: trade.asset,
      entry_model: trade.entry_model,
      risk_reward: Number(trade.risk_reward),
      result: trade.result,
      pnl_percentage: Number(trade.pnl_percentage),
      trade_date: new Date(trade.trade_date).toISOString().split('T')[0],
      screenshot_url: trade.screenshot_url || '',
      notes: trade.notes || '',
    });
  };

  // Handle Edit Input Change
  const handleEditChange = (field: string, value: any) => {
    setEditForm((prev) => {
      const updated = { ...prev, [field]: value };
      
      // Auto compute PnL if outcome changes
      if (field === 'result') {
        if (value === 'Win') updated.pnl_percentage = Number(updated.risk_reward);
        else if (value === 'Loss') updated.pnl_percentage = -1.0;
        else if (value === 'Breakeven') updated.pnl_percentage = 0.0;
      }
      return updated;
    });
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrade) return;

    setIsUpdating(true);
    try {
      const updated = await updateTrade(editingTrade.id, {
        asset: editForm.asset,
        entry_model: editForm.entry_model as any,
        risk_reward: Number(editForm.risk_reward),
        result: editForm.result as any,
        pnl_percentage: Number(editForm.pnl_percentage),
        trade_date: editForm.trade_date,
        screenshot_url: editForm.screenshot_url || undefined,
        notes: editForm.notes || undefined,
      });

      onTradeUpdated(updated as any);
      setEditingTrade(null);
    } catch (err) {
      console.error(err);
      alert('Failed to update trade.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trades }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tradevault_journal_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to generate Excel journal export.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Trade History</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Manage, modify, and audit your complete backtesting log journal.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Import Button */}
          <label className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-100 rounded-lg text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-sm cursor-pointer">
            <Upload className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>Import Excel (.xlsx)</span>
            <input type="file" accept=".xlsx" onChange={handleImportExcel} className="hidden" />
          </label>

          {/* Clear All Button */}
          <button
            onClick={handleClearAll}
            disabled={trades.length === 0 || isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-lg text-sm font-semibold hover:bg-rose-100 dark:hover:bg-rose-950/30 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Data
          </button>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={isExporting || trades.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-100 rounded-lg text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            {isExporting ? 'Processing...' : 'Export to Excel (.xlsx)'}
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search asset, model or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-850 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/30 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800/80">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Result Filter */}
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400"
          >
            <option value="All">All Results</option>
            <option value="Win">Wins</option>
            <option value="Loss">Losses</option>
            <option value="Breakeven">Breakeven</option>
          </select>

          {/* Model Filter */}
          <select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400"
          >
            <option value="All">All Models</option>
            <option value="FVG post-sweep">FVG post-sweep</option>
            <option value="Balanced Price Range">Balanced Price Range</option>
            <option value="Turtle Soup sweep">Turtle Soup sweep</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Trades Table */}
      <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-zinc-50 dark:bg-zinc-950/40">
                <th onClick={() => handleSort('trade_date')} className="px-6 py-4 cursor-pointer hover:text-zinc-900 dark:hover:text-white select-none">
                  <div className="flex items-center gap-1.5">
                    Date <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </th>
                <th onClick={() => handleSort('asset')} className="px-6 py-4 cursor-pointer hover:text-zinc-900 dark:hover:text-white select-none">
                  <div className="flex items-center gap-1.5">
                    Asset <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </th>
                <th onClick={() => handleSort('entry_model')} className="px-6 py-4 cursor-pointer hover:text-zinc-900 dark:hover:text-white select-none">
                  <div className="flex items-center gap-1.5">
                    Model <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </th>
                <th onClick={() => handleSort('risk_reward')} className="px-6 py-4 text-center cursor-pointer hover:text-zinc-900 dark:hover:text-white select-none">
                  <div className="flex items-center justify-center gap-1.5">
                    R:R <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </th>
                <th onClick={() => handleSort('result')} className="px-6 py-4 text-center cursor-pointer hover:text-zinc-900 dark:hover:text-white select-none">
                  <div className="flex items-center justify-center gap-1.5">
                    Result <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </th>
                <th onClick={() => handleSort('pnl_percentage')} className="px-6 py-4 text-center cursor-pointer hover:text-zinc-900 dark:hover:text-white select-none">
                  <div className="flex items-center justify-center gap-1.5">
                    PnL (%) <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </th>
                <th className="px-6 py-4">Screenshot</th>
                <th className="px-6 py-4">Notes</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-sm">
              {processedTrades.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-zinc-500">
                    No trades match your search filters.
                  </td>
                </tr>
              ) : (
                processedTrades.map((trade) => {
                  let resultBadge = '';
                  if (trade.result === 'Win') resultBadge = 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400';
                  else if (trade.result === 'Loss') resultBadge = 'text-rose-650 bg-rose-500/10 border-rose-500/20 dark:text-rose-400';
                  else resultBadge = 'text-zinc-700 bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/50 dark:text-zinc-300';

                  return (
                    <tr key={trade.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/20 group transition-colors">
                      <td className="px-6 py-3.5 text-zinc-700 dark:text-zinc-300 font-medium">
                        {new Date(trade.trade_date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-3.5 font-bold text-zinc-900 dark:text-white tracking-wide">{trade.asset}</td>
                      <td className="px-6 py-3.5 text-zinc-500 dark:text-zinc-400 font-medium">{trade.entry_model}</td>
                      <td className="px-6 py-3.5 text-center text-zinc-500 dark:text-zinc-400 font-semibold">{Number(trade.risk_reward).toFixed(1)}</td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${resultBadge}`}>
                          {trade.result}
                        </span>
                      </td>
                      <td className={`px-6 py-3.5 text-center font-bold ${
                        Number(trade.pnl_percentage) > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : Number(trade.pnl_percentage) < 0
                          ? 'text-rose-650 dark:text-rose-500'
                          : 'text-zinc-500'
                      }`}>
                        {Number(trade.pnl_percentage) >= 0 ? '+' : ''}
                        {Number(trade.pnl_percentage).toFixed(2)}%
                      </td>
                      <td className="px-6 py-3.5">
                        {trade.screenshot_url ? (
                          <a
                            href={trade.screenshot_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-600 dark:text-amber-400 hover:text-amber-500 font-semibold hover:underline inline-flex items-center gap-1 text-xs"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-650 italic text-xs">None</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-zinc-500 dark:text-zinc-400 max-w-xs truncate" title={trade.notes}>
                        {trade.notes || <span className="text-zinc-400 dark:text-zinc-600 italic">No notes</span>}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => startEdit(trade)}
                            className="p-1.5 bg-transparent border border-transparent rounded-md text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900/50 transition-all cursor-pointer"
                            title="Edit trade log"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(trade.id)}
                            className="p-1.5 bg-transparent border border-transparent rounded-md text-zinc-400 dark:text-zinc-500 hover:text-rose-650 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all cursor-pointer"
                            title="Delete trade log"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal Overlay */}
      {editingTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg p-6 bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl space-y-4 text-left">
            <button
              onClick={() => setEditingTrade(null)}
              className="absolute top-4 right-4 p-1 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Modify Trade Log</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Update backtesting variables below.</p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-450 dark:text-zinc-400 uppercase">Asset</label>
                  <input
                    type="text"
                    required
                    value={editForm.asset}
                    onChange={(e) => handleEditChange('asset', e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm rounded-lg px-3 py-1.5 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-450 dark:text-zinc-400 uppercase">Date</label>
                  <input
                    type="date"
                    required
                    value={editForm.trade_date}
                    onChange={(e) => handleEditChange('trade_date', e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm rounded-lg px-3 py-1.5 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-450 dark:text-zinc-400 uppercase">Model</label>
                  <select
                    value={editForm.entry_model}
                    onChange={(e) => handleEditChange('entry_model', e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm rounded-lg px-3 py-1.5 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="FVG post-sweep">FVG post-sweep</option>
                    <option value="Balanced Price Range">Balanced Price Range</option>
                    <option value="Turtle Soup sweep">Turtle Soup sweep</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-450 dark:text-zinc-400 uppercase">Risk/Reward</label>
                  <input
                    type="number"
                    step="0.1"
                    readOnly
                    value={editForm.risk_reward}
                    className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-sm rounded-lg px-3 py-1.5 text-zinc-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-450 dark:text-zinc-400 uppercase">Result</label>
                  <select
                    value={editForm.result}
                    onChange={(e) => handleEditChange('result', e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm rounded-lg px-3 py-1.5 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Win">Win</option>
                    <option value="Loss">Loss</option>
                    <option value="Breakeven">Breakeven</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-450 dark:text-zinc-400 uppercase">PnL (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.pnl_percentage}
                    onChange={(e) => handleEditChange('pnl_percentage', e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm rounded-lg px-3 py-1.5 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-450 dark:text-zinc-400 uppercase">Screenshot URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={editForm.screenshot_url}
                  onChange={(e) => handleEditChange('screenshot_url', e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm rounded-lg px-3 py-1.5 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-450 dark:text-zinc-400 uppercase">Notes</label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => handleEditChange('notes', e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm rounded-lg px-3 py-1.5 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400 resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTrade(null)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-600 text-black hover:from-amber-300 hover:to-amber-500 text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
