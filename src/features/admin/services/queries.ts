import { query } from "@/lib/db";

export interface ServiceOption {
  id: number;
  key: string;
  label: string;
  is_active: boolean;
}

export async function getServices(activeOnly = true): Promise<ServiceOption[]> {
  const where = activeOnly ? "WHERE is_active = 1" : "";
  return query<ServiceOption>(
    `SELECT
        id,
        service_key as \`key\`,
        name as label,
        is_active
     FROM services
     ${where}
     ORDER BY name ASC`
  );
}
