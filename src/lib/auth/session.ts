import { auth } from "@/auth";
import { query } from "@/lib/db";

export async function getSession() {
  return await auth();
}

export async function getUserLocations(userId: number): Promise<number[]> {
  const rows = await query<{ location_id: number }>(
    "SELECT location_id FROM user_locations WHERE user_id = ?",
    [userId]
  );
  return rows.map(r => r.location_id);
}
