"use server";

import { revalidatePath } from "next/cache";
import { execute, query } from "@/lib/db";
import { requireRole } from "@/lib/auth/permissions";
import { CreateUserSchema, UpdateUserSchema } from "./schemas";
import bcrypt from "bcryptjs";

export async function createUser(
  _prevState: unknown,
  formData: FormData
): Promise<{ success?: boolean; error?: string; fieldErrors?: Record<string, string[]> }> {
  await requireRole("admin");

  const locationIds = formData.getAll("location_ids").map(Number).filter(Boolean);
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    location_ids: locationIds,
  };

  const validated = CreateUserSchema.safeParse(raw);
  if (!validated.success) {
    return { error: "Données invalides", fieldErrors: validated.error.flatten().fieldErrors };
  }

  const { name, email, password, role, location_ids } = validated.data;
  const hashed = await bcrypt.hash(password, 12);

  const { insertId } = await execute(
    "INSERT INTO users (full_name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, 1)",
    [name, email, hashed, role]
  );

  if (location_ids?.length) {
    for (const locId of location_ids) {
      await execute("INSERT INTO user_locations (user_id, location_id) VALUES (?, ?)", [insertId, locId]);
    }
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateUserRole(
  userId: number,
  role: "admin" | "manager" | "location_user" | "accountant" | "viewer"
): Promise<{ success?: boolean; error?: string }> {
  await requireRole("admin");
  await execute("UPDATE users SET role = ? WHERE id = ?", [role, userId]);
  revalidatePath("/admin/users");
  return { success: true };
}

export async function toggleUserActive(userId: number): Promise<{ success?: boolean }> {
  await requireRole("admin");
  await execute("UPDATE users SET is_active = NOT is_active WHERE id = ?", [userId]);
  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateUserLocations(userId: number, locationIds: number[]): Promise<void> {
  await requireRole("admin");
  await execute("DELETE FROM user_locations WHERE user_id = ?", [userId]);
  for (const locId of locationIds) {
    await execute("INSERT INTO user_locations (user_id, location_id) VALUES (?, ?)", [userId, locId]);
  }
  revalidatePath("/admin/users");
}
