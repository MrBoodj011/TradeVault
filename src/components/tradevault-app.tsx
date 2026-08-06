"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BookOpenCheck,
  Check,
  ChevronRight,
  CircleDollarSign,
  CloudOff,
  Download,
  Eye,
  EyeOff,
  FileUp,
  Fingerprint,
  Gauge,
  LayoutDashboard,
  ListFilter,
  LoaderCircle,
  Lock,
  LockKeyhole,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TradeVaultLogo } from "./logo";
import {
  useTradeVault,
  type TradeVaultController,
} from "@/hooks/use-tradevault";
import {
  calculateMetrics,
  createEquityCurve,
  groupPerformance,
} from "@/lib/analytics";
import {
  downloadText,
  exportTradesCsv,
  importTradesCsv,
  parseTradeVaultJson,
} from "@/lib/import-export";
import {
  formatMoney,
  markets,
  type Trade,
  type TradeVaultData,
} from "@/domain/types";

type View = "dashboard" | "journal" | "log" | "playbook" | "settings";

const fieldClass =
  "w-full rounded-xl border border-white/8 bg-white/[0.035] px-3.5 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-400/60 focus:bg-emerald-400/[0.035] focus:ring-2 focus:ring-emerald-400/10";
const labelClass =
  "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500";

const navItems: Array<{
  id: View;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: "dashboard", label: "Command center", icon: LayoutDashboard },
  { id: "journal", label: "Trade journal", icon: ListFilter },
  { id: "log", label: "Log execution", icon: Plus },
  { id: "playbook", label: "Playbook", icon: BookOpenCheck },
  { id: "settings", label: "Vault settings", icon: Settings },
];

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "emerald",
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Activity;
  tone?: "emerald" | "cyan" | "amber" | "rose";
}) {
  const tones = {
    emerald: "border-emerald-400/15 bg-emerald-400/10 text-emerald-300",
    cyan: "border-cyan-400/15 bg-cyan-400/10 text-cyan-300",
    amber: "border-amber-400/15 bg-amber-400/10 text-amber-300",
    rose: "border-rose-400/15 bg-rose-400/10 text-rose-300",
  };
  return (
    <div className="group rounded-2xl border border-white/[0.07] bg-[#0a1210]/85 p-5 shadow-[0_18px_55px_rgba(0,0,0,.18)] transition hover:-translate-y-0.5 hover:border-white/[0.13]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
            {label}
          </p>
          <p className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <div className={`rounded-xl border p-2.5 ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function Sidebar({
  active,
  onChange,
  open,
  onClose,
}: {
  active: View;
  onChange: (view: View) => void;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {open && (
        <button
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-label="Close navigation"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col border-r border-white/[0.07] bg-[#060b0a]/95 p-5 backdrop-blur-xl transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between">
          <TradeVaultLogo />
          <button
            className="rounded-lg p-2 text-slate-500 hover:bg-white/5 lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-8 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.055] p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
            <CloudOff className="h-4 w-4" /> Local-first vault
          </div>
          <p className="mt-2 text-[11px] leading-5 text-slate-500">
            Your trading data stays on this device. No account, cloud, or
            tracking.
          </p>
        </div>

        <nav className="mt-7 space-y-1" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const selected = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onChange(item.id);
                  onClose();
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition ${selected ? "bg-emerald-400/[0.11] text-emerald-200" : "text-slate-500 hover:bg-white/[0.035] hover:text-slate-200"}`}
              >
                <Icon
                  className={`h-[18px] w-[18px] ${selected ? "text-emerald-300" : ""}`}
                />
                {item.label}
                {selected && <ChevronRight className="ml-auto h-4 w-4" />}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <ShieldCheck className="h-4 w-4 text-emerald-300" /> Privacy status
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>Telemetry</span>
            <span className="font-bold text-emerald-300">OFF</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Cloud sync</span>
            <span className="font-bold text-emerald-300">OFF</span>
          </div>
        </div>
      </aside>
    </>
  );
}

