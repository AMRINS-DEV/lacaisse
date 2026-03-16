import { query, queryOne } from "@/lib/db";

export interface Location {
  id: number;
  code: string;
  name: string;
  color: string;
  is_active: boolean;
}

export async function getLocations(activeOnly = true): Promise<Location[]> {
  const where = activeOnly ? "WHERE is_active = 1" : "";
  return query<Location>(
    `SELECT id, code, COALESCE(name, code) as name,
            COALESCE(color, '#6366f1') as color, is_active
     FROM locations ${where} ORDER BY code`
  );
}

export async function getLocationById(id: number): Promise<Location | null> {
  return queryOne<Location>(
    `SELECT id, code, COALESCE(name, code) as name,
            COALESCE(color, '#6366f1') as color, is_active
     FROM locations WHERE id = ?`,
    [id]
  );
}
