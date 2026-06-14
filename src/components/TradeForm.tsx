import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addTrade } from '@/app/actions/trades';
import { Trade } from '@/types/trade';
import { PlusCircle, Loader2 } from 'lucide-react';

const tradeSchema = z.object({
  asset: z.string().min(1, 'Asset is required'),
  entry_model: z.enum(['FVG post-sweep', 'Balanced Price Range', 'Turtle Soup sweep', 'Other']),
  risk_reward: z.number().min(0.1, 'Risk/reward must be positive'),
  result: z.enum(['Win', 'Loss', 'Breakeven']),
  pnl_percentage: z.number(),
  trade_date: z.string().min(1, 'Trade date is required'),
  screenshot_url: z.string().optional(),
  notes: z.string().optional(),
});

type TradeFormValues = z.infer<typeof tradeSchema>;

interface TradeFormProps {
  onTradeAdded: (trade: Trade) => void;
  setActiveTab: (tab: string) => void;
}

export default function TradeForm({ onTradeAdded, setActiveTab }: TradeFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TradeFormValues>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      asset: 'EURUSD',
      entry_model: 'FVG post-sweep',
      risk_reward: 3.0,
      result: 'Win',
      pnl_percentage: 3.0,
      trade_date: new Date().toISOString().split('T')[0],
      screenshot_url: '',
      notes: '',
    },
  });

  const selectedResult = watch('result');
  const riskRewardVal = watch('risk_reward');

  // Automatically adjust PnL based on Result selected
  useEffect(() => {
    if (selectedResult === 'Win') {
      setValue('pnl_percentage', Number(riskRewardVal));
    } else if (selectedResult === 'Loss') {
      setValue('pnl_percentage', -1.0);
    } else if (selectedResult === 'Breakeven') {
      setValue('pnl_percentage', 0.0);
    }
  }, [selectedResult, riskRewardVal, setValue]);

  const onSubmit = async (data: TradeFormValues) => {
    try {
      const added = await addTrade(data);
      onTradeAdded(added as any);
      reset({
        asset: 'EURUSD',
        entry_model: 'FVG post-sweep',
        risk_reward: 3.0,
        result: 'Win',
        pnl_percentage: 3.0,
        trade_date: new Date().toISOString().split('T')[0],
        screenshot_url: '',
        notes: '',
      });
      setActiveTab('dashboard');
    } catch (err) {
      console.error('Failed to log trade:', err);
      alert('Error logging trade to Postgres.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl transition-colors">
      <div className="mb-6 pb-6 border-b border-zinc-150 dark:border-zinc-800">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          Log Manual Backtest Trade
        </h2>
        <p className="text-zinc-500 text-xs mt-1">
          Record trade variables rapidly. Tip: Use <kbd className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">Tab</kbd> to jump between fields.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Asset Column */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Asset Pair</label>
            <input
              type="text"
              {...register('asset')}
              placeholder="e.g. EURUSD"
              className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
            />
            {errors.asset && <p className="text-xs text-rose-500 mt-1">{errors.asset.message}</p>}
          </div>

          {/* Trade Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Trade Date</label>
            <input
              type="date"
              {...register('trade_date')}
              className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
            />
            {errors.trade_date && <p className="text-xs text-rose-500 mt-1">{errors.trade_date.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Entry Model Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Entry Model</label>
            <select
              {...register('entry_model')}
              className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
            >
              <option value="FVG post-sweep" className="bg-white dark:bg-[#09090b]">FVG post-sweep</option>
              <option value="Balanced Price Range" className="bg-white dark:bg-[#09090b]">Balanced Price Range</option>
              <option value="Turtle Soup sweep" className="bg-white dark:bg-[#09090b]">Turtle Soup sweep</option>
              <option value="Other" className="bg-white dark:bg-[#09090b]">Other</option>
            </select>
            {errors.entry_model && <p className="text-xs text-rose-500 mt-1">{errors.entry_model.message}</p>}
          </div>

          {/* Locked Risk/Reward */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex justify-between">
              <span>Risk/Reward Target</span>
              <span className="text-[10px] text-amber-600 dark:text-amber-500/80 font-normal lowercase">Locked fixed target</span>
            </label>
            <input
              type="number"
              step="0.1"
              readOnly
              {...register('risk_reward', { valueAsNumber: true })}
              className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 rounded-lg px-3.5 py-2 text-sm cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Result Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Result</label>
            <div className="grid grid-cols-3 gap-2">
              {['Win', 'Loss', 'Breakeven'].map((res) => {
                const isSelected = selectedResult === res;
                let activeClass = '';
                if (res === 'Win') activeClass = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30';
                if (res === 'Loss') activeClass = 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/30';
                if (res === 'Breakeven') activeClass = 'border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 ring-1 ring-zinc-500/30';

                return (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setValue('result', res as any)}
                    className={`py-2 px-3 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold transition-all duration-150 ${
                      isSelected ? activeClass : 'bg-zinc-50 dark:bg-zinc-900/30 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/80'
                    }`}
                  >
                    {res}
                  </button>
                );
              })}
            </div>
            {errors.result && <p className="text-xs text-rose-500 mt-1">{errors.result.message}</p>}
          </div>

          {/* PnL Percentage */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">PnL (%)</label>
            <input
              type="number"
              step="0.01"
              {...register('pnl_percentage', { valueAsNumber: true })}
              className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
            />
            {errors.pnl_percentage && <p className="text-xs text-rose-500 mt-1">{errors.pnl_percentage.message}</p>}
          </div>
        </div>

        {/* Screenshot URL */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Screenshot URL</label>
          <input
            type="text"
            {...register('screenshot_url')}
            placeholder="e.g. https://tradingview.com/x/... or https://imgur.com/..."
            className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
          />
          {errors.screenshot_url && <p className="text-xs text-rose-500 mt-1">{errors.screenshot_url.message}</p>}
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Trade Notes</label>
          <textarea
            rows={3}
            {...register('notes')}
            placeholder="Add context (e.g. news release, market environment, execution quality...)"
            className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors resize-none"
          ></textarea>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-black py-2.5 rounded-lg text-sm font-bold shadow-md hover:from-amber-300 hover:to-amber-500 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Logging Session...</span>
            </>
          ) : (
            <span>Log Trade Session</span>
          )}
        </button>
      </form>
    </div>
  );
}
