import { query } from "@/lib/db";

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "manager" | "location_user" | "accountant" | "viewer";
  is_active: boolean;
  location_count: number;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  return query<AdminUser>(
    `SELECT u.id, u.full_name as name, u.email, u.role, u.is_active,
            COUNT(ul.location_id) as location_count
     FROM users u
     LEFT JOIN user_locations ul ON ul.user_id = u.id
     GROUP BY u.id, u.full_name, u.email, u.role, u.is_active
     ORDER BY u.full_name`
  );
}

export async function getUserLocations(userId: number): Promise<number[]> {
  const rows = await query<{ location_id: number }>(
    "SELECT location_id FROM user_locations WHERE user_id = ?",
    [userId]
  );
  return rows.map(r => r.location_id);
}
