import { query, queryOne } from "@/lib/db";
import { getCurrentService } from "@/lib/service-context.server";
import type { Transaction, TransactionFilters } from "./types";

export async function getTransactions(
  filters: TransactionFilters = {}
): Promise<Transaction[]> {
  const serviceKey = await getCurrentService();
  const conditions: string[] = [];
  const params: unknown[] = [];

  conditions.push("t.service_key = ?");
  params.push(serviceKey);

  if (filters.month) {
    conditions.push("MONTH(t.transfer_date) = ?");
    params.push(filters.month);
  }
  if (filters.year) {
    conditions.push("YEAR(t.transfer_date) = ?");
    params.push(filters.year);
  }
  if (filters.from_location_id) {
    conditions.push("t.from_location_id = ?");
    params.push(filters.from_location_id);
  }
  if (filters.to_location_id) {
    conditions.push("t.to_location_id = ?");
    params.push(filters.to_location_id);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return query<Transaction>(
    `SELECT t.id,
            t.from_location_id,
            COALESCE(lf.name, lf.code, CAST(t.from_location_id AS CHAR)) as from_location_name,
            t.to_location_id,
            COALESCE(lt.name, lt.code, CAST(t.to_location_id AS CHAR)) as to_location_name,
            t.amount,
            DATE_FORMAT(t.transfer_date, '%Y-%m-%d') as date,
            t.created_at
     FROM transfers t
     LEFT JOIN locations lf ON lf.id = t.from_location_id
     LEFT JOIN locations lt ON lt.id = t.to_location_id
     ${where}
     ORDER BY t.transfer_date DESC, t.id DESC`,
    params
  );
}

export async function getTransactionById(id: number): Promise<Transaction | null> {
  const serviceKey = await getCurrentService();
  return queryOne<Transaction>(
    `SELECT t.id,
            t.from_location_id,
            COALESCE(lf.name, lf.code, CAST(t.from_location_id AS CHAR)) as from_location_name,
            t.to_location_id,
            COALESCE(lt.name, lt.code, CAST(t.to_location_id AS CHAR)) as to_location_name,
            t.amount,
            DATE_FORMAT(t.transfer_date, '%Y-%m-%d') as date,
            t.created_at
     FROM transfers t
     LEFT JOIN locations lf ON lf.id = t.from_location_id
     LEFT JOIN locations lt ON lt.id = t.to_location_id
     WHERE t.id = ? AND t.service_key = ?`,
    [id, serviceKey]
  );
}
