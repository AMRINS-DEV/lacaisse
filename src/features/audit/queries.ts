import { query } from "@/lib/db";
import type { PaginatedResult } from "@/features/recettes/types";

export interface AuditLog {
  id: number;
  user_name: string;
  action: string;
  table_name: string;
  record_id: number | null;
  before_data: string | null;
  after_data: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface AuditFilters {
  user_id?: number;
  table_name?: string;
  action?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
}

const PER_PAGE = 50;

export async function getAuditLogs(
  filters: AuditFilters = {}
): Promise<PaginatedResult<AuditLog>> {
  const page = filters.page ?? 1;
  const offset = (page - 1) * PER_PAGE;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.user_id) {
    conditions.push("al.user_id = ?");
    params.push(filters.user_id);
  }
  if (filters.table_name) {
    conditions.push("al.table_name = ?");
    params.push(filters.table_name);
  }
  if (filters.action) {
    conditions.push("al.action = ?");
    params.push(filters.action);
  }
  if (filters.date_from) {
    conditions.push("DATE(al.created_at) >= ?");
    params.push(filters.date_from);
  }
  if (filters.date_to) {
    conditions.push("DATE(al.created_at) <= ?");
    params.push(filters.date_to);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRows = await query<{ total: number }>(
    `SELECT COUNT(*) as total FROM audit_logs al ${where}`,
    params
  );
  const total = Number(countRows[0]?.total ?? 0);

  const data = await query<AuditLog>(
    `SELECT al.id,
            COALESCE(u.full_name, CAST(al.user_id AS CHAR)) as user_name,
            al.action,
            al.table_name,
            al.record_id,
            al.before_data,
            al.after_data,
            al.ip_address,
            al.created_at
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.user_id
     ${where}
     ORDER BY al.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, PER_PAGE, offset]
  );

  return {
    data,
    total,
    page,
    per_page: PER_PAGE,
    total_pages: Math.ceil(total / PER_PAGE),
  };
}
