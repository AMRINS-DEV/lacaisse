"use server";

import { revalidatePath } from "next/cache";
import { execute, query, queryOne } from "@/lib/db";
import { requireRole, getCurrentUserId } from "@/lib/auth/permissions";
import { logAudit } from "@/features/audit/log";
import { getCurrentService } from "@/lib/service-context.server";
import { ChargeSchema } from "./schemas";
import { getChargeById } from "./queries";
import { storeAttachmentFileLocally, validateAttachmentFile } from "@/lib/storage/attachments";

async function resolveCategoryId(name: string): Promise<number | null> {
  const row = await queryOne<{ id: number }>(
    "SELECT id FROM categories WHERE name = ? AND type = 'expense' AND is_active = 1 LIMIT 1",
    [name]
  );
  return row?.id ?? null;
}

async function storeAttachment(
  formData: FormData,
  userId: number
): Promise<{ attachmentId: number | null; error?: string }> {
  const fileEntry = formData.get("attachment");
  if (!(fileEntry instanceof File)) {
    return { attachmentId: null };
  }

  if (!fileEntry.name || fileEntry.size <= 0) {
    return { attachmentId: null };
  }

  const validationError = validateAttachmentFile(fileEntry);
  if (validationError) {
    return { attachmentId: null, error: validationError };
  }

  try {
    const attachment = await storeAttachmentFileLocally(fileEntry, userId);
    return { attachmentId: attachment.id };
  } catch {
    return { attachmentId: null, error: "Impossible d'enregistrer le fichier pour le moment." };
  }
}

function parseAttachmentId(formData: FormData): number | null {
  const raw = formData.get("attachment_id");
  if (typeof raw !== "string" || !raw.trim()) return null;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function sanitizeIds(ids: number[]) {
  return Array.from(
    new Set(
      ids
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0)
    )
  );
}

export async function createCharge(
  _prevState: unknown,
  formData: FormData
): Promise<{ success?: boolean; recordId?: number; error?: string; fieldErrors?: Record<string, string[]> }> {
  await requireRole("location_user");
  const userId = await getCurrentUserId();
  const serviceKey = await getCurrentService();

  const raw = {
    description: formData.get("description"),
    amount: formData.get("amount"),
    category: formData.get("category"),
    payment_method: formData.get("payment_method"),
    location_id: formData.get("location_id"),
    date: formData.get("date"),
  };

  const validated = ChargeSchema.safeParse(raw);
  if (!validated.success) {
    return { error: "Données invalides", fieldErrors: validated.error.flatten().fieldErrors };
  }

  const { description, amount, category, payment_method, location_id, date } = validated.data;
  const categoryId = await resolveCategoryId(category);
  const uploadedAttachmentId = parseAttachmentId(formData);
  let attachmentId: number | null = uploadedAttachmentId;
  if (!attachmentId) {
    const attachment = await storeAttachment(formData, userId);
    if (attachment.error) {
      return { error: attachment.error };
    }
    attachmentId = attachment.attachmentId;
  }

  const { insertId } = await execute(
    `INSERT INTO transactions
       (type, service_key, description, amount, category_id, payment_method, location_id, transaction_date, created_by, attachment_id)
     VALUES ('expense', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [serviceKey, description, amount, categoryId, payment_method, location_id, date, userId, attachmentId]
  );

  await logAudit({
    userId,
    action: "create",
    tableName: "transactions",
    recordId: insertId,
    afterData: validated.data,
  });

  revalidatePath("/charges");
  revalidatePath("/");
  return { success: true, recordId: Number(insertId) };
}

export async function updateCharge(
  id: number,
  _prevState: unknown,
  formData: FormData
): Promise<{ success?: boolean; error?: string; fieldErrors?: Record<string, string[]> }> {
  await requireRole("location_user");
  const userId = await getCurrentUserId();
  const serviceKey = await getCurrentService();

  const before = await getChargeById(id);
  if (!before) return { error: "Enregistrement introuvable" };

  const raw = {
    description: formData.get("description"),
    amount: formData.get("amount"),
    category: formData.get("category"),
    payment_method: formData.get("payment_method"),
    location_id: formData.get("location_id"),
    date: formData.get("date"),
  };

  const validated = ChargeSchema.safeParse(raw);
  if (!validated.success) {
    return { error: "Données invalides", fieldErrors: validated.error.flatten().fieldErrors };
  }

  const { description, amount, category, payment_method, location_id, date } = validated.data;
  const categoryId = await resolveCategoryId(category);
  const uploadedAttachmentId = parseAttachmentId(formData);
  let nextAttachmentId = uploadedAttachmentId ?? before.attachment_id ?? null;
  if (!uploadedAttachmentId) {
    const attachment = await storeAttachment(formData, userId);
    if (attachment.error) {
      return { error: attachment.error };
    }
    nextAttachmentId = attachment.attachmentId ?? nextAttachmentId;
  }

  await execute(
    `UPDATE transactions
     SET description=?, amount=?, category_id=?, payment_method=?, location_id=?, transaction_date=?, attachment_id=?
     WHERE id=? AND type='expense' AND service_key=?`,
    [description, amount, categoryId, payment_method, location_id, date, nextAttachmentId, id, serviceKey]
  );

  await logAudit({
    userId,
    action: "update",
    tableName: "transactions",
    recordId: id,
    beforeData: before,
    afterData: validated.data,
  });

  revalidatePath("/charges");
  revalidatePath("/");
  return { success: true };
}

export async function deleteCharge(id: number): Promise<{ success?: boolean; error?: string }> {
  await requireRole("manager");
  const userId = await getCurrentUserId();
  const serviceKey = await getCurrentService();

  const before = await getChargeById(id);
  if (!before) return { error: "Enregistrement introuvable" };

  await execute("DELETE FROM transactions WHERE id=? AND type='expense' AND service_key=?", [id, serviceKey]);

  await logAudit({
    userId,
    action: "delete",
    tableName: "transactions",
    recordId: id,
    beforeData: before,
  });

  revalidatePath("/charges");
  revalidatePath("/");
  return { success: true };
}

export async function deleteCharges(
  ids: number[]
): Promise<{ success?: boolean; error?: string; deletedCount?: number }> {
  await requireRole("manager");
  const userId = await getCurrentUserId();
  const serviceKey = await getCurrentService();
  const sanitizedIds = sanitizeIds(ids);

  if (sanitizedIds.length === 0) {
    return { error: "Aucune charge selectionnee." };
  }

  const placeholders = sanitizedIds.map(() => "?").join(", ");
  const beforeRows = await query<Record<string, unknown>>(
    `SELECT id,
            description,
            amount,
            payment_method,
            location_id,
            DATE_FORMAT(transaction_date, '%Y-%m-%d') as date
     FROM transactions
     WHERE id IN (${placeholders})
       AND type = 'expense'
       AND service_key = ?`,
    [...sanitizedIds, serviceKey]
  );

  if (beforeRows.length === 0) {
    return { error: "Aucune charge introuvable pour cette selection." };
  }

  await execute(
    `DELETE FROM transactions
     WHERE id IN (${placeholders})
       AND type = 'expense'
       AND service_key = ?`,
    [...sanitizedIds, serviceKey]
  );

  for (const row of beforeRows) {
    await logAudit({
      userId,
      action: "delete",
      tableName: "transactions",
      recordId: Number(row.id),
      beforeData: row,
    });
  }

  revalidatePath("/charges");
  revalidatePath("/");
  return { success: true, deletedCount: beforeRows.length };
}
