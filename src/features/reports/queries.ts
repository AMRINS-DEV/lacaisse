import { query } from "@/lib/db";
import { getCurrentService } from "@/lib/service-context.server";

export interface WeeklyReport {
  week_number: number;
  week_label: string;
  date_from: string;
  date_to: string;
  recettes: number;
  charges: number;
  net: number;
}

export interface MonthlyReport {
  month: number;
  year: number;
  kpi: {
    total_recettes: number;
    total_charges: number;
    net_balance: number;
    total_records: number;
  };
  by_category_recettes: { category: string; total: number }[];
  by_category_charges: { category: string; total: number }[];
  by_location: { location_name: string; recettes: number; charges: number; net: number }[];
  by_payment_method: { payment_method: string; total: number }[];
  daily_trend: { day: number; recettes: number; charges: number }[];
}

export interface YearlyReport {
  year: number;
  months: { month: number; label: string; recettes: number; charges: number; net: number }[];
  totals: { recettes: number; charges: number; net: number };
  best_month: { month: number; label: string; net: number } | null;
  worst_month: { month: number; label: string; net: number } | null;
}

export interface ReportExportRow {
  date: string;
  type: "income" | "expense";
  description: string;
  category: string;
  payment_method: string;
  location_name: string;
  amount: number;
}

export async function getWeeklyReport(year: number, month: number): Promise<WeeklyReport[]> {
  const serviceKey = await getCurrentService();
  const rows = await query<{ week: number; type: string; total: number }>(
    `SELECT WEEK(transaction_date, 1) as week, type, COALESCE(SUM(amount), 0) as total
     FROM transactions
     WHERE YEAR(transaction_date) = ? AND MONTH(transaction_date) = ?
       AND service_key = ?
       AND type IN ('income', 'expense')
     GROUP BY WEEK(transaction_date, 1), type
     ORDER BY week`,
    [year, month, serviceKey]
  );

  const weekMap: Record<number, { recettes: number; charges: number; date_from?: string; date_to?: string }> = {};
  for (const row of rows) {
    if (!weekMap[row.week]) weekMap[row.week] = { recettes: 0, charges: 0 };
    if (row.type === "income") weekMap[row.week].recettes += Number(row.total);
    else if (row.type === "expense") weekMap[row.week].charges += Number(row.total);
  }

  return Object.entries(weekMap).map(([week, vals], i) => ({
    week_number: Number(week),
    week_label: `Semaine ${i + 1}`,
    date_from: "",
    date_to: "",
    recettes: vals.recettes,
    charges: vals.charges,
    net: vals.recettes - vals.charges,
  }));
}

export async function getMonthlyReport(month: number, year: number): Promise<MonthlyReport> {
  const serviceKey = await getCurrentService();
  const [kpiRows, countRows, catRct, catCh, byLoc, byPm, daily] = await Promise.all([
    query<{ type: string; total: number }>(
      `SELECT type, COALESCE(SUM(amount), 0) as total
       FROM transactions
       WHERE MONTH(transaction_date)=? AND YEAR(transaction_date)=? AND service_key = ? AND type IN ('income','expense')
       GROUP BY type`,
      [month, year, serviceKey]
    ),
    query<{ total: number }>(
      `SELECT COUNT(*) as total
       FROM transactions
       WHERE MONTH(transaction_date)=? AND YEAR(transaction_date)=?
         AND service_key = ?
         AND type IN ('income','expense')`,
      [month, year, serviceKey]
    ),
    query<{ category: string; total: number }>(
      `SELECT COALESCE(c.name, 'Sans catégorie') as category, COALESCE(SUM(d.amount), 0) as total
       FROM transactions d
       LEFT JOIN categories c ON c.id = d.category_id
       WHERE d.type='income' AND d.service_key = ? AND MONTH(d.transaction_date)=? AND YEAR(d.transaction_date)=?
       GROUP BY d.category_id, c.name ORDER BY total DESC`,
      [serviceKey, month, year]
    ),
    query<{ category: string; total: number }>(
      `SELECT COALESCE(c.name, 'Sans catégorie') as category, COALESCE(SUM(d.amount), 0) as total
       FROM transactions d
       LEFT JOIN categories c ON c.id = d.category_id
       WHERE d.type='expense' AND d.service_key = ? AND MONTH(d.transaction_date)=? AND YEAR(d.transaction_date)=?
       GROUP BY d.category_id, c.name ORDER BY total DESC`,
      [serviceKey, month, year]
    ),
    query<{ location_name: string; recettes: number; charges: number }>(
      `SELECT COALESCE(l.name, l.code) as location_name,
              COALESCE(SUM(CASE WHEN d.type='income'  THEN d.amount ELSE 0 END), 0) as recettes,
              COALESCE(SUM(CASE WHEN d.type='expense' THEN d.amount ELSE 0 END), 0) as charges
       FROM transactions d LEFT JOIN locations l ON l.id = d.location_id
       WHERE MONTH(d.transaction_date)=? AND YEAR(d.transaction_date)=?
         AND d.service_key = ?
         AND d.type IN ('income','expense')
       GROUP BY d.location_id, l.name, l.code`,
      [month, year, serviceKey]
    ),
    query<{ payment_method: string; total: number }>(
      `SELECT payment_method, COALESCE(SUM(amount), 0) as total
       FROM transactions
       WHERE MONTH(transaction_date)=? AND YEAR(transaction_date)=? AND service_key = ? AND type IN ('income','expense')
       GROUP BY payment_method ORDER BY total DESC`,
      [month, year, serviceKey]
    ),
    query<{ day: number; type: string; total: number }>(
      `SELECT DAY(transaction_date) as day, type, COALESCE(SUM(amount), 0) as total
       FROM transactions
       WHERE MONTH(transaction_date)=? AND YEAR(transaction_date)=? AND service_key = ? AND type IN ('income','expense')
       GROUP BY DAY(transaction_date), type ORDER BY day`,
      [month, year, serviceKey]
    ),
  ]);

  const totals: Record<string, number> = {};
  for (const r of kpiRows) totals[r.type] = Number(r.total);
  const total_recettes = totals["income"] ?? 0;
  const total_charges = totals["expense"] ?? 0;
  const total_records = Number(countRows[0]?.total ?? 0);

  const daysMap: Record<number, { recettes: number; charges: number }> = {};
  for (const r of daily) {
    if (!daysMap[r.day]) daysMap[r.day] = { recettes: 0, charges: 0 };
    if (r.type === "income") daysMap[r.day].recettes += Number(r.total);
    else if (r.type === "expense") daysMap[r.day].charges += Number(r.total);
  }

  return {
    month,
    year,
    kpi: {
      total_recettes,
      total_charges,
      net_balance: total_recettes - total_charges,
      total_records,
    },
    by_category_recettes: catRct.map((r) => ({ ...r, total: Number(r.total) })),
    by_category_charges: catCh.map((r) => ({ ...r, total: Number(r.total) })),
    by_location: byLoc.map((r) => ({
      ...r,
      recettes: Number(r.recettes),
      charges: Number(r.charges),
      net: Number(r.recettes) - Number(r.charges),
    })),
    by_payment_method: byPm.map((r) => ({ ...r, total: Number(r.total) })),
    daily_trend: Object.entries(daysMap).map(([d, v]) => ({
      day: Number(d),
      recettes: v.recettes,
      charges: v.charges,
    })),
  };
}

