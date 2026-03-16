import { query } from "@/lib/db";
import { getCurrentService } from "@/lib/service-context.server";

export interface KpiSummary {
  total_recettes: number;
  total_charges: number;
  net_balance: number;
}

export interface LocationSummary {
  location_id: number;
  location_name: string;
  location_color: string;
  recettes: number;
  charges: number;
  transfers_in: number;
  transfers_out: number;
  net: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
}

export interface MonthlyTrend {
  month: number;
  year: number;
  label: string;
  recettes: number;
  charges: number;
  net: number;
}

export async function getKpiSummary(month: number, year: number): Promise<KpiSummary> {
  const serviceKey = await getCurrentService();
  const rows = await query<{ type: string; total: number }>(
    `SELECT type, COALESCE(SUM(amount), 0) as total
     FROM transactions
     WHERE MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?
       AND service_key = ?
       AND type IN ('income', 'expense')
     GROUP BY type`,
    [month, year, serviceKey]
  );

  const totals: Record<string, number> = {};
  for (const row of rows) {
    totals[row.type] = Number(row.total);
  }

  const total_recettes = totals["income"] ?? 0;
  const total_charges = totals["expense"] ?? 0;
  const net_balance = total_recettes - total_charges;

  return { total_recettes, total_charges, net_balance };
}

export async function getLocationSummaries(month: number, year: number): Promise<LocationSummary[]> {
  const serviceKey = await getCurrentService();
  const locations = await query<{ id: number; name: string; color: string }>(
    `SELECT id, COALESCE(name, code) as name, COALESCE(color, '#6366f1') as color
     FROM locations WHERE is_active = 1 ORDER BY code`
  );

  const dataRows = await query<{ location_id: number; type: string; total: number }>(
    `SELECT location_id, type, COALESCE(SUM(amount), 0) as total
     FROM transactions
     WHERE MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?
       AND service_key = ?
       AND type IN ('income', 'expense')
     GROUP BY location_id, type`,
    [month, year, serviceKey]
  );

  const transfersIn = await query<{ to_location_id: number; total: number }>(
    `SELECT to_location_id, COALESCE(SUM(amount), 0) as total
     FROM transfers
     WHERE MONTH(transfer_date) = ? AND YEAR(transfer_date) = ?
       AND service_key = ?
     GROUP BY to_location_id`,
    [month, year, serviceKey]
  );

  const transfersOut = await query<{ from_location_id: number; total: number }>(
    `SELECT from_location_id, COALESCE(SUM(amount), 0) as total
     FROM transfers
     WHERE MONTH(transfer_date) = ? AND YEAR(transfer_date) = ?
       AND service_key = ?
     GROUP BY from_location_id`,
    [month, year, serviceKey]
  );

  const dataMap: Record<number, Record<string, number>> = {};
  for (const row of dataRows) {
    if (!dataMap[row.location_id]) dataMap[row.location_id] = {};
    dataMap[row.location_id][row.type] = Number(row.total);
  }

  const inMap: Record<number, number> = {};
  for (const row of transfersIn) inMap[row.to_location_id] = Number(row.total);

  const outMap: Record<number, number> = {};
  for (const row of transfersOut) outMap[row.from_location_id] = Number(row.total);

  return locations.map((loc) => {
    const d = dataMap[loc.id] ?? {};
    const recettes = d["income"] ?? 0;
    const charges = d["expense"] ?? 0;
    const transfers_in = inMap[loc.id] ?? 0;
    const transfers_out = outMap[loc.id] ?? 0;
    const net = recettes - charges + transfers_in - transfers_out;
    return {
      location_id: loc.id,
      location_name: loc.name,
      location_color: loc.color,
      recettes,
      charges,
      transfers_in,
      transfers_out,
      net,
    };
  });
}

export async function getTopCategories(
  month: number,
  year: number,
  type: "income" | "expense",
  limit = 10
): Promise<CategoryBreakdown[]> {
  const serviceKey = await getCurrentService();
  return query<CategoryBreakdown>(
    `SELECT COALESCE(c.name, 'Sans catégorie') as category,
            COALESCE(SUM(d.amount), 0) as total
     FROM transactions d
     LEFT JOIN categories c ON c.id = d.category_id
     WHERE d.type = ? AND d.service_key = ? AND MONTH(d.transaction_date) = ? AND YEAR(d.transaction_date) = ?
     GROUP BY d.category_id, c.name
     ORDER BY total DESC
     LIMIT ?`,
    [type, serviceKey, month, year, limit]
  );
}

export async function getMonthlyTrend(year: number): Promise<MonthlyTrend[]> {
  const serviceKey = await getCurrentService();
  const rows = await query<{ month: number; type: string; total: number }>(
    `SELECT MONTH(transaction_date) as month, type, COALESCE(SUM(amount), 0) as total
     FROM transactions
     WHERE YEAR(transaction_date) = ? AND service_key = ? AND type IN ('income', 'expense')
     GROUP BY MONTH(transaction_date), type
     ORDER BY MONTH(transaction_date)`,
    [year, serviceKey]
  );

  const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  const months: Record<number, { recettes: number; charges: number }> = {};

  for (let m = 1; m <= 12; m++) {
    months[m] = { recettes: 0, charges: 0 };
  }

  for (const row of rows) {
    if (row.type === "income") months[row.month].recettes += Number(row.total);
    else if (row.type === "expense") months[row.month].charges += Number(row.total);
  }

  return Object.entries(months).map(([m, vals]) => ({
    month: Number(m),
    year,
    label: monthNames[Number(m) - 1],
    recettes: vals.recettes,
    charges: vals.charges,
    net: vals.recettes - vals.charges,
  }));
}
