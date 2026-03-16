import { query, queryOne } from "@/lib/db";
import { getCurrentService } from "@/lib/service-context.server";
import type {
  Charge,
  ChargeFilters,
  PaginatedResult,
  ChargeLocationMonthTotal,
  ChargeOverviewStats,
} from "./types";

export async function getCharges(
  filters: ChargeFilters = {}
): Promise<PaginatedResult<Charge>> {
  const serviceKey = await getCurrentService();
  const page = filters.page ?? 1;
  const per_page = filters.per_page ?? 20;
  const offset = (page - 1) * per_page;
  const noPagination = filters.no_pagination === true;

  const conditions: string[] = ["d.type = 'expense'", "d.service_key = ?"];
  const params: unknown[] = [serviceKey];

  if (filters.location_id) {
    conditions.push("d.location_id = ?");
    params.push(filters.location_id);
  }
  if (filters.category) {
    conditions.push("c.name = ?");
    params.push(filters.category);
  }
  if (filters.payment_method) {
    conditions.push("d.payment_method = ?");
    params.push(filters.payment_method);
  }
  if (filters.date_from) {
    conditions.push("DATE(d.transaction_date) >= ?");
    params.push(filters.date_from);
  }
  if (filters.date_to) {
    conditions.push("DATE(d.transaction_date) <= ?");
    params.push(filters.date_to);
  }
  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push("(d.description LIKE ? OR CAST(d.amount AS CHAR) LIKE ?)");
    params.push(searchTerm, searchTerm);
  }

  const where = conditions.join(" AND ");

  const countRows = await query<{ total: number }>(
    `SELECT COUNT(*) as total
     FROM transactions d
     LEFT JOIN categories c ON c.id = d.category_id
     WHERE ${where}`,
    params
  );
  const total = Number(countRows[0]?.total ?? 0);

  const baseSelect = `SELECT d.id, d.description, d.amount,
            COALESCE(c.name, '') as category,
            d.payment_method,
            d.location_id,
            l.code as location_code,
            COALESCE(l.name, l.code) as location_name,
            DATE_FORMAT(d.transaction_date, '%Y-%m-%d') as date,
            d.created_at,
            a.id as attachment_id,
            a.original_name as attachment_name,
            a.path as attachment_path,
            a.mime_type as attachment_mime_type
     FROM transactions d
     LEFT JOIN locations l ON l.id = d.location_id
     LEFT JOIN categories c ON c.id = d.category_id
     LEFT JOIN attachments a ON a.id = d.attachment_id
     WHERE ${where}
     ORDER BY d.transaction_date DESC, d.id DESC`;

  const data = noPagination
    ? await query<Charge>(baseSelect, params)
    : await query<Charge>(`${baseSelect}\n     LIMIT ? OFFSET ?`, [...params, per_page, offset]);

  return {
    data,
    total,
    page: noPagination ? 1 : page,
    per_page: noPagination ? total : per_page,
    total_pages: noPagination ? 1 : Math.ceil(total / per_page),
  };
}

export async function getChargeById(id: number): Promise<Charge | null> {
  const serviceKey = await getCurrentService();
  return queryOne<Charge>(
    `SELECT d.id, d.description, d.amount,
            COALESCE(c.name, '') as category,
            d.payment_method,
            d.location_id,
            l.code as location_code,
            COALESCE(l.name, l.code) as location_name,
            DATE_FORMAT(d.transaction_date, '%Y-%m-%d') as date,
            d.created_at,
            a.id as attachment_id,
            a.original_name as attachment_name,
            a.path as attachment_path,
            a.mime_type as attachment_mime_type
     FROM transactions d
     LEFT JOIN locations l ON l.id = d.location_id
     LEFT JOIN categories c ON c.id = d.category_id
     LEFT JOIN attachments a ON a.id = d.attachment_id
     WHERE d.id = ? AND d.type = 'expense' AND d.service_key = ?`,
    [id, serviceKey]
  );
}

export async function getChargeMonthlyTotal(
  month: number,
  year: number,
  locationId?: number
): Promise<number> {
  const serviceKey = await getCurrentService();
  const conditions = [
    "type = 'expense'",
    "service_key = ?",
    "MONTH(transaction_date) = ?",
    "YEAR(transaction_date) = ?",
  ];
  const params: unknown[] = [serviceKey, month, year];
  if (locationId) {
    conditions.push("location_id = ?");
    params.push(locationId);
  }
  const rows = await query<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE ${conditions.join(" AND ")}`,
    params
  );
  return Number(rows[0]?.total ?? 0);
}

export async function getChargeYears(): Promise<number[]> {
  const serviceKey = await getCurrentService();
  const rows = await query<{ year: number }>(
    `SELECT DISTINCT YEAR(transaction_date) as year
     FROM transactions
     WHERE type = 'expense' AND service_key = ? AND transaction_date IS NOT NULL
     ORDER BY year DESC`,
    [serviceKey]
  );

  return rows
    .map((row) => Number(row.year))
    .filter((year) => Number.isFinite(year) && year > 0);
}

export async function getChargeOverviewStats(
  month: number,
  year: number
): Promise<ChargeOverviewStats> {
  const serviceKey = await getCurrentService();
  const [allTimeRow, monthRow, byLocationRows] = await Promise.all([
    query<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM transactions
       WHERE type = 'expense' AND service_key = ?`,
      [serviceKey]
    ),
    query<{ total: number; count: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total,
              COUNT(*) as count
       FROM transactions
       WHERE type = 'expense'
         AND service_key = ?
         AND MONTH(transaction_date) = ?
         AND YEAR(transaction_date) = ?`,
      [serviceKey, month, year]
    ),
    query<ChargeLocationMonthTotal>(
      `SELECT
          t.location_id,
          COALESCE(l.code, CONCAT('C', t.location_id)) as location_code,
          COALESCE(l.name, COALESCE(l.code, CONCAT('C', t.location_id))) as location_name,
          COALESCE(SUM(t.amount), 0) as total
       FROM transactions t
       LEFT JOIN locations l ON l.id = t.location_id
       WHERE t.type = 'expense'
         AND t.service_key = ?
         AND MONTH(t.transaction_date) = ?
         AND YEAR(t.transaction_date) = ?
       GROUP BY t.location_id, l.code, l.name
       ORDER BY total DESC`,
      [serviceKey, month, year]
    ),
  ]);

  return {
    all_time_total: Number(allTimeRow[0]?.total ?? 0),
    current_month_total: Number(monthRow[0]?.total ?? 0),
    current_month_count: Number(monthRow[0]?.count ?? 0),
    current_month_by_location: byLocationRows.map((row) => ({
      ...row,
      total: Number(row.total ?? 0),
    })),
  };
}
