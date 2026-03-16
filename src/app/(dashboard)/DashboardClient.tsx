"use client";

import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Scale,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/ui/kpi-card";
import type {
  CategoryBreakdown,
  KpiSummary,
  LocationSummary,
  MonthlyTrend,
} from "@/features/dashboard/types";
import { cn } from "@/lib/utils";

interface DashboardClientProps {
  kpi: KpiSummary;
  locations: LocationSummary[];
  topRecettes: CategoryBreakdown[];
  topCharges: CategoryBreakdown[];
  trend: MonthlyTrend[];
  month: number;
  year: number;
}

const fmt = (n: number) =>
  Number(n).toLocaleString("fr-MA", { minimumFractionDigits: 2 }) + " MAD";
const fmtCompact = (n: number) =>
  Number(n).toLocaleString("fr-MA", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
const fmtDh = (n: number) =>
  Number(n).toLocaleString("fr-MA", { maximumFractionDigits: 0 }) + " DH";

const MONTH_NAMES = [
  "Janvier",
  "Fevrier",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Aout",
  "Septembre",
  "Octobre",
  "Novembre",
  "Decembre",
];

const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

export function DashboardClient({
  kpi,
  locations,
  topRecettes,
  topCharges,
  trend,
  month,
  year,
}: DashboardClientProps) {
  const router = useRouter();
  const now = new Date();
  const isCurrentPeriod = month === now.getMonth() + 1 && year === now.getFullYear();
  const monthlyFlow = kpi.total_recettes + kpi.total_charges;
  const incomeShare = monthlyFlow > 0 ? (kpi.total_recettes / monthlyFlow) * 100 : 0;
  const expenseShare = monthlyFlow > 0 ? (kpi.total_charges / monthlyFlow) * 100 : 0;
  const netMargin = kpi.total_recettes > 0 ? (kpi.net_balance / kpi.total_recettes) * 100 : 0;
  const flowBreakdown = [
    { name: "Recettes", value: kpi.total_recettes, color: "#27bdfb" },
    { name: "Charges", value: kpi.total_charges, color: "#f43f5e" },
  ].filter((item) => item.value > 0);
  const flowTotal = flowBreakdown.reduce((sum, item) => sum + item.value, 0);
  const netTrend = trend.map((item) => ({
    ...item,
    net: item.recettes - item.charges,
  }));
  const panelClass =
    "relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 p-6 backdrop-blur dark:border-white/10 dark:bg-slate-900/70";

  function goToPeriod(nextMonth: number, nextYear: number) {
    router.push(`/?month=${nextMonth}&year=${nextYear}`);
  }

  function handleMonthChange(e: React.ChangeEvent<HTMLSelectElement>) {
    goToPeriod(Number(e.target.value), year);
  }

  function handleYearChange(e: React.ChangeEvent<HTMLSelectElement>) {
    goToPeriod(month, Number(e.target.value));
  }

  function shiftMonth(offset: number) {
    const date = new Date(year, month - 1 + offset, 1);
    goToPeriod(date.getMonth() + 1, date.getFullYear());
  }

  function goToCurrentPeriod() {
    goToPeriod(now.getMonth() + 1, now.getFullYear());
  }

  return (
    <div className="relative space-y-7">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 md:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,78,238,0.20),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(39,189,251,0.12),transparent_40%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(39,189,251,0.22),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(244,63,94,0.14),transparent_42%)]" />
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 backdrop-blur dark:border-white/15 dark:bg-slate-800/70 dark:text-slate-100">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Dashboard overview
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 md:text-3xl">
              Tableau de bord
            </h1>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 md:text-[15px]">
              Suivi global des encaissements, des sorties et de l&apos;equilibre financier.
              Utilisez les filtres pour naviguer rapidement entre les periodes.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <MetricChip label="Flux mensuel" value={fmt(monthlyFlow)} />
              <MetricChip label="Marge nette" value={`${netMargin.toFixed(1)}%`} />
              <MetricChip label="Recettes" value={`${incomeShare.toFixed(0)}%`} />
            </div>
          </div>

          <div className="relative z-10 w-full max-w-xl rounded-2xl border border-slate-300/80 bg-white/80 p-4 backdrop-blur dark:border-white/15 dark:bg-slate-800/70">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-100">
                <CalendarDays className="h-4 w-4 text-[var(--logo-primary)] dark:text-[var(--logo-secondary)]" />
                Date filters
              </div>
              <span className="rounded-full border border-slate-300/80 bg-white/85 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-white/15 dark:bg-slate-700/80 dark:text-slate-100">
                {MONTH_NAMES[month - 1]} {year}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
                  Month
                </span>
                <select
                  value={month}
                  onChange={handleMonthChange}
                  className="h-10 w-full rounded-lg border border-slate-300/80 bg-white/90 px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--logo-secondary)] dark:border-white/15 dark:bg-slate-900/40 dark:text-slate-100"
                >
                  {MONTH_NAMES.map((name, i) => (
                    <option key={i + 1} value={i + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
                  Year
                </span>
                <select
                  value={year}
                  onChange={handleYearChange}
                  className="h-10 w-full rounded-lg border border-slate-300/80 bg-white/90 px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--logo-secondary)] dark:border-white/15 dark:bg-slate-900/40 dark:text-slate-100"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-slate-300/80 bg-white/85 text-slate-700 hover:bg-white dark:border-white/20 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/15"
                onClick={() => shiftMonth(-1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-slate-300/80 bg-white/85 text-slate-700 hover:bg-white dark:border-white/20 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/15"
                onClick={() => shiftMonth(1)}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5 bg-[var(--logo-primary)] text-white hover:opacity-90 dark:bg-[var(--logo-secondary)] dark:text-slate-950 dark:hover:opacity-90"
                onClick={goToCurrentPeriod}
                disabled={isCurrentPeriod}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Current month
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          title="Total Recettes"
          value={kpi.total_recettes}
          color="green"
          prefix="+"
          badge="Entrees"
          footer="Part du flux"
          progress={incomeShare}
          icon={TrendingUp}
        />
        <KpiCard
          title="Total Charges"
          value={kpi.total_charges}
          color="red"
          prefix="-"
          badge="Sorties"
          footer="Poids du flux"
          progress={expenseShare}
          icon={TrendingDown}
        />
        <KpiCard
          title="Solde Net"
          value={kpi.net_balance}
          color="auto"
          badge={kpi.net_balance >= 0 ? "Equilibre" : "Alerte"}
          footer="Marge nette"
          progress={Math.min(100, Math.abs(netMargin))}
          icon={Scale}
        />
      </div>


      <div className={panelClass}>
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-slate-400/60 to-transparent" />
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Recapitulatif par caisse</h2>
          <div className="inline-flex items-center rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-300">
            {locations.length} caisse{locations.length > 1 ? "s" : ""}
          </div>
        </div>

        {locations.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Aucune caisse active</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {locations.map((loc) => {
              const flow = loc.recettes + loc.charges;
              const recettesRatio = flow > 0 ? (loc.recettes / flow) * 100 : 0;
              const chargesRatio = flow > 0 ? (loc.charges / flow) * 100 : 0;
              return (
                <div
                  key={loc.location_id}
                  className="rounded-xl border border-slate-200/80 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-800/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: loc.location_color }}
                      />
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {loc.location_name}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-semibold",
                        loc.net >= 0
                          ? "border-[#104eee33] bg-[#104eee14] text-[#104eee] dark:border-[#27bdfb33] dark:bg-[#27bdfb1a] dark:text-[#56dffe]"
                          : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200"
                      )}
                    >
                      Net: {fmtDh(loc.net)}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-slate-200/70 bg-white/80 p-2.5 dark:border-white/10 dark:bg-slate-900/35">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                        Recettes
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--logo-secondary)]">
                        {fmtDh(loc.recettes)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200/70 bg-white/80 p-2.5 dark:border-white/10 dark:bg-slate-900/35">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                        Charges
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--logo-variation)]">
                        {fmtDh(loc.charges)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Mix financier</span>
                      <span>{flow > 0 ? `${Math.round(recettesRatio)} / ${Math.round(chargesRatio)} %` : "0 / 0 %"}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-700/60">
                      <div className="flex h-full">
                        <div
                          className="h-full bg-gradient-to-r from-[#104eee] to-[#27bdfb]"
                          style={{ width: `${recettesRatio}%` }}
                        />
                        <div
                          className="h-full bg-gradient-to-r from-rose-400 to-rose-500"
                          style={{ width: `${chargesRatio}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-slate-200/70 bg-white/80 px-2.5 py-2 text-slate-600 dark:border-white/10 dark:bg-slate-900/35 dark:text-slate-300">
                      <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Transferts In</span>
                      <p className="mt-1 font-semibold text-sky-700 dark:text-sky-300">{fmtDh(loc.transfers_in)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200/70 bg-white/80 px-2.5 py-2 text-slate-600 dark:border-white/10 dark:bg-slate-900/35 dark:text-slate-300">
                      <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Transferts Out</span>
                      <p className="mt-1 font-semibold text-rose-600 dark:text-rose-300">{fmtDh(loc.transfers_out)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={panelClass}>
          <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[var(--logo-secondary)]/70 to-transparent" />
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">Top Categories - Recettes</h2>
          {topRecettes.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Aucune donnee</p>
          ) : (
            <ResponsiveContainer width="100%" height={205}>
              <BarChart data={topRecettes} margin={{ top: 6, right: 10, left: 8, bottom: 62 }} barGap={8}>
                <defs>
                  <linearGradient id="recettesBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#27bdfb" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#104eee" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="2 6" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11 }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${Number(v).toLocaleString("fr-MA")}`}
                />
                <Tooltip
                  cursor={{ fill: "rgba(16, 78, 238, 0.06)" }}
                  content={<ChartTooltip />}
                />
                <Bar dataKey="total" name="Recettes" fill="url(#recettesBar)" radius={[10, 10, 4, 4]} barSize={20}>
                  <LabelList
                    dataKey="total"
                    position="top"
                    formatter={(value) => fmtCompact(Number(value ?? 0))}
                    className="fill-slate-500 text-[10px] font-medium"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={panelClass}>
          <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[var(--logo-variation)]/70 to-transparent" />
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">Top Categories - Charges</h2>
          {topCharges.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Aucune donnee</p>
          ) : (
            <ResponsiveContainer width="100%" height={205}>
              <BarChart data={topCharges} margin={{ top: 6, right: 10, left: 8, bottom: 62 }} barGap={8}>
                <defs>
                  <linearGradient id="chargesBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb7185" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.82} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="2 6" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11 }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${Number(v).toLocaleString("fr-MA")}`}
                />
                <Tooltip
                  cursor={{ fill: "rgba(244, 63, 94, 0.08)" }}
                  content={<ChartTooltip />}
                />
                <Bar dataKey="total" name="Charges" fill="url(#chargesBar)" radius={[10, 10, 4, 4]} barSize={20}>
                  <LabelList
                    dataKey="total"
                    position="top"
                    formatter={(value) => fmtCompact(Number(value ?? 0))}
                    className="fill-slate-500 text-[10px] font-medium"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className={panelClass}>
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[var(--logo-primary)]/70 to-transparent" />
        <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">Tendance annuelle {year}</h2>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={netTrend} margin={{ top: 12, right: 10, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="recettesArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#27bdfb" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#27bdfb" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="recettesComposedBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#27bdfb" stopOpacity={0.92} />
                <stop offset="100%" stopColor="#104eee" stopOpacity={0.78} />
              </linearGradient>
              <linearGradient id="chargesComposedBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fb7185" stopOpacity={0.92} />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.78} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="2 6" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${Number(v).toLocaleString("fr-MA")}`}
            />
            <ReferenceLine
              y={0}
              stroke="rgba(100,116,139,0.65)"
              strokeDasharray="3 3"
              ifOverflow="extendDomain"
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend verticalAlign="top" height={24} iconType="circle" />
            <Bar dataKey="recettes" name="Recettes" fill="url(#recettesComposedBar)" radius={[8, 8, 0, 0]} barSize={12} />
            <Bar dataKey="charges" name="Charges" fill="url(#chargesComposedBar)" radius={[8, 8, 0, 0]} barSize={12} />
            <Area
              type="monotone"
              dataKey="net"
              name="Solde net"
              stroke="#104eee"
              strokeWidth={2.3}
              fill="url(#recettesArea)"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="net"
              name="Solde net"
              stroke="#104eee"
              strokeWidth={2.6}
              dot={{ r: 2.2, fill: "#104eee", strokeWidth: 0 }}
              activeDot={{ r: 4.5, fill: "#104eee", stroke: "#fff", strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={panelClass}>
          <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[var(--logo-secondary)]/70 to-transparent" />
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">Repartition du flux</h2>
          {flowBreakdown.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Aucune donnee</p>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 10 }}>
                <Pie
                  data={flowBreakdown}
                  cx="50%"
                  cy="46%"
                  innerRadius={62}
                  outerRadius={92}
                  dataKey="value"
                  nameKey="name"
                  paddingAngle={2}
                  stroke="#ffffff"
                  strokeWidth={2}
                  startAngle={90}
                  endAngle={-270}
                >
                  {flowBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={30} iconType="circle" />
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
          {flowBreakdown.length > 0 ? (
            <div className="pointer-events-none absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Total flux
              </p>
              <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                {fmtCompact(flowTotal)} MAD
              </p>
            </div>
          ) : null}
        </div>

        <div className={panelClass}>
          <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[var(--logo-variation)]/70 to-transparent" />
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">Evolution du solde net</h2>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={netTrend} margin={{ top: 12, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="netLineArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#104eee" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#104eee" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="2 6" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${Number(v).toLocaleString("fr-MA")}`}
              />
              <ReferenceLine y={0} stroke="rgba(100,116,139,0.65)" strokeDasharray="3 3" />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="net"
                name="Solde net"
                stroke="none"
                fill="url(#netLineArea)"
              />
              <Line
                type="monotone"
                dataKey="net"
                name="Solde net"
                stroke="#104eee"
                strokeWidth={2.8}
                dot={{ r: 2.5, fill: "#104eee", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#104eee", stroke: "#fff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/85 px-3 py-1 text-xs font-medium text-slate-600 backdrop-blur dark:border-white/15 dark:bg-slate-800/70 dark:text-slate-200">
      <span className="text-slate-500 dark:text-slate-300">{label}</span>
      <span className="font-semibold text-slate-900 dark:text-white">{value}</span>
    </span>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string;
    color?: string;
    payload?: { color?: string };
  }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-[170px] rounded-xl border border-slate-200/90 bg-white/95 p-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/90">
      {label ? <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p> : null}
      <div className="space-y-1.5">
        {payload.map((entry, index) => {
          const rowColor = entry.color ?? entry.payload?.color ?? "#64748b";
          return (
            <div key={`${entry.name ?? "item"}-${index}`} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: rowColor }} />
                <span>{entry.name ?? "Value"}</span>
              </div>
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                {fmt(Number(entry.value ?? 0))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
