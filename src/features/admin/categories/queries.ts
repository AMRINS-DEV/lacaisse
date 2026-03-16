import { query } from "@/lib/db";

export interface Category {
  id: number;
  name: string;
  type: string;
  is_active: boolean;
}

/** Normalize legacy type codes to the DB enum values. */
function normalizeType(type: string): "income" | "expense" {
  if (type === "rct" || type === "income") return "income";
  if (type === "cv" || type === "cf" || type === "expense") return "expense";
  return "income";
}

export async function getCategories(type?: string, activeOnly = true): Promise<Category[]> {
  if (type) {
    const dbType = normalizeType(type);
    return query<Category>(
      `SELECT id, name, type, is_active FROM categories
       WHERE type = ? AND is_active = 1
       ORDER BY name`,
      [dbType]
    );
  }
  if (!activeOnly) {
    return query<Category>(
      "SELECT id, name, type, is_active FROM categories ORDER BY name"
    );
  }
  return query<Category>(
    "SELECT id, name, type, is_active FROM categories WHERE is_active = 1 ORDER BY name"
  );
}
