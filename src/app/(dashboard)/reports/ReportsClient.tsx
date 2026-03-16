"use client";

import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  MonthlyReport,
  WeeklyReport,
  YearlyReport,
} from "@/features/reports/queries";

const fmt = (n: number) =>
  n.toLocaleString("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Props {
  monthly: MonthlyReport;
  weekly: WeeklyReport[];
  yearly: YearlyReport;
  month: number;
  year: number;
  activeTab: string;
}

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

const YEARS = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

const TABS = [
  { key: "monthly", label: "Mensuel" },
  { key: "weekly", label: "Hebdomadaire" },
  { key: "yearly", label: "Annuel" },
];

export function ReportsClient({
  monthly,
  weekly,
  yearly,
  month,
  year,
  activeTab,
}: Props) {
  const router = useRouter();

  function navigate(updates: Record<string, string | number>) {
    const params = new URLSearchParams({
      tab: activeTab,
      month: String(month),
      year: String(year),
      ...Object.fromEntries(
        Object.entries(updates).map(([k, v]) => [k, String(v)])
      ),
    });
    router.push(`/reports?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,78,238,0.16),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(39,189,251,0.12),transparent_40%)]" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Rapports
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Vue consolidee des performances financieres et export des donnees.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-9 rounded-xl border border-slate-200/80 bg-white/90 px-3 text-sm dark:border-white/10 dark:bg-slate-800/70"
              value={month}
              onChange={(e) => navigate({ month: e.target.value })}
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i + 1} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>

            <select
              className="h-9 rounded-xl border border-slate-200/80 bg-white/90 px-3 text-sm dark:border-white/10 dark:bg-slate-800/70"
              value={year}
              onChange={(e) => navigate({ year: e.target.value })}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <a
              href={`/reports/route-export?month=${month}&year=${year}`}
              className="inline-flex h-9 items-center rounded-xl bg-[var(--logo-primary)] px-3 text-sm font-medium text-white hover:brightness-110"
            >
              Export mois complet
            </a>
            <a
              href={`/reports/route-export?month=${month}&year=${year}&scope=all`}
              className="inline-flex h-9 items-center rounded-xl border border-slate-300/80 bg-white/90 px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Export tout
            </a>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap gap-2 rounded-xl border border-slate-200/80 bg-white/85 p-2 dark:border-white/10 dark:bg-slate-900/70">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => navigate({ tab: tab.key })}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-[var(--logo-primary)] text-white"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </section>

      {activeTab === "monthly" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <KpiCard label="Recettes" value={monthly.kpi.total_recettes} color="text-[var(--logo-secondary)]" />
            <KpiCard label="Charges" value={monthly.kpi.total_charges} color="text-[var(--logo-variation)]" />
            <KpiCard
              label="Solde Net"
              value={monthly.kpi.net_balance}
              color={monthly.kpi.net_balance >= 0 ? "text-[var(--logo-secondary)]" : "text-[var(--logo-variation)]"}
            />
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white/85 p-4 dark:border-white/10 dark:bg-slate-900/70">
            <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Tendance journaliere
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthly.daily_trend} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gradRct" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#27bdfb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#27bdfb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradCh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={60} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: unknown) => `${fmt(Number(v))} MAD`} />
                <Area type="monotone" dataKey="recettes" stroke="#27bdfb" fill="url(#gradRct)" name="Recettes" />
                <Area type="monotone" dataKey="charges" stroke="#f59e0b" fill="url(#gradCh)" name="Charges" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <CategoryChart title="Recettes par categorie" data={monthly.by_category_recettes} color="#27bdfb" />
            <CategoryChart title="Charges par categorie" data={monthly.by_category_charges} color="#f59e0b" />
          </div>
        </div>
      )}

      {activeTab === "weekly" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200/80 bg-white/85 p-4 dark:border-white/10 dark:bg-slate-900/70">
            <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Resultats hebdomadaires
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={weekly} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week_label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={60} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: unknown) => `${fmt(Number(v))} MAD`} />
                <Bar dataKey="recettes" fill="#27bdfb" name="Recettes" />
                <Bar dataKey="charges" fill="#f59e0b" name="Charges" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <TableCard
            headers={["Semaine", "Recettes", "Charges", "Net"]}
            rows={weekly.map((w) => [
              w.week_label,
              fmt(w.recettes),
              fmt(w.charges),
              fmt(w.net),
            ])}
          />
        </div>
      )}

      {activeTab === "yearly" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <KpiCard label="Recettes annuelles" value={yearly.totals.recettes} color="text-[var(--logo-secondary)]" />
            <KpiCard label="Charges annuelles" value={yearly.totals.charges} color="text-[var(--logo-variation)]" />
            <KpiCard
              label="Solde net"
              value={yearly.totals.net}
              color={yearly.totals.net >= 0 ? "text-[var(--logo-secondary)]" : "text-[var(--logo-variation)]"}
            />
            <SmallInfoCard label="Meilleur mois" value={yearly.best_month ? `${yearly.best_month.label} (${fmt(yearly.best_month.net)})` : "-"} />
            <SmallInfoCard label="Pire mois" value={yearly.worst_month ? `${yearly.worst_month.label} (${fmt(yearly.worst_month.net)})` : "-"} />
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white/85 p-4 dark:border-white/10 dark:bg-slate-900/70">
            <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Evolution annuelle
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={yearly.months} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gradYRct" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#27bdfb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#27bdfb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradYCh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={65} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: unknown) => `${fmt(Number(v))} MAD`} />
                <Area type="monotone" dataKey="recettes" stroke="#27bdfb" fill="url(#gradYRct)" name="Recettes" />
                <Area type="monotone" dataKey="charges" stroke="#f59e0b" fill="url(#gradYCh)" name="Charges" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/85 p-4 dark:border-white/10 dark:bg-slate-900/70">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className={`mt-1 text-lg font-bold ${color}`}>{fmt(value)}</div>
      <div className="text-xs text-slate-400">MAD</div>
    </div>
  );
}

function SmallInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/85 p-4 dark:border-white/10 dark:bg-slate-900/70">
      <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">{value}</div>
    </div>
  );
}

function CategoryChart({
  title,
  data,
  color,
}: {
  title: string;
  data: { category: string; total: number }[];
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/85 p-4 dark:border-white/10 dark:bg-slate-900/70">
      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h2>
      {data.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400">Aucune donnee</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} width={110} />
            <Tooltip formatter={(v: unknown) => `${fmt(Number(v))} MAD`} />
            <Bar dataKey="total" fill={color} name="Total" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function TableCard({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-slate-900/70">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200/80 bg-slate-50/70 text-xs text-slate-500 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-300">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-2 text-left">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/70 dark:divide-white/10">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-6 text-center text-slate-400">
                Aucune donnee
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                {row.map((cell, i) => (
                  <td key={`${idx}-${i}`} className="px-4 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
