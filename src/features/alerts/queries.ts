import { query } from "@/lib/db";

export interface Alert {
  id: number;
  name: string;
  type: "budget_exceeded" | "low_balance" | "custom";
  location_id: number | null;
  location_name: string | null;
  category: string | null;
  threshold: number;
  period: "daily" | "weekly" | "monthly";
  is_active: boolean;
  created_at: string;
}

export interface AlertLog {
  id: number;
  alert_name: string;
  triggered_value: number;
  threshold: number;
  triggered_at: string;
}

export async function getAlerts(): Promise<Alert[]> {
  return query<Alert>(
    `SELECT a.id, a.name, a.type, a.location_id,
            COALESCE(l.name, l.code) as location_name,
            a.category, a.threshold, a.period, a.is_active, a.created_at
     FROM alerts a
     LEFT JOIN locations l ON l.id = a.location_id
     ORDER BY a.created_at DESC`
  );
}

export async function getRecentAlertLogs(limit = 20): Promise<AlertLog[]> {
  return query<AlertLog>(
    `SELECT al.id, a.name as alert_name,
            al.triggered_value, a.threshold, al.triggered_at
     FROM alert_logs al
     JOIN alerts a ON a.id = al.alert_id
     ORDER BY al.triggered_at DESC
     LIMIT ?`,
    [limit]
  );
}

export async function checkAndTriggerAlerts(): Promise<number> {
  const alerts = await query<Alert>(
    `SELECT a.id, a.name, a.type, a.location_id, a.category, a.threshold, a.period
     FROM alerts a WHERE a.is_active = 1`
  );

  let triggered = 0;

  for (const alert of alerts) {
    let periodCondition = "";
    if (alert.period === "daily") periodCondition = "DATE(date) = CURDATE()";
    else if (alert.period === "weekly") periodCondition = "YEARWEEK(date, 1) = YEARWEEK(CURDATE(), 1)";
    else periodCondition = "MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())";

    const conditions = [periodCondition];
    const params: unknown[] = [];

    if (alert.location_id) { conditions.push("location_id = ?"); params.push(alert.location_id); }
    if (alert.category) { conditions.push("category = ?"); params.push(alert.category); }

    if (alert.type === "budget_exceeded") {
      conditions.push("type IN ('cv', 'cf')");
    }

    const rows = await query<{ total: number }>(
      `SELECT COALESCE(SUM(price), 0) as total FROM data WHERE ${conditions.join(" AND ")}`,
      params
    );
    const currentValue = Number(rows[0]?.total ?? 0);

    if (currentValue >= alert.threshold) {
      // Check if already triggered today
      const existing = await query<{ id: number }>(
        `SELECT id FROM alert_logs WHERE alert_id = ? AND DATE(triggered_at) = CURDATE()`,
        [alert.id]
      );
      if (existing.length === 0) {
        await query(
          `INSERT INTO alert_logs (alert_id, triggered_value, triggered_at) VALUES (?, ?, NOW())`,
          [alert.id, currentValue]
        );
        triggered++;
      }
    }
  }

  return triggered;
}

export async function getUnreadAlertCount(): Promise<number> {
  const rows = await query<{ count: number }>(
    `SELECT COUNT(*) as count FROM alert_logs
     WHERE DATE(triggered_at) = CURDATE()`
  );
  return Number(rows[0]?.count ?? 0);
}
