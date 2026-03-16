"use server";
import { revalidatePath } from "next/cache";
import { execute } from "@/lib/db";
import { requireRole } from "@/lib/auth/permissions";
import { z } from "zod";

const LocationSchema = z.object({
  code: z.string().min(1).max(10),
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
});

export async function createLocation(_prevState: unknown, formData: FormData) {
  await requireRole("admin");
  const validated = LocationSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    color: formData.get("color"),
  });
  if (!validated.success) return { error: "Données invalides" };
  const { code, name, color } = validated.data;
  await execute("INSERT INTO locations (code, name, color, is_active) VALUES (?, ?, ?, 1)", [code, name, color]);
  revalidatePath("/admin/locations");
  return { success: true };
}

export async function updateLocation(id: number, _prevState: unknown, formData: FormData) {
  await requireRole("admin");
  const validated = LocationSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    color: formData.get("color"),
  });
  if (!validated.success) return { error: "Données invalides" };
  const { code, name, color } = validated.data;
  await execute("UPDATE locations SET code=?, name=?, color=? WHERE id=?", [code, name, color, id]);
  revalidatePath("/admin/locations");
  return { success: true };
}

export async function toggleLocationActive(id: number) {
  await requireRole("admin");
  await execute("UPDATE locations SET is_active = NOT is_active WHERE id = ?", [id]);
  revalidatePath("/admin/locations");
}
