import fs from "fs";
import path from "path";
import { pool } from "./index";

const MIGRATIONS_DIR = path.join(process.cwd(), "src/lib/db/migrations");

const IGNORABLE_ERRORS = new Set([
  "ER_DUP_FIELDNAME",
  "ER_DUP_KEYNAME",
  "ER_TABLE_EXISTS_ERROR",
  "ER_DUP_ENTRY",
]);

export async function runMigrations(): Promise<void> {
  // Ensure schema_migrations table exists first
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      version VARCHAR(100) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Get already-run migrations
  const [rows] = await pool.execute<any[]>("SELECT version FROM schema_migrations");
  const ran = new Set(rows.map((r: any) => r.version));

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (ran.has(file)) {
      console.log(`[migrate] skip ${file} (already applied)`);
      continue;
    }

    console.log(`[migrate] running ${file}...`);
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      try {
        await pool.execute(stmt);
      } catch (err: any) {
        if (IGNORABLE_ERRORS.has(err.code)) continue;
        throw new Error(`Migration ${file} failed: ${err.message}\nStatement: ${stmt}`);
      }
    }

    await pool.execute("INSERT INTO schema_migrations (version) VALUES (?)", [file]);
    console.log(`[migrate] ✅ ${file} applied`);
  }

  console.log("[migrate] all migrations applied");
}

runMigrations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
