import mysql from "mysql2/promise";
import { env } from "@/lib/env";

const DEFAULT_CONNECTION_LIMIT = 5;
const DEFAULT_IDLE_TIMEOUT_MS = 60_000;

const connectionLimit = Math.max(
  1,
  Number.parseInt(process.env.DATABASE_CONNECTION_LIMIT ?? `${DEFAULT_CONNECTION_LIMIT}`, 10)
);
const queueLimit = Math.max(
  0,
  Number.parseInt(process.env.DATABASE_QUEUE_LIMIT ?? "0", 10)
);

type GlobalWithDbPool = typeof globalThis & {
  __caisseDbPool?: mysql.Pool;
};

function createPool() {
  return mysql.createPool({
    host: env.DATABASE_HOST,
    port: Number.parseInt(env.DATABASE_PORT, 10),
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME,
    waitForConnections: true,
    connectTimeout: 10_000,
    connectionLimit,
    maxIdle: connectionLimit,
    idleTimeout: DEFAULT_IDLE_TIMEOUT_MS,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    queueLimit,
    timezone: "+00:00",
  });
}

const globalForDb = globalThis as GlobalWithDbPool;
const pool = globalForDb.__caisseDbPool ?? createPool();

if (!globalForDb.__caisseDbPool) {
  globalForDb.__caisseDbPool = pool;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SqlParams = any[];

export async function query<T = unknown>(
  sql: string,
  params?: SqlParams
): Promise<T[]> {
  try {
    const [rows] = await pool.query(sql, params);
    return rows as T[];
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "ER_CON_COUNT_ERROR"
    ) {
      throw new Error(
        "Database connection limit reached. Reusing a singleton pool is enabled; restart dev server and lower DATABASE_CONNECTION_LIMIT if needed."
      );
    }
    throw error;
  }
}

export async function queryOne<T = unknown>(
  sql: string,
  params?: SqlParams
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(
  sql: string,
  params?: SqlParams
): Promise<{ insertId: number; affectedRows: number }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result] = await pool.execute(sql, params) as any;
  return { insertId: result.insertId, affectedRows: result.affectedRows };
}

export { pool };
export default pool;
