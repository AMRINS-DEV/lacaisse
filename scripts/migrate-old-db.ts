/**
 * migrate-old-db.ts
 *
 * Migrates data from the old Laravel/PHP caisse database into the new schema.
 *
 * Usage:
 *   1. Import the old DB:  mysql -u root -p < /path/to/u230791526_caissedb.sql
 *   2. Run:  npx tsx scripts/migrate-old-db.ts
 *
 * Environment variables (falls back to .env values):
 *   OLD_DB_NAME   – old database name  (default: u230791526_caissedb)
 *   DB_HOST / DATABASE_HOST, DB_USER / DATABASE_USER, etc.
 */

import { createConnection, type Connection } from "mysql2/promise";
import { config } from "dotenv";
import { randomUUID } from "crypto";

config();

// ── Connection helpers ────────────────────────────────────────────────────────

function envOr(a: string, b: string, fallback: string): string {
  return process.env[a] ?? process.env[b] ?? fallback;
}

async function connect(database: string): Promise<Connection> {
  return createConnection({
    host:     envOr("DB_HOST",     "DATABASE_HOST",     "127.0.0.1"),
    port:     Number(envOr("DB_PORT", "DATABASE_PORT", "3306")),
    user:     envOr("DB_USER",     "DATABASE_USER",     "root"),
    password: envOr("DB_PASSWORD", "DATABASE_PASSWORD", ""),
    database,
    charset:  "utf8mb4",
  });
}

// ── Field-level mappings ──────────────────────────────────────────────────────

function mapCategoryType(oldType: string): "income" | "expense" {
  if (oldType === "recettes") return "income";
  return "expense"; // "charges variables" | "charges fixe"
}

function mapTransactionType(oldType: string): "income" | "expense" {
  if (oldType === "rct") return "income";
  return "expense"; // "cv" | "cf"
}

