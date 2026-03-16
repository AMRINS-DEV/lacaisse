"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { execute } from "@/lib/db";
import { requireRole } from "@/lib/auth/permissions";

const ServiceSchema = z.object({
  service_key: z
    .string()
    .trim()
    .min(2)
    .max(32)
    .regex(/^[a-z0-9_-]+$/, "Utilisez uniquement: a-z, 0-9, _ et -"),
  name: z.string().trim().min(2).max(128),
});

export async function createService(_prevState: unknown, formData: FormData) {
  await requireRole("admin");
  const validated = ServiceSchema.safeParse({
    service_key: formData.get("service_key"),
    name: formData.get("name"),
  });

  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "Données invalides" };
  }

  const { service_key, name } = validated.data;

  try {
    await execute(
      "INSERT INTO services (service_key, name, is_active) VALUES (?, ?, 1)",
      [service_key, name]
    );
  } catch {
    return { error: "Ce service existe déjà" };
  }

  revalidatePath("/admin/services");
  revalidatePath("/");
  return { success: true };
}

export async function toggleServiceActive(id: number) {
  await requireRole("admin");
  await execute("UPDATE services SET is_active = NOT is_active WHERE id = ?", [id]);
  revalidatePath("/admin/services");
  revalidatePath("/");
}
