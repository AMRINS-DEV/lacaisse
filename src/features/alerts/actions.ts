"use server";
import { revalidatePath } from "next/cache";
import { execute } from "@/lib/db";
import { requireRole, getCurrentUserId } from "@/lib/auth/permissions";
import { AlertSchema } from "./schemas";

export async function createAlert(_prevState: unknown, formData: FormData) {
  await requireRole("manager");
  const userId = await getCurrentUserId();
  const validated = AlertSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    location_id: formData.get("location_id") || null,
    category: formData.get("category") || null,
    threshold: formData.get("threshold"),
    period: formData.get("period"),
  });
  if (!validated.success) return { error: "Données invalides", fieldErrors: validated.error.flatten().fieldErrors };
  const { name, type, location_id, category, threshold, period } = validated.data;
  await execute(
    `INSERT INTO alerts (name, type, location_id, category, threshold, period, is_active, created_by)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
    [name, type, location_id ?? null, category ?? null, threshold, period, userId]
  );
  revalidatePath("/admin/alerts");
  return { success: true };
}

export async function toggleAlertActive(id: number) {
  await requireRole("manager");
  await execute("UPDATE alerts SET is_active = NOT is_active WHERE id = ?", [id]);
  revalidatePath("/admin/alerts");
}

export async function deleteAlert(id: number) {
  await requireRole("admin");
  await execute("DELETE FROM alerts WHERE id = ?", [id]);
  revalidatePath("/admin/alerts");
}
