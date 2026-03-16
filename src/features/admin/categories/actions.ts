"use server";
import { revalidatePath } from "next/cache";
import { execute } from "@/lib/db";
import { requireRole } from "@/lib/auth/permissions";
import { z } from "zod";

const CategorySchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["rct", "cv", "cf", "all"]),
});

export async function createCategory(_prevState: unknown, formData: FormData) {
  await requireRole("admin");
  const validated = CategorySchema.safeParse({ name: formData.get("name"), type: formData.get("type") });
  if (!validated.success) return { error: "Données invalides" };
  await execute("INSERT INTO categories (name, type, is_active) VALUES (?, ?, 1)", [validated.data.name, validated.data.type]);
  revalidatePath("/admin/categories");
  return { success: true };
}

export async function toggleCategoryActive(id: number) {
  await requireRole("admin");
  await execute("UPDATE categories SET is_active = NOT is_active WHERE id = ?", [id]);
  revalidatePath("/admin/categories");
}