export async function getYearlyReport(year: number): Promise<YearlyReport> {
  const serviceKey = await getCurrentService();
  const rows = await query<{ month: number; type: string; total: number }>(
    `SELECT MONTH(transaction_date) as month, type, COALESCE(SUM(amount), 0) as total
     FROM transactions WHERE YEAR(transaction_date) = ? AND service_key = ? AND type IN ('income','expense')
     GROUP BY MONTH(transaction_date), type ORDER BY MONTH(transaction_date)`,
    [year, serviceKey]
  );

  const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  const monthsMap: Record<number, { recettes: number; charges: number }> = {};
  for (let m = 1; m <= 12; m++) monthsMap[m] = { recettes: 0, charges: 0 };
  for (const r of rows) {
    if (r.type === "income") monthsMap[r.month].recettes += Number(r.total);
    else if (r.type === "expense") monthsMap[r.month].charges += Number(r.total);
  }

  const months = Object.entries(monthsMap).map(([m, v]) => ({
    month: Number(m),
    label: monthNames[Number(m) - 1],
    recettes: v.recettes,
    charges: v.charges,
    net: v.recettes - v.charges,
  }));

  const totals = months.reduce(
    (acc, m) => ({
      recettes: acc.recettes + m.recettes,
      charges: acc.charges + m.charges,
      net: acc.net + m.net,
    }),
    { recettes: 0, charges: 0, net: 0 }
  );

  const nonZero = months.filter((m) => m.recettes > 0 || m.charges > 0);
  const best_month = nonZero.length ? nonZero.reduce((a, b) => (b.net > a.net ? b : a)) : null;
  const worst_month = nonZero.length ? nonZero.reduce((a, b) => (b.net < a.net ? b : a)) : null;

  return { year, months, totals, best_month, worst_month };
}

export async function getAllTransactionsForReportExport(): Promise<ReportExportRow[]> {
  return getTransactionsForReportExport();
}

export async function getTransactionsForReportExport(filters?: {
  month?: number;
  year?: number;
}): Promise<ReportExportRow[]> {
  const serviceKey = await getCurrentService();
  const conditions: string[] = ["d.type IN ('income', 'expense')", "d.service_key = ?"];
  const params: unknown[] = [serviceKey];

  if (filters?.month) {
    conditions.push("MONTH(d.transaction_date) = ?");
    params.push(filters.month);
  }
  if (filters?.year) {
    conditions.push("YEAR(d.transaction_date) = ?");
    params.push(filters.year);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  return query<ReportExportRow>(
    `SELECT DATE_FORMAT(d.transaction_date, '%Y-%m-%d') as date,
            d.type,
            COALESCE(d.description, '') as description,
            COALESCE(c.name, 'Sans categorie') as category,
            COALESCE(d.payment_method, '') as payment_method,
            COALESCE(l.name, l.code, '') as location_name,
            d.amount
     FROM transactions d
     LEFT JOIN categories c ON c.id = d.category_id
     LEFT JOIN locations l ON l.id = d.location_id
     ${where}
     ORDER BY d.transaction_date DESC, d.id DESC`,
    params
  );
}
