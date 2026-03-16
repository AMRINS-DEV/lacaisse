import { execute } from "@/lib/db";

interface AuditEntry {
  userId: number;
  action: "create" | "update" | "delete";
  tableName: string;
  recordId?: number;
  beforeData?: unknown;
  afterData?: unknown;
  ipAddress?: string;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await execute(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, before_data, after_data, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.userId,
        entry.action,
        entry.tableName,
        entry.recordId ?? null,
        entry.beforeData ? JSON.stringify(entry.beforeData) : null,
        entry.afterData ? JSON.stringify(entry.afterData) : null,
        entry.ipAddress ?? null,
      ]
    );
  } catch {
    // Audit log failure should never block the main operation
    console.error("Audit log failed:", entry);
  }
}