function mapPaymentMethod(
  old: string
): "cash" | "bank_transfer" | "card" | "check" | "other" {
  const m: Record<string, "cash" | "bank_transfer" | "card" | "check" | "other"> = {
    "espèce":           "cash",
    "espece":           "cash",
    "cheque":           "check",
    "chèque":           "check",
    "virement":         "bank_transfer",
    "paiement en ligne":"other",
  };
  return m[old.toLowerCase().trim()] ?? "other";
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const OLD_DB = process.env.OLD_DB_NAME ?? "u230791526_caissedb";
  const NEW_DB = envOr("DB_DATABASE", "DATABASE_NAME", "caisse");

  console.log(`\nConnecting to OLD: ${OLD_DB}  →  NEW: ${NEW_DB}\n`);

  const old = await connect(OLD_DB);
  const neo = await connect(NEW_DB);

  try {
    await neo.beginTransaction();

    // ── 1. Users ─────────────────────────────────────────────────────────────
    console.log("── Migrating users …");

    const [oldUsers] = await old.query<any[]>(
      "SELECT id, name, email, password, role FROM users"
    );

    const userIdMap = new Map<number, number>(); // old id → new id

    for (const u of oldUsers) {
      // Check if email already exists in new DB
      const [existing] = await neo.query<any[]>(
        "SELECT id FROM users WHERE email = ?",
        [u.email]
      );

      if (existing.length > 0) {
        console.log(`  SKIP user ${u.email} (already exists, id=${existing[0].id})`);
        userIdMap.set(u.id, existing[0].id);
        continue;
      }

      // role '1' = admin in old system; default everything to admin
      const newRole = "admin";

      const [res] = await neo.execute<any>(
        `INSERT INTO users (full_name, email, password_hash, role, is_active)
         VALUES (?, ?, ?, ?, 1)`,
        [u.name, u.email, u.password, newRole]
      );
      userIdMap.set(u.id, res.insertId);
      console.log(`  + user: ${u.email} → new id ${res.insertId}`);
    }

    // Ensure we have at least one user to assign records to
    const defaultUserId = userIdMap.values().next().value;
    if (!defaultUserId) {
      throw new Error("No users migrated — cannot assign transactions.");
    }

    // ── 2. Categories ─────────────────────────────────────────────────────────
    console.log("\n── Migrating categories …");

    const [oldCats] = await old.query<any[]>(
      "SELECT id, category_name, category_type FROM categories"
    );

    const catNameMap = new Map<string, number>(); // category_name → new id

    // Pre-load existing categories from new DB
    const [existingCats] = await neo.query<any[]>(
      "SELECT id, name FROM categories"
    );
    for (const c of existingCats) {
      catNameMap.set(c.name.toLowerCase(), c.id);
    }

    for (const c of oldCats) {
      const nameLower = c.category_name.toLowerCase();
      if (catNameMap.has(nameLower)) {
        console.log(`  SKIP category "${c.category_name}" (already exists)`);
        continue;
      }

      const newType = mapCategoryType(c.category_type);
      const [res] = await neo.execute<any>(
        `INSERT INTO categories (name, type, is_active) VALUES (?, ?, 1)`,
        [c.category_name, newType]
      );
      catNameMap.set(nameLower, res.insertId);
      console.log(`  + category: "${c.category_name}" [${newType}] → id ${res.insertId}`);
    }

    // ── 3. Locations (already seeded, just build the map) ────────────────────
    console.log("\n── Building location map …");

    const [newLocs] = await neo.query<any[]>(
      "SELECT id, code FROM locations"
    );
    const locCodeMap = new Map<string, number>(); // code (lower) → new id
    for (const l of newLocs) {
      locCodeMap.set(l.code.toLowerCase(), l.id);
    }
    console.log(`  Found ${locCodeMap.size} locations: ${[...locCodeMap.keys()].join(", ")}`);

    // ── 4. Data → Transactions ───────────────────────────────────────────────
    console.log("\n── Migrating data → transactions …");

    const [oldData] = await old.query<any[]>(
      `SELECT id, category, description, price, type, payment_method,
              user_id, location, created_at
       FROM data
       ORDER BY created_at ASC`
    );

    let txInserted = 0;
    let txSkipped  = 0;

    for (const d of oldData) {
      const categoryKey = (d.category as string).toLowerCase().trim();
      const categoryId  = catNameMap.get(categoryKey) ?? null;

      if (!categoryId) {
        console.warn(`  WARN: unknown category "${d.category}" — using NULL`);
      }

      const locationCode = (d.location as string).toLowerCase().trim();
      const locationId   = locCodeMap.get(locationCode);

      if (!locationId) {
        console.warn(`  WARN: unknown location "${d.location}" — skipping row ${d.id}`);
        txSkipped++;
        continue;
      }

      const userId  = userIdMap.get(d.user_id) ?? defaultUserId;
      const txType  = mapTransactionType(d.type);
      const payment = mapPaymentMethod(d.payment_method);
      const date    = new Date(d.created_at);

      await neo.execute(
        `INSERT INTO transactions
           (type, category_id, location_id, amount, currency, description,
            payment_method, created_by, transaction_date)
         VALUES (?, ?, ?, ?, 'MAD', ?, ?, ?, ?)`,
        [txType, categoryId, locationId, d.price, d.description, payment, userId, date]
      );
      txInserted++;
    }

    console.log(`  Inserted ${txInserted} transactions, skipped ${txSkipped}`);

    // ── 5. Old Transactions → Transfers ──────────────────────────────────────
    console.log("\n── Migrating old transfers …");

    const [oldTransfers] = await old.query<any[]>(
      `SELECT id, tr_from, tr_to, amount, date, created_at FROM transactions ORDER BY date ASC`
    );

    let trInserted = 0;

    for (const t of oldTransfers) {
      const fromCode = (t.tr_from as string).toLowerCase();
      const toCode   = (t.tr_to   as string).toLowerCase();

      const fromLocId = locCodeMap.get(fromCode);
      const toLocId   = locCodeMap.get(toCode);

      if (!fromLocId || !toLocId) {
        console.warn(`  WARN: unknown location in transfer ${t.id} (${t.tr_from}→${t.tr_to}) — skipping`);
        continue;
      }

      const groupId = randomUUID();
      const date    = new Date(t.date);
      const amount  = Number(t.amount);

      // Insert transfer_out transaction
      const [outRes] = await neo.execute<any>(
        `INSERT INTO transactions
           (type, category_id, location_id, amount, currency, description,
            payment_method, transfer_group_id, created_by, transaction_date)
         VALUES ('transfer_out', NULL, ?, ?, 'MAD', 'Virement interne', 'cash', ?, ?, ?)`,
        [fromLocId, amount, groupId, defaultUserId, date]
      );

      // Insert transfer_in transaction
      const [inRes] = await neo.execute<any>(
        `INSERT INTO transactions
           (type, category_id, location_id, amount, currency, description,
            payment_method, transfer_group_id, created_by, transaction_date)
         VALUES ('transfer_in', NULL, ?, ?, 'MAD', 'Virement interne', 'cash', ?, ?, ?)`,
        [toLocId, amount, groupId, defaultUserId, date]
      );

      // Insert transfer record
      await neo.execute(
        `INSERT INTO transfers
           (transfer_group_id, from_location_id, to_location_id, amount, currency,
            description, payment_method, transfer_date,
            out_transaction_id, in_transaction_id, created_by)
         VALUES (?, ?, ?, ?, 'MAD', 'Virement interne', 'cash', ?, ?, ?, ?)`,
        [groupId, fromLocId, toLocId, amount, date, outRes.insertId, inRes.insertId, defaultUserId]
      );

      trInserted++;
      console.log(`  + transfer ${t.tr_from}→${t.tr_to}  ${amount} MAD  (${t.date})`);
    }

    console.log(`  Inserted ${trInserted} transfers`);

    // ── Done ─────────────────────────────────────────────────────────────────
    await neo.commit();
    console.log("\n✔ Migration complete!\n");
  } catch (err) {
    await neo.rollback();
    console.error("\n✗ Migration failed — rolled back\n", err);
    process.exit(1);
  } finally {
    await old.end();
    await neo.end();
  }
}

main();