function DashboardView({
  data,
  onNavigate,
}: {
  data: TradeVaultData;
  onNavigate: (view: View) => void;
}) {
  const metrics = useMemo(() => calculateMetrics(data.trades), [data.trades]);
  const curve = useMemo(
    () => createEquityCurve(data.trades, data.settings.account.startingBalance),
    [data.trades, data.settings.account.startingBalance],
  );
  const setups = useMemo(
    () => groupPerformance(data.trades, (trade) => trade.setup).slice(0, 5),
    [data.trades],
  );
  const currency = data.settings.account.currency;
  const hidden = data.settings.privacyMode;
  const money = (value: number) =>
    hidden ? "••••••" : formatMoney(value, currency);
  const recent = [...data.trades]
    .sort(
      (a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime(),
    )
    .slice(0, 5);

  if (!data.trades.length) {
    return (
      <div className="grid min-h-[68vh] place-items-center">
        <div className="max-w-xl text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-[26px] border border-emerald-400/20 bg-emerald-400/10 shadow-[0_0_70px_rgba(16,185,129,.12)]">
            <TrendingUp className="h-8 w-8 text-emerald-300" />
          </div>
          <p className="mt-7 text-xs font-black uppercase tracking-[0.25em] text-emerald-300">
            Your edge starts here
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl">
            Turn every execution into evidence.
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-slate-500">
            Log trades, measure discipline, expose setup performance, and build
            a repeatable trading process without sending your data anywhere.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={() => onNavigate("log")}
              className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-black text-[#03100c] shadow-[0_12px_35px_rgba(52,211,153,.18)] hover:bg-emerald-300"
            >
              Log first trade
            </button>
            <button
              onClick={() => onNavigate("settings")}
              className="rounded-xl border border-white/10 bg-white/[0.035] px-5 py-3 text-sm font-bold text-slate-300 hover:bg-white/[0.06]"
            >
              Load demo workspace
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Net performance"
          value={money(metrics.netPnl)}
          detail={`${metrics.netR >= 0 ? "+" : ""}${metrics.netR.toFixed(2)}R across ${metrics.total} trades`}
          icon={CircleDollarSign}
        />
        <StatCard
          label="Win rate"
          value={`${metrics.winRate.toFixed(1)}%`}
          detail={`${metrics.wins} wins / ${metrics.losses} losses`}
          icon={Trophy}
          tone="cyan"
        />
        <StatCard
          label="Profit factor"
          value={
            Number.isFinite(metrics.profitFactor)
              ? metrics.profitFactor.toFixed(2)
              : "Perfect"
          }
          detail={`${metrics.expectancyR >= 0 ? "+" : ""}${metrics.expectancyR.toFixed(2)}R expectancy`}
          icon={Gauge}
          tone="amber"
        />
        <StatCard
          label="Max drawdown"
          value={money(metrics.maxDrawdown)}
          detail={`${metrics.planAdherence.toFixed(0)}% plan adherence`}
          icon={ArrowDownRight}
          tone="rose"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <section className="rounded-3xl border border-white/[0.07] bg-[#0a1210]/80 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.17em] text-slate-500">
                Equity curve
              </p>
              <h2 className="mt-1 text-lg font-black text-white">
                Account trajectory
              </h2>
            </div>
            <div className="rounded-lg border border-emerald-400/15 bg-emerald-400/[0.07] px-3 py-1.5 text-xs font-bold text-emerald-300">
              {money(curve.at(-1)?.balance ?? 0)}
            </div>
          </div>
          <div className="mt-6 h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={curve}
                margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#34d399" stopOpacity={0.28} />
                    <stop offset="1" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#ffffff09" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#52605c"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={28}
                />
                <YAxis
                  stroke="#52605c"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  domain={["dataMin - 100", "dataMax + 100"]}
                />
                <Tooltip
                  contentStyle={{
                    background: "#07100d",
                    border: "1px solid #ffffff16",
                    borderRadius: 12,
                    color: "#e2e8f0",
                    fontSize: 12,
                  }}
                  formatter={(value) => [money(Number(value)), "Balance"]}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#34d399"
                  strokeWidth={2.5}
                  fill="url(#equityFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-3xl border border-white/[0.07] bg-[#0a1210]/80 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.17em] text-slate-500">
                Process quality
              </p>
              <h2 className="mt-1 text-lg font-black text-white">
                Execution score
              </h2>
            </div>
            <Fingerprint className="h-5 w-5 text-emerald-300" />
          </div>
          <div className="mt-7 grid place-items-center">
            <div
              className="relative grid h-40 w-40 place-items-center rounded-full"
              style={{
                background: `conic-gradient(#34d399 ${metrics.planAdherence * 3.6}deg, #13201c 0deg)`,
              }}
            >
              <div className="grid h-[132px] w-[132px] place-items-center rounded-full bg-[#0a1210] text-center">
                <div>
                  <p className="text-4xl font-black tracking-[-0.05em] text-white">
                    {metrics.planAdherence.toFixed(0)}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    discipline
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/[0.025] p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Avg winner
              </p>
              <p className="mt-1 font-black text-emerald-300">
                +{metrics.averageWinR.toFixed(2)}R
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.025] p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Avg loser
              </p>
              <p className="mt-1 font-black text-rose-300">
                {metrics.averageLossR.toFixed(2)}R
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <section className="rounded-3xl border border-white/[0.07] bg-[#0a1210]/80 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.17em] text-slate-500">
                Edge map
              </p>
              <h2 className="mt-1 text-lg font-black text-white">
                Performance by setup
              </h2>
            </div>
            <Target className="h-5 w-5 text-cyan-300" />
          </div>
          <div className="mt-5 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={setups}
                layout="vertical"
                margin={{ left: 12, right: 8 }}
              >
                <CartesianGrid stroke="#ffffff08" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#52605c"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={105}
                  stroke="#7c8985"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#07100d",
                    border: "1px solid #ffffff16",
                    borderRadius: 12,
                    color: "#e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="netR" radius={[0, 8, 8, 0]}>
                  {setups.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.netR >= 0 ? "#34d399" : "#fb7185"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-3xl border border-white/[0.07] bg-[#0a1210]/80 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.17em] text-slate-500">
                Latest activity
              </p>
              <h2 className="mt-1 text-lg font-black text-white">
                Recent executions
              </h2>
            </div>
            <button
              onClick={() => onNavigate("journal")}
              className="text-xs font-bold text-emerald-300 hover:text-emerald-200"
            >
              View all
            </button>
          </div>
          <div className="mt-4 divide-y divide-white/[0.055]">
            {recent.map((trade) => (
              <TradeRow
                key={trade.id}
                trade={trade}
                currency={currency}
                privacy={hidden}
                compact
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function TradeRow({
  trade,
  currency,
  privacy,
  compact = false,
  onEdit,
  onDelete,
}: {
  trade: Trade;
  currency: string;
  privacy: boolean;
  compact?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const positive = trade.pnl - trade.fees >= 0;
  return (
    <div className="flex items-center gap-3 py-3.5">
      <div
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${positive ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300"}`}
      >
        {positive ? (
          <ArrowUpRight className="h-4 w-4" />
        ) : (
          <ArrowDownRight className="h-4 w-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-black text-slate-100">
            {trade.symbol}
          </p>
          <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-500">
            {trade.side}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[11px] text-slate-500">
          {trade.setup} · {new Date(trade.openedAt).toLocaleDateString()}
        </p>
      </div>
      <div className="text-right">
        <p
          className={`text-sm font-black ${positive ? "text-emerald-300" : "text-rose-300"}`}
        >
          {privacy ? "••••" : formatMoney(trade.pnl - trade.fees, currency)}
        </p>
        <p className="mt-0.5 text-[10px] font-bold text-slate-500">
          {trade.rMultiple > 0 ? "+" : ""}
          {trade.rMultiple.toFixed(2)}R
        </p>
      </div>
      {!compact && (
        <div className="ml-1 flex gap-1">
          <button
            onClick={onEdit}
            className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-slate-200"
            aria-label={`Edit ${trade.symbol} trade`}
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg p-2 text-slate-500 hover:bg-rose-400/10 hover:text-rose-300"
            aria-label={`Delete ${trade.symbol} trade`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function toLocalDateTime(value: string): string {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function TradeEditor({
  controller,
  initial,
  onDone,
}: {
  controller: TradeVaultController;
  initial?: Trade;
  onDone: () => void;
}) {
  const data = controller.data!;
  const [symbol, setSymbol] = useState(initial?.symbol ?? "EURUSD");
  const [market, setMarket] = useState<Trade["market"]>(
    initial?.market ?? "Forex",
  );
  const [side, setSide] = useState<Trade["side"]>(initial?.side ?? "Long");
  const [setup, setSetup] = useState(
    initial?.setup ??
      data.playbook.find((item) => item.active)?.name ??
      "Price action",
  );
  const [session, setSession] = useState(initial?.session ?? "London");
  const [result, setResult] = useState<Trade["result"]>(
    initial?.result ?? "Win",
  );
  const [rMultiple, setRMultiple] = useState(String(initial?.rMultiple ?? 2));
  const [pnl, setPnl] = useState(String(initial?.pnl ?? 200));
  const [fees, setFees] = useState(String(initial?.fees ?? 0));
  const [riskAmount, setRiskAmount] = useState(
    String(initial?.riskAmount ?? 100),
  );
  const [openedAt, setOpenedAt] = useState(
    toLocalDateTime(initial?.openedAt ?? new Date().toISOString()),
  );
  const [confidence, setConfidence] = useState<Trade["confidence"]>(
    initial?.confidence ?? 3,
  );
  const [followedPlan, setFollowedPlan] = useState(
    initial?.followedPlan ?? true,
  );
  const [emotion, setEmotion] = useState(initial?.emotion ?? "Calm");
  const [mistake, setMistake] = useState(initial?.mistake ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [screenshotUrl, setScreenshotUrl] = useState(
    initial?.screenshotUrl ?? "",
  );
  const [tags, setTags] = useState(initial?.tags.join(", ") ?? "");
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const numeric = [rMultiple, pnl, fees, riskAmount].map(Number);
    if (
      !symbol.trim() ||
      !setup.trim() ||
      numeric.some((value) => !Number.isFinite(value))
    ) {
      setError("Symbol, setup, and numeric performance fields are required.");
      return;
    }
    if (screenshotUrl && !/^https:\/\//i.test(screenshotUrl)) {
      setError("Screenshot links must use HTTPS.");
      return;
    }
    const now = new Date().toISOString();
    const input: Omit<Trade, "id" | "createdAt" | "updatedAt"> = {
      symbol: symbol.trim().toUpperCase().slice(0, 20),
      market,
      side,
      setup: setup.trim().slice(0, 80),
      session: session.trim().slice(0, 40),
      result,
      rMultiple: Number(rMultiple),
      pnl: Number(pnl),
      fees: Math.max(0, Number(fees)),
      riskAmount: Math.max(0, Number(riskAmount)),
      openedAt: new Date(openedAt).toISOString(),
      closedAt: initial?.closedAt,
      confidence,
      followedPlan,
      emotion: emotion.trim().slice(0, 80),
      mistake: mistake.trim().slice(0, 200) || undefined,
      notes: notes.slice(0, 2000),
      screenshotUrl: screenshotUrl || undefined,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 20),
    };
    if (initial)
      controller.updateTrade({ ...initial, ...input, updatedAt: now });
    else controller.addTrade(input);
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="rounded-3xl border border-white/[0.07] bg-[#0a1210]/80 p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
              Execution record
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-white">
              {initial ? "Edit trade" : "Log a trade"}
            </h2>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-300" /> Saved locally
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
          >
            {error}
          </div>
        )}

        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label>
            <span className={labelClass}>Symbol</span>
            <input
              className={fieldClass}
              value={symbol}
              onChange={(event) => setSymbol(event.target.value)}
              maxLength={20}
              required
            />
          </label>
          <label>
            <span className={labelClass}>Market</span>
            <select
              className={fieldClass}
              value={market}
              onChange={(event) =>
                setMarket(event.target.value as Trade["market"])
              }
            >
              {markets.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span className={labelClass}>Direction</span>
            <select
              className={fieldClass}
              value={side}
              onChange={(event) => setSide(event.target.value as Trade["side"])}
            >
              <option>Long</option>
              <option>Short</option>
            </select>
          </label>
          <label>
            <span className={labelClass}>Opened at</span>
            <input
              type="datetime-local"
              className={fieldClass}
              value={openedAt}
              onChange={(event) => setOpenedAt(event.target.value)}
              required
            />
          </label>
          <label className="xl:col-span-2">
            <span className={labelClass}>Setup</span>
            <input
              list="playbook-setups"
              className={fieldClass}
              value={setup}
              onChange={(event) => setSetup(event.target.value)}
              maxLength={80}
              required
            />
            <datalist id="playbook-setups">
              {data.playbook
                .filter((item) => item.active)
                .map((item) => (
                  <option key={item.id} value={item.name} />
                ))}
            </datalist>
          </label>
          <label>
            <span className={labelClass}>Session</span>
            <select
              className={fieldClass}
              value={session}
              onChange={(event) => setSession(event.target.value)}
            >
              <option>Asia</option>
              <option>London</option>
              <option>New York</option>
              <option>Overlap</option>
              <option>Unspecified</option>
            </select>
          </label>
          <label>
            <span className={labelClass}>Result</span>
            <select
              className={fieldClass}
              value={result}
              onChange={(event) =>
                setResult(event.target.value as Trade["result"])
              }
            >
              <option>Win</option>
              <option>Loss</option>
              <option>Breakeven</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <section className="rounded-3xl border border-white/[0.07] bg-[#0a1210]/80 p-5 sm:p-7">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-300" />
            <h3 className="font-black text-white">Performance and risk</h3>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label>
              <span className={labelClass}>R multiple</span>
              <input
                type="number"
                step="0.01"
                className={fieldClass}
                value={rMultiple}
                onChange={(event) => setRMultiple(event.target.value)}
                required
              />
            </label>
            <label>
              <span className={labelClass}>Realized PnL</span>
              <input
                type="number"
                step="0.01"
                className={fieldClass}
                value={pnl}
                onChange={(event) => setPnl(event.target.value)}
                required
              />
            </label>
            <label>
              <span className={labelClass}>Fees</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className={fieldClass}
                value={fees}
                onChange={(event) => setFees(event.target.value)}
                required
              />
            </label>
            <label>
              <span className={labelClass}>Amount risked</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className={fieldClass}
                value={riskAmount}
                onChange={(event) => setRiskAmount(event.target.value)}
                required
              />
            </label>
          </div>
          <div className="mt-6">
            <span className={labelClass}>Pre-trade confidence</span>
            <div className="grid grid-cols-5 gap-2">
              {([1, 2, 3, 4, 5] as const).map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setConfidence(score)}
                  className={`rounded-xl border py-2.5 text-sm font-black transition ${confidence === score ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-200" : "border-white/[0.07] bg-white/[0.025] text-slate-600 hover:text-slate-300"}`}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/[0.07] bg-[#0a1210]/80 p-5 sm:p-7">
          <div className="flex items-center gap-2">
            <BookOpenCheck className="h-5 w-5 text-emerald-300" />
            <h3 className="font-black text-white">Execution quality</h3>
          </div>
          <label className="mt-5 flex cursor-pointer items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
            <span>
              <span className="block text-sm font-bold text-slate-200">
                Followed the plan
              </span>
              <span className="mt-1 block text-[11px] text-slate-500">
                No impulse entries or rule violations
              </span>
            </span>
            <input
              type="checkbox"
              checked={followedPlan}
              onChange={(event) => setFollowedPlan(event.target.checked)}
              className="h-5 w-5 accent-emerald-400"
            />
          </label>
          <label className="mt-4 block">
            <span className={labelClass}>Emotional state</span>
            <select
              className={fieldClass}
              value={emotion}
              onChange={(event) => setEmotion(event.target.value)}
            >
              <option>Calm</option>
              <option>Focused</option>
              <option>Hesitant</option>
              <option>FOMO</option>
              <option>Frustrated</option>
              <option>Overconfident</option>
            </select>
          </label>
          <label className="mt-4 block">
            <span className={labelClass}>Mistake or rule break</span>
            <input
              className={fieldClass}
              value={mistake}
              onChange={(event) => setMistake(event.target.value)}
              maxLength={200}
              placeholder="Optional review note"
            />
          </label>
        </section>
      </div>

      <section className="rounded-3xl border border-white/[0.07] bg-[#0a1210]/80 p-5 sm:p-7">
        <div className="grid gap-4 lg:grid-cols-2">
          <label>
            <span className={labelClass}>Review notes</span>
            <textarea
              className={`${fieldClass} min-h-28 resize-y`}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={2000}
              placeholder="Context, reasoning, management, and lessons..."
            />
          </label>
          <div className="space-y-4">
            <label className="block">
              <span className={labelClass}>Screenshot URL</span>
              <input
                type="url"
                className={fieldClass}
                value={screenshotUrl}
                onChange={(event) => setScreenshotUrl(event.target.value)}
                placeholder="https://..."
              />
            </label>
            <label className="block">
              <span className={labelClass}>Tags</span>
              <input
                className={fieldClass}
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="A-setup, news-free, reviewed"
              />
            </label>
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onDone}
          className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-400 hover:bg-white/5"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-xl bg-emerald-400 px-6 py-3 text-sm font-black text-[#03100c] shadow-[0_12px_35px_rgba(52,211,153,.18)] hover:bg-emerald-300"
        >
          {initial ? "Save changes" : "Commit to journal"}
        </button>
      </div>
    </form>
  );
}

function JournalView({
  controller,
  onEdit,
}: {
  controller: TradeVaultController;
  onEdit: (trade: Trade) => void;
}) {
  const data = controller.data!;
  const [query, setQuery] = useState("");
  const [resultFilter, setResultFilter] = useState("All");
  const [setupFilter, setSetupFilter] = useState("All");
  const setups = [...new Set(data.trades.map((trade) => trade.setup))].sort();
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return [...data.trades]
      .filter(
        (trade) => resultFilter === "All" || trade.result === resultFilter,
      )
      .filter((trade) => setupFilter === "All" || trade.setup === setupFilter)
      .filter(
        (trade) =>
          !normalized ||
          [trade.symbol, trade.setup, trade.notes, ...trade.tags]
            .join(" ")
            .toLowerCase()
            .includes(normalized),
      )
      .sort(
        (a, b) =>
          new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime(),
      );
  }, [data.trades, query, resultFilter, setupFilter]);
  return (
    <section className="rounded-3xl border border-white/[0.07] bg-[#0a1210]/80 p-5 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
            Evidence ledger
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-white">
            Trade journal
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Search, review, and improve every execution.
          </p>
        </div>
        <span className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-xs font-bold text-slate-400">
          {filtered.length} of {data.trades.length} trades
        </span>
      </div>
      <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_180px_220px]">
        <label className="relative">
          <span className="sr-only">Search trades</span>
          <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-600" />
          <input
            className={`${fieldClass} pl-10`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search symbol, setup, note, or tag"
          />
        </label>
        <select
          aria-label="Filter by result"
          className={fieldClass}
          value={resultFilter}
          onChange={(event) => setResultFilter(event.target.value)}
        >
          <option>All</option>
          <option>Win</option>
          <option>Loss</option>
          <option>Breakeven</option>
        </select>
        <select
          aria-label="Filter by setup"
          className={fieldClass}
          value={setupFilter}
          onChange={(event) => setSetupFilter(event.target.value)}
        >
          <option>All</option>
          {setups.map((setup) => (
            <option key={setup}>{setup}</option>
          ))}
        </select>
      </div>
      <div className="mt-5 divide-y divide-white/[0.055]">
        {filtered.map((trade) => (
          <TradeRow
            key={trade.id}
            trade={trade}
            currency={data.settings.account.currency}
            privacy={data.settings.privacyMode}
            onEdit={() => onEdit(trade)}
            onDelete={() => {
              if (window.confirm(`Delete ${trade.symbol} from the journal?`))
                controller.deleteTrade(trade.id);
            }}
          />
        ))}
        {!filtered.length && (
          <div className="py-16 text-center">
            <Search className="mx-auto h-8 w-8 text-slate-700" />
            <p className="mt-4 font-bold text-slate-400">
              No trades match these filters.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function PlaybookView({ controller }: { controller: TradeVaultController }) {
  const data = controller.data!;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [checklist, setChecklist] = useState("");
  const performance = useMemo(
    () => groupPerformance(data.trades, (trade) => trade.setup),
    [data.trades],
  );
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    controller.addPlaybookSetup({
      name: name.trim(),
      description: description.trim(),
      checklist: checklist
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 30),
      active: true,
    });
    setName("");
    setDescription("");
    setChecklist("");
  };
  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
      <section className="rounded-3xl border border-white/[0.07] bg-[#0a1210]/80 p-5 sm:p-7">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
            Repeatable edge
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-white">
            Trading playbook
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Turn your best executions into explicit, testable setups.
          </p>
        </div>
        <div className="mt-7 space-y-4">
          {data.playbook.map((setup) => {
            const stats = performance.find((item) => item.name === setup.name);
            return (
              <article
                key={setup.id}
                className="rounded-2xl border border-white/[0.065] bg-white/[0.025] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-400/10">
                        <Target className="h-3.5 w-3.5 text-emerald-300" />
                      </span>
                      <h3 className="font-black text-white">{setup.name}</h3>
                    </div>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                      {setup.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-bold text-slate-400">
                      {stats?.trades ?? 0} trades
                    </span>
                    <span
                      className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold ${(stats?.netR ?? 0) >= 0 ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300"}`}
                    >
                      {(stats?.netR ?? 0) > 0 ? "+" : ""}
                      {(stats?.netR ?? 0).toFixed(2)}R
                    </span>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {setup.checklist.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-2 text-xs text-slate-400"
                    >
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      {item}
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
          {!data.playbook.length && (
            <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-slate-500">
              No playbook setups yet.
            </div>
          )}
        </div>
      </section>

      <form
        onSubmit={submit}
        className="h-fit rounded-3xl border border-white/[0.07] bg-[#0a1210]/80 p-5 sm:p-7"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-cyan-300" />
          <h3 className="font-black text-white">Define a setup</h3>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Make the entry criteria clear enough that another trader could audit
          the decision.
        </p>
        <label className="mt-6 block">
          <span className={labelClass}>Setup name</span>
          <input
            className={fieldClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            required
            placeholder="Example: Opening range reclaim"
          />
        </label>
        <label className="mt-4 block">
          <span className={labelClass}>Description</span>
          <textarea
            className={`${fieldClass} min-h-24 resize-y`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={500}
          />
        </label>
        <label className="mt-4 block">
          <span className={labelClass}>Checklist, one rule per line</span>
          <textarea
            className={`${fieldClass} min-h-36 resize-y`}
            value={checklist}
            onChange={(event) => setChecklist(event.target.value)}
            placeholder={
              "Bias is aligned\nLiquidity is taken\nMinimum 2R available"
            }
          />
        </label>
        <button className="mt-5 w-full rounded-xl bg-emerald-400 px-5 py-3 text-sm font-black text-[#03100c] hover:bg-emerald-300">
          Add to playbook
        </button>
      </form>
    </div>
  );
}

function SettingsView({ controller }: { controller: TradeVaultController }) {
  const data = controller.data!;
  const [account, setAccount] = useState(data.settings.account);
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [message, setMessage] = useState("");

  const saveAccount = (event: FormEvent) => {
    event.preventDefault();
    controller.updateSettings({ ...data.settings, account });
    setMessage("Account settings saved locally.");
  };
  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      const text = await file.text();
      if (file.name.toLowerCase().endsWith(".csv")) {
        const parsed = importTradesCsv(text);
        controller.importTrades(parsed.trades);
        setMessage(
          `Imported ${parsed.trades.length} trades${parsed.errors.length ? ` with ${parsed.errors.length} skipped rows` : ""}.`,
        );
      } else {
        await controller.importData(parseTradeVaultJson(text));
        setMessage("Backup imported successfully.");
      }
    } catch (reason) {
      setMessage(
        reason instanceof Error
          ? reason.message
          : "Unable to import this file.",
      );
    }
  };
  const toggleEncryption = async () => {
    try {
      if (data.settings.encryptionEnabled) {
        await controller.disableEncryption();
        setPassphrase("");
        setConfirmPassphrase("");
        setMessage("Local database encryption disabled.");
      } else {
        if (passphrase.length < 10 || passphrase !== confirmPassphrase) {
          setMessage("Use a matching passphrase with at least 10 characters.");
          return;
        }
        await controller.enableEncryption(passphrase);
        setPassphrase("");
        setConfirmPassphrase("");
        setMessage("Local database encrypted with AES-256-GCM.");
      }
    } catch (reason) {
      setMessage(
        reason instanceof Error
          ? reason.message
          : "Encryption setting could not be changed.",
      );
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          role="status"
          className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.07] px-4 py-3 text-sm text-emerald-200"
        >
          {message}
        </div>
      )}
      <div className="grid gap-6 xl:grid-cols-2">
        <form
          onSubmit={saveAccount}
          className="rounded-3xl border border-white/[0.07] bg-[#0a1210]/80 p-5 sm:p-7"
        >
          <div className="flex items-center gap-2">
            <CircleDollarSign className="h-5 w-5 text-emerald-300" />
            <h2 className="text-lg font-black text-white">Trading account</h2>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Used for equity analytics and risk guardrails.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className={labelClass}>Account name</span>
              <input
                className={fieldClass}
                value={account.name}
                onChange={(event) =>
                  setAccount({ ...account, name: event.target.value })
                }
                required
              />
            </label>
            <label>
              <span className={labelClass}>Currency</span>
              <select
                className={fieldClass}
                value={account.currency}
                onChange={(event) =>
                  setAccount({
                    ...account,
                    currency: event.target.value as typeof account.currency,
                  })
                }
              >
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
                <option>MAD</option>
              </select>
            </label>
            <label>
              <span className={labelClass}>Starting balance</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className={fieldClass}
                value={account.startingBalance}
                onChange={(event) =>
                  setAccount({
                    ...account,
                    startingBalance: Number(event.target.value),
                  })
                }
              />
            </label>
            <label>
              <span className={labelClass}>Risk limit per trade (%)</span>
              <input
                type="number"
                min="0.01"
                max="100"
                step="0.1"
                className={fieldClass}
                value={account.riskLimitPercent}
                onChange={(event) =>
                  setAccount({
                    ...account,
                    riskLimitPercent: Number(event.target.value),
                  })
                }
              />
            </label>
            <label>
              <span className={labelClass}>Daily loss limit (%)</span>
              <input
                type="number"
                min="0.01"
                max="100"
                step="0.1"
                className={fieldClass}
                value={account.dailyLossLimitPercent}
                onChange={(event) =>
                  setAccount({
                    ...account,
                    dailyLossLimitPercent: Number(event.target.value),
                  })
                }
              />
            </label>
          </div>
          <button className="mt-5 rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-black text-[#03100c] hover:bg-emerald-300">
            Save account
          </button>
        </form>

        <section className="rounded-3xl border border-white/[0.07] bg-[#0a1210]/80 p-5 sm:p-7">
          <div className="flex items-center gap-2">
            <LockKeyhole className="h-5 w-5 text-cyan-300" />
            <h2 className="text-lg font-black text-white">Vault encryption</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Protect IndexedDB at rest with AES-256-GCM and a passphrase-derived
            key. There is no password recovery.
          </p>
          <div className="mt-6 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-300">
                Encryption status
              </span>
              <span
                className={`rounded-lg px-2.5 py-1 text-[10px] font-black ${data.settings.encryptionEnabled ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`}
              >
                {data.settings.encryptionEnabled ? "ENABLED" : "PLAIN LOCAL"}
              </span>
            </div>
          </div>
          {!data.settings.encryptionEnabled && (
            <div className="mt-4 grid gap-3">
              <input
                type="password"
                className={fieldClass}
                value={passphrase}
                onChange={(event) => setPassphrase(event.target.value)}
                placeholder="Passphrase, minimum 10 characters"
                autoComplete="new-password"
              />
              <input
                type="password"
                className={fieldClass}
                value={confirmPassphrase}
                onChange={(event) => setConfirmPassphrase(event.target.value)}
                placeholder="Confirm passphrase"
                autoComplete="new-password"
              />
            </div>
          )}
          <button
            type="button"
            onClick={() => void toggleEncryption()}
            className="mt-5 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5"
          >
            {data.settings.encryptionEnabled
              ? "Disable encryption"
              : "Enable encryption"}
          </button>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <section className="rounded-3xl border border-white/[0.07] bg-[#0a1210]/80 p-5 sm:p-7">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-emerald-300" />
            <h2 className="text-lg font-black text-white">Portable data</h2>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Back up the complete workspace or move trades through a
            spreadsheet-safe CSV.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() =>
                downloadText(
                  `tradevault-${new Date().toISOString().slice(0, 10)}.json`,
                  JSON.stringify(data, null, 2),
                  "application/json",
                )
              }
              className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 text-left hover:bg-white/[0.05]"
            >
              <Download className="h-5 w-5 text-emerald-300" />
              <span>
                <span className="block text-sm font-bold text-slate-200">
                  Full JSON backup
                </span>
                <span className="mt-1 block text-[10px] text-slate-500">
                  Trades, playbook, and settings
                </span>
              </span>
            </button>
            <button
              onClick={() =>
                downloadText(
                  `tradevault-trades-${new Date().toISOString().slice(0, 10)}.csv`,
                  exportTradesCsv(data),
                  "text/csv;charset=utf-8",
                )
              }
              className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 text-left hover:bg-white/[0.05]"
            >
              <Download className="h-5 w-5 text-cyan-300" />
              <span>
                <span className="block text-sm font-bold text-slate-200">
                  Trades CSV
                </span>
                <span className="mt-1 block text-[10px] text-slate-500">
                  Formula-injection protected
                </span>
              </span>
            </button>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/10 p-4 text-left hover:border-emerald-400/20 hover:bg-emerald-400/[0.03]">
              <FileUp className="h-5 w-5 text-amber-300" />
              <span>
                <span className="block text-sm font-bold text-slate-200">
                  Import backup or CSV
                </span>
                <span className="mt-1 block text-[10px] text-slate-500">
                  Validated before it enters the vault
                </span>
              </span>
              <input
                type="file"
                accept=".json,.csv,application/json,text/csv"
                className="sr-only"
                onChange={(event) => {
                  void importFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </label>
            <button
              onClick={() =>
                void controller
                  .loadDemo()
                  .then(() => setMessage("Demo workspace loaded."))
              }
              className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 text-left hover:bg-white/[0.05]"
            >
              <Sparkles className="h-5 w-5 text-violet-300" />
              <span>
                <span className="block text-sm font-bold text-slate-200">
                  Load demo workspace
                </span>
                <span className="mt-1 block text-[10px] text-slate-500">
                  Explore with realistic sample trades
                </span>
              </span>
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-rose-400/10 bg-rose-400/[0.025] p-5 sm:p-7">
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-rose-300" />
            <h2 className="text-lg font-black text-white">Reset workspace</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Permanently remove local trades, playbook changes, and settings from
            this browser.
          </p>
          <button
            onClick={() => {
              if (
                window.confirm(
                  "Delete every local TradeVault record? Export a backup first.",
                )
              )
                void controller
                  .reset()
                  .then(() => setMessage("Local workspace reset."));
            }}
            className="mt-6 rounded-xl border border-rose-400/20 bg-rose-400/10 px-5 py-2.5 text-sm font-bold text-rose-200 hover:bg-rose-400/15"
          >
            Reset local data
          </button>
        </section>
      </div>
    </div>
  );
}

function UnlockView({ controller }: { controller: TradeVaultController }) {
  const [passphrase, setPassphrase] = useState("");
  return (
    <main className="grid min-h-screen place-items-center bg-[#050a08] p-5">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void controller.unlock(passphrase);
        }}
        className="w-full max-w-md rounded-[30px] border border-white/[0.08] bg-[#0a1210] p-7 shadow-2xl sm:p-9"
      >
        <TradeVaultLogo />
        <div className="mt-8 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-400/10">
          <Lock className="h-6 w-6 text-emerald-300" />
        </div>
        <h1 className="mt-5 text-2xl font-black tracking-[-0.04em] text-white">
          Unlock your trading vault
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          This device contains an encrypted TradeVault database. Your passphrase
          never leaves the browser.
        </p>
        {controller.error && (
          <div
            role="alert"
            className="mt-4 rounded-xl bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
          >
            {controller.error}
          </div>
        )}
        <label className="mt-6 block">
          <span className={labelClass}>Vault passphrase</span>
          <input
            autoFocus
            type="password"
            className={fieldClass}
            value={passphrase}
            onChange={(event) => setPassphrase(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <button className="mt-4 w-full rounded-xl bg-emerald-400 px-5 py-3 text-sm font-black text-[#03100c] hover:bg-emerald-300">
          Unlock vault
        </button>
      </form>
    </main>
  );
}

export function TradeVaultApp() {
  const controller = useTradeVault();
  const [active, setActive] = useState<View>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [editing, setEditing] = useState<Trade | undefined>();

  if (controller.status === "loading")
    return (
      <main className="grid min-h-screen place-items-center bg-[#050a08]">
        <div className="text-center">
          <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-emerald-300" />
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-600">
            Opening local vault
          </p>
        </div>
      </main>
    );
  if (controller.status === "locked")
    return <UnlockView controller={controller} />;
  if (controller.status === "error" || !controller.data)
    return (
      <main className="grid min-h-screen place-items-center bg-[#050a08] p-6">
        <div className="max-w-md text-center">
          <X className="mx-auto h-8 w-8 text-rose-300" />
          <h1 className="mt-4 text-xl font-black text-white">
            TradeVault could not start
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {controller.error || "The local database is unavailable."}
          </p>
        </div>
      </main>
    );

  const data = controller.data;
  const changeView = (view: View) => {
    setEditing(undefined);
    setActive(view);
  };
  const title =
    navItems.find((item) => item.id === active)?.label ?? "TradeVault";
  const togglePrivacy = () =>
    controller.updateSettings({
      ...data.settings,
      privacyMode: !data.settings.privacyMode,
    });
  const toggleTheme = () => {
    const theme = data.settings.theme === "dark" ? "light" : "dark";
    controller.updateSettings({ ...data.settings, theme });
    document.documentElement.dataset.theme = theme;
  };

  return (
    <div className="min-h-screen bg-[#050a08] text-slate-100">
      <Sidebar
        active={active}
        onChange={changeView}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-20 border-b border-white/[0.055] bg-[#050a08]/80 px-4 py-3 backdrop-blur-xl sm:px-7">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-xl border border-white/[0.07] p-2.5 text-slate-400 lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                  Workspace
                </p>
                <h1 className="text-sm font-black text-slate-200 sm:text-base">
                  {title}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {data.settings.encryptionEnabled && (
                <button
                  onClick={() => void controller.lock()}
                  className="hidden items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.055] px-3 py-2 text-xs font-bold text-emerald-300 sm:flex"
                >
                  <Lock className="h-3.5 w-3.5" /> Lock vault
                </button>
              )}
              <button
                onClick={togglePrivacy}
                className="rounded-xl border border-white/[0.07] p-2.5 text-slate-500 hover:bg-white/[0.04] hover:text-slate-200"
                aria-label="Toggle privacy mode"
              >
                {data.settings.privacyMode ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={toggleTheme}
                className="rounded-xl border border-white/[0.07] p-2.5 text-slate-500 hover:bg-white/[0.04] hover:text-slate-200"
                aria-label="Toggle theme"
              >
                {data.settings.theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => changeView("log")}
                className="hidden items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-black text-[#03100c] hover:bg-emerald-300 sm:flex"
              >
                <Plus className="h-4 w-4" /> Log trade
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] p-4 pb-24 sm:p-7 lg:pb-8">
          {active === "dashboard" && (
            <DashboardView data={data} onNavigate={changeView} />
          )}
          {active === "journal" && !editing && (
            <JournalView
              controller={controller}
              onEdit={(trade) => setEditing(trade)}
            />
          )}
          {(active === "log" || editing) && (
            <TradeEditor
              key={editing?.id ?? "new"}
              controller={controller}
              initial={editing}
              onDone={() => {
                setEditing(undefined);
                setActive("journal");
              }}
            />
          )}
          {active === "playbook" && !editing && (
            <PlaybookView controller={controller} />
          )}
          {active === "settings" && !editing && (
            <SettingsView controller={controller} />
          )}
        </main>
      </div>

      <nav
        className="fixed inset-x-3 bottom-3 z-20 grid grid-cols-5 rounded-2xl border border-white/[0.08] bg-[#07100d]/95 p-1.5 shadow-2xl backdrop-blur-xl lg:hidden"
        aria-label="Mobile navigation"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const selected = active === item.id;
          return (
            <button
              key={item.id}
              aria-label={item.label}
              onClick={() => changeView(item.id)}
              className={`grid place-items-center gap-1 rounded-xl py-2 text-[9px] font-bold ${selected ? "bg-emerald-400/10 text-emerald-300" : "text-slate-600"}`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden min-[420px]:block">
                {item.label.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
