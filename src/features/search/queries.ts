import { query } from "@/lib/db";
import { getCurrentService } from "@/lib/service-context.server";
import type { PaginatedResult } from "@/features/recettes/types";

export interface SearchResult {
  id: number;
  type: "income" | "expense";
  type_label: string;
  description: string;
  amount: number;
  location_id: number;
  category: string;
  payment_method: string;
  location_name: string;
  date: string;
}

export interface SearchFilters {
  q?: string;
  type?: string;
  location_id?: number;
  category?: string;
  payment_method?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  match_mode?: "broad" | "exact";
  sort?: "date_desc" | "date_asc" | "amount_desc" | "amount_asc";
  page?: number;
  per_page?: number;
}

export async function searchTransactions(
  filters: SearchFilters
): Promise<PaginatedResult<SearchResult>> {
  const serviceKey = await getCurrentService();
  const page = filters.page ?? 1;
  const per_page = filters.per_page ?? 25;
  const offset = (page - 1) * per_page;

  const conditions: string[] = ["d.type IN ('income','expense')", "d.service_key = ?"];
  const params: unknown[] = [serviceKey];

  const searchTerm = filters.q?.trim();
  const matchMode = filters.match_mode === "exact" ? "exact" : "broad";

  if (searchTerm) {
    const textualColumns = [
      "COALESCE(d.description, '')",
      "COALESCE(c.name, '')",
      "COALESCE(d.payment_method, '')",
      "COALESCE(l.name, '')",
      "COALESCE(l.code, '')",
      "COALESCE(a.original_name, '')",
      "COALESCE(u.full_name, '')",
      "COALESCE(u.email, '')",
      "COALESCE(d.currency, '')",
      "COALESCE(d.type, '')",
      "CASE d.type WHEN 'income' THEN 'recette' WHEN 'expense' THEN 'charge' ELSE d.type END",
    ];

    const numericSearch = Number(searchTerm.replace(",", "."));
    const hasNumericSearch = Number.isFinite(numericSearch);

    if (matchMode === "exact") {
      const textualSql = textualColumns.map((column) => `LOWER(${column}) = LOWER(?)`).join(" OR ");
      const numericSql = hasNumericSearch ? " OR d.id = ? OR d.amount = ?" : "";
      conditions.push(`(${textualSql}${numericSql})`);
      params.push(...textualColumns.map(() => searchTerm));
      if (hasNumericSearch) {
        params.push(Math.trunc(numericSearch), numericSearch);
      }
    } else {
      const likeValue = `%${searchTerm}%`;
      const textualSql = textualColumns.map((column) => `${column} LIKE ?`).join(" OR ");
      const numericSql = hasNumericSearch ? " OR CAST(d.id AS CHAR) LIKE ? OR CAST(d.amount AS CHAR) LIKE ?" : "";
      conditions.push(`(${textualSql}${numericSql})`);
      params.push(...textualColumns.map(() => likeValue));
      if (hasNumericSearch) {
        params.push(likeValue, likeValue);
      }
    }
  }

  if (filters.type) {
    const normalizedType = filters.type.toLowerCase().trim();
    if (normalizedType === "income" || normalizedType === "rct" || normalizedType === "recette") {
      conditions.push("d.type = 'income'");
    } else if (normalizedType === "expense" || normalizedType === "cv" || normalizedType === "cf" || normalizedType === "charge") {
      conditions.push("d.type = 'expense'");
    }
  }
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
  if (filters.amount_min !== undefined) {
    conditions.push("d.amount >= ?");
    params.push(filters.amount_min);
  }
  if (filters.amount_max !== undefined) {
    conditions.push("d.amount <= ?");
    params.push(filters.amount_max);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const sortMap: Record<string, string> = {
    date_desc:   "d.transaction_date DESC, d.id DESC",
    date_asc:    "d.transaction_date ASC, d.id ASC",
    amount_desc: "d.amount DESC",
    amount_asc:  "d.amount ASC",
    price_desc:  "d.amount DESC",
    price_asc:   "d.amount ASC",
  };
  const orderBy = sortMap[filters.sort ?? "date_desc"] ?? "d.transaction_date DESC, d.id DESC";

  const countRows = await query<{ total: number }>(
    `SELECT COUNT(*) as total
     FROM transactions d
     LEFT JOIN categories c ON c.id = d.category_id
     LEFT JOIN locations l ON l.id = d.location_id
     LEFT JOIN attachments a ON a.id = d.attachment_id
     LEFT JOIN users u ON u.id = d.created_by
     ${where}`,
    params
  );
  const total = Number(countRows[0]?.total ?? 0);

  const data = await query<SearchResult>(
    `SELECT d.id, d.type,
            CASE d.type WHEN 'income' THEN 'Recette' ELSE 'Charge' END as type_label,
            d.description, d.amount,
            d.location_id,
            COALESCE(c.name, '') as category,
            d.payment_method,
            COALESCE(l.name, l.code) as location_name,
            DATE_FORMAT(d.transaction_date, '%Y-%m-%d') as date
     FROM transactions d
     LEFT JOIN locations l ON l.id = d.location_id
     LEFT JOIN categories c ON c.id = d.category_id
     LEFT JOIN attachments a ON a.id = d.attachment_id
     LEFT JOIN users u ON u.id = d.created_by
     ${where}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, per_page, offset]
  );

  return { data, total, page, per_page, total_pages: Math.ceil(total / per_page) };
}
