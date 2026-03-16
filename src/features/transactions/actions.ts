"use server";

import { revalidatePath } from "next/cache";
import { execute, query } from "@/lib/db";
import { requireRole, getCurrentUserId } from "@/lib/auth/permissions";
import { logAudit } from "@/features/audit/log";
import { getCurrentService } from "@/lib/service-context.server";
import { TransactionSchema } from "./schemas";
import { getTransactionById } from "./queries";

export async function createTransaction(
  _prevState: unknown,
  formData: FormData
): Promise<{ success?: boolean; error?: string; fieldErrors?: Record<string, string[]> }> {
  await requireRole("manager");
  const userId = await getCurrentUserId();
  const serviceKey = await getCurrentService();

  const raw = {
    from_location_id: formData.get("from_location_id"),
    to_location_id: formData.get("to_location_id"),
    amount: formData.get("amount"),
    date: formData.get("date"),
  };

  const validated = TransactionSchema.safeParse(raw);
  if (!validated.success) {
    return { error: "Données invalides", fieldErrors: validated.error.flatten().fieldErrors };
  }

  const { from_location_id, to_location_id, amount, date } = validated.data;
  const transferGroupId = crypto.randomUUID();

  // Create transfer_out transaction
  const { insertId: outTxId } = await execute(
    `INSERT INTO transactions
       (type, service_key, location_id, amount, payment_method, transfer_group_id, transaction_date, created_by)
     VALUES ('transfer_out', ?, ?, ?, 'cash', ?, ?, ?)`,
    [serviceKey, from_location_id, amount, transferGroupId, date, userId]
  );

  // Create transfer_in transaction
  const { insertId: inTxId } = await execute(
    `INSERT INTO transactions
       (type, service_key, location_id, amount, payment_method, transfer_group_id, transaction_date, created_by)
     VALUES ('transfer_in', ?, ?, ?, 'cash', ?, ?, ?)`,
    [serviceKey, to_location_id, amount, transferGroupId, date, userId]
  );

  // Create the transfers record linking both
  const { insertId } = await execute(
    `INSERT INTO transfers
       (transfer_group_id, service_key, from_location_id, to_location_id, amount, payment_method,
        transfer_date, out_transaction_id, in_transaction_id, created_by)
     VALUES (?, ?, ?, ?, ?, 'cash', ?, ?, ?, ?)`,
    [transferGroupId, serviceKey, from_location_id, to_location_id, amount, date, outTxId, inTxId, userId]
  );

  await logAudit({
    userId,
    action: "create",
    tableName: "transfers",
    recordId: insertId,
    afterData: validated.data,
  });

  revalidatePath("/transactions");
  revalidatePath("/");
  return { success: true };
}

export async function deleteTransaction(
  id: number
): Promise<{ success?: boolean; error?: string }> {
  await requireRole("manager");
  const userId = await getCurrentUserId();
  const serviceKey = await getCurrentService();

  const before = await getTransactionById(id);
  if (!before) return { error: "Enregistrement introuvable" };

  // Delete linked transactions rows first, then the transfer record
  await execute(
    `DELETE tx FROM transactions tx
     INNER JOIN transfers tr ON (tx.id = tr.out_transaction_id OR tx.id = tr.in_transaction_id)
     WHERE tr.id = ? AND tr.service_key = ?`,
    [id, serviceKey]
  );
  await execute("DELETE FROM transfers WHERE id = ? AND service_key = ?", [id, serviceKey]);

  await logAudit({
    userId,
    action: "delete",
    tableName: "transfers",
    recordId: id,
    beforeData: before,
  });

  revalidatePath("/transactions");
  revalidatePath("/");
  return { success: true };
}

export async function deleteTransactions(
  ids: number[]
): Promise<{ success?: boolean; error?: string; deletedCount?: number }> {
  await requireRole("manager");
  const userId = await getCurrentUserId();
  const serviceKey = await getCurrentService();
  const sanitizedIds = Array.from(
    new Set(
      ids
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0)
    )
  );

  if (sanitizedIds.length === 0) {
    return { error: "Aucun virement selectionne." };
  }

  const placeholders = sanitizedIds.map(() => "?").join(", ");
  const beforeRows = await query<Record<string, unknown>>(
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
     WHERE t.id IN (${placeholders})
       AND t.service_key = ?`,
    [...sanitizedIds, serviceKey]
  );

  if (beforeRows.length === 0) {
    return { error: "Aucun virement introuvable pour cette selection." };
  }

  await execute(
    `DELETE tx FROM transactions tx
     INNER JOIN transfers tr ON (tx.id = tr.out_transaction_id OR tx.id = tr.in_transaction_id)
     WHERE tr.id IN (${placeholders}) AND tr.service_key = ?`,
    [...sanitizedIds, serviceKey]
  );
  await execute(
    `DELETE FROM transfers
     WHERE id IN (${placeholders}) AND service_key = ?`,
    [...sanitizedIds, serviceKey]
  );

  for (const row of beforeRows) {
    await logAudit({
      userId,
      action: "delete",
      tableName: "transfers",
      recordId: Number(row.id),
      beforeData: row,
    });
  }

  revalidatePath("/transactions");
  revalidatePath("/");
  return { success: true, deletedCount: beforeRows.length };
}
