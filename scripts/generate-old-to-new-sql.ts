/**
 * generate-old-to-new-sql.ts
 *
 * Reads data from the old caisse DB and generates SQL INSERT statements
 * that target the new schema.
 *
 * Usage:
 *   cmd /c npx tsx scripts/generate-old-to-new-sql.ts
 *
 * Optional env:
 *   OLD_DB_NAME       default: u230791526_caissedb
 *   OLD_SQL_OUTPUT    default: old_to_new_inserts.sql
 *   DB_HOST / DATABASE_HOST
 *   DB_PORT / DATABASE_PORT
 *   DB_USER / DATABASE_USER
 *   DB_PASSWORD / DATABASE_PASSWORD
 */

import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { config } from "dotenv";
import { createConnection, type Connection, type RowDataPacket } from "mysql2/promise";

config();

type OldUser = RowDataPacket & {
  id: number;
  name: string | null;
  email: string | null;
  password: string | null;
  role: string | number | null;
};

type OldCategory = RowDataPacket & {
  id: number;
  category_name: string | null;
  category_type: string | null;
};

type OldDataRow = RowDataPacket & {
  id: number;
  category: string | null;
  description: string | null;
  price: number | string | null;
  type: string | null;
  payment_method: string | null;
  user_id: number | null;
  location: string | null;
  created_at: string | Date | null;
};

type OldTransferRow = RowDataPacket & {
  id: number;
  tr_from: string | null;
  tr_to: string | null;
  amount: number | string | null;
  date: string | Date | null;
  created_at: string | Date | null;
};

type PreparedTransaction = {
  type: "income" | "expense";
  categoryName: string;
  locationCode: string;
  amount: number;
  description: string;
  paymentMethod: "cash" | "bank_transfer" | "card" | "check" | "other";
  userEmail: string;
  transactionDate: string;
  createdAt: string;
};

type PreparedTransfer = {
  groupId: string;
  fromCode: string;
  toCode: string;
  amount: number;
  transferDate: string;
  createdAt: string;
};

function envOr(primary: string, fallback: string, defaultValue: string) {
  return process.env[primary] ?? process.env[fallback] ?? defaultValue;
}

async function connect(database: string): Promise<Connection> {
  return createConnection({
    host: envOr("DB_HOST", "DATABASE_HOST", "127.0.0.1"),
    port: Number(envOr("DB_PORT", "DATABASE_PORT", "3306")),
    user: envOr("DB_USER", "DATABASE_USER", "root"),
    password: envOr("DB_PASSWORD", "DATABASE_PASSWORD", ""),
    database,
    charset: "utf8mb4",
  });
}

function normalizeText(value: string) {
  return fixLegacyEncoding(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function mapCategoryType(oldType: string): "income" | "expense" {
  return normalizeText(oldType) === "recettes" ? "income" : "expense";
}

function mapTransactionType(oldType: string): "income" | "expense" {
  return normalizeText(oldType) === "rct" ? "income" : "expense";
}

function mapPaymentMethod(oldValue: string): "cash" | "bank_transfer" | "card" | "check" | "other" {
  const normalized = normalizeText(oldValue);
  if (normalized === "espece") return "cash";
  if (normalized === "cheque") return "check";
  if (normalized === "virement") return "bank_transfer";
  if (normalized === "carte" || normalized === "card") return "card";
  if (normalized === "paiement en ligne" || normalized === "online payment") return "other";
  return "other";
}

function mapRole(oldRole: string | number | null): "admin" | "manager" | "location_user" | "accountant" | "viewer" {
  const normalized = normalizeText(String(oldRole ?? ""));
  if (normalized === "admin" || normalized === "1" || normalized === "superadmin") return "admin";
  if (normalized === "manager" || normalized === "2") return "manager";
  if (normalized === "location_user" || normalized === "location user" || normalized === "3") return "location_user";
  if (normalized === "accountant" || normalized === "4") return "accountant";
  if (normalized === "viewer" || normalized === "5") return "viewer";
  return "admin";
}

function fixLegacyEncoding(value: string) {
  const text = value.trim();
  if (!text) return text;

  const likelyMojibake = /Ã.|Â.|â€™|â€œ|â€|Ð|Ñ/.test(text);
  if (!likelyMojibake) return text;

  try {
    return Buffer.from(text, "latin1").toString("utf8");
  } catch {
    return text;
  }
}

function toNonEmpty(value: unknown, fallbackValue: string) {
  const text = String(value ?? "").trim();
  if (!text) return fallbackValue;
  return fixLegacyEncoding(text) || fallbackValue;
}

function normalizeLocationCode(value: unknown) {
  return toNonEmpty(value, "UNKNOWN").toUpperCase();
}

function toNumber(value: unknown, fallbackValue: number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallbackValue;
}

function toMySqlDateTime(value: unknown, fallbackValue: string) {
  const date = new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime())) return fallbackValue;
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function escapeSqlString(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "''").replace(/\u0000/g, "");
}

function sqlString(value: string) {
  return `'${escapeSqlString(value)}'`;
}

function sqlNumber(value: number, digits = 4) {
  if (!Number.isFinite(value)) return "0";
  return value.toFixed(digits);
}

function userInsertTuple(user: {
  fullName: string;
  email: string;
  passwordHash: string;
  role: "admin" | "manager" | "location_user" | "accountant" | "viewer";
}) {
  return `(${sqlString(user.fullName)}, ${sqlString(user.email)}, ${sqlString(user.passwordHash)}, ${sqlString(user.role)}, 1, 'active')`;
}

function categoryInsertTuple(category: { name: string; type: "income" | "expense" }) {
  return `(${sqlString(category.name)}, ${sqlString(category.type)}, 1)`;
}

function locationInsertTuple(location: { code: string; name: string }) {
  return `(${sqlString(location.name)}, ${sqlString(location.code)}, '#6366f1', 1)`;
}

function insertTransactionStatement(transaction: PreparedTransaction, defaultUserEmail: string) {
  return [
    "INSERT INTO transactions (",
    "  type, category_id, location_id, amount, currency, description,",
    "  payment_method, created_by, transaction_date, created_at",
    ")",
    "SELECT",
    `  ${sqlString(transaction.type)},`,
    `  (SELECT id FROM categories WHERE LOWER(name) = LOWER(${sqlString(transaction.categoryName)}) LIMIT 1),`,
    `  (SELECT id FROM locations WHERE LOWER(code) = LOWER(${sqlString(transaction.locationCode)}) LIMIT 1),`,
    `  ${sqlNumber(transaction.amount)},`,
    "  'MAD',",
    `  ${sqlString(transaction.description)},`,
    `  ${sqlString(transaction.paymentMethod)},`,
    "  COALESCE(",
    `    (SELECT id FROM users WHERE LOWER(email) = LOWER(${sqlString(transaction.userEmail)}) LIMIT 1),`,
    `    (SELECT id FROM users WHERE LOWER(email) = LOWER(${sqlString(defaultUserEmail)}) LIMIT 1),`,
    "    (SELECT id FROM users ORDER BY id ASC LIMIT 1)",
    "  ),",
    `  ${sqlString(transaction.transactionDate)},`,
    `  ${sqlString(transaction.createdAt)};`,
  ].join("\n");
}

function insertTransferStatements(transfer: PreparedTransfer, defaultUserEmail: string) {
  const groupId = sqlString(transfer.groupId);
  const fromCode = sqlString(transfer.fromCode);
  const toCode = sqlString(transfer.toCode);
  const amount = sqlNumber(transfer.amount);
  const transferDate = sqlString(transfer.transferDate);
  const createdAt = sqlString(transfer.createdAt);
  const defaultUserSql = sqlString(defaultUserEmail);

  return [
    "-- Transfer pair",
    "INSERT INTO transactions (",
    "  type, category_id, location_id, amount, currency, description,",
    "  payment_method, transfer_group_id, created_by, transaction_date, created_at",
    ")",
    "SELECT",
    "  'transfer_out',",
    "  NULL,",
    `  (SELECT id FROM locations WHERE LOWER(code) = LOWER(${fromCode}) LIMIT 1),`,
    `  ${amount},`,
    "  'MAD',",
    "  'Virement interne',",
    "  'cash',",
    `  ${groupId},`,
    "  COALESCE(",
    `    (SELECT id FROM users WHERE LOWER(email) = LOWER(${defaultUserSql}) LIMIT 1),`,
    "    (SELECT id FROM users ORDER BY id ASC LIMIT 1)",
    "  ),",
    `  ${transferDate},`,
    `  ${createdAt};`,
    "",
    "INSERT INTO transactions (",
    "  type, category_id, location_id, amount, currency, description,",
    "  payment_method, transfer_group_id, created_by, transaction_date, created_at",
    ")",
    "SELECT",
    "  'transfer_in',",
    "  NULL,",
    `  (SELECT id FROM locations WHERE LOWER(code) = LOWER(${toCode}) LIMIT 1),`,
    `  ${amount},`,
    "  'MAD',",
    "  'Virement interne',",
    "  'cash',",
    `  ${groupId},`,
    "  COALESCE(",
    `    (SELECT id FROM users WHERE LOWER(email) = LOWER(${defaultUserSql}) LIMIT 1),`,
    "    (SELECT id FROM users ORDER BY id ASC LIMIT 1)",
    "  ),",
    `  ${transferDate},`,
    `  ${createdAt};`,
    "",
    "INSERT INTO transfers (",
    "  transfer_group_id, from_location_id, to_location_id, amount, currency, description,",
    "  payment_method, transfer_date, out_transaction_id, in_transaction_id, created_by, created_at",
    ")",
    "SELECT",
    `  ${groupId},`,
    `  (SELECT id FROM locations WHERE LOWER(code) = LOWER(${fromCode}) LIMIT 1),`,
    `  (SELECT id FROM locations WHERE LOWER(code) = LOWER(${toCode}) LIMIT 1),`,
    `  ${amount},`,
    "  'MAD',",
    "  'Virement interne',",
    "  'cash',",
    `  ${transferDate},`,
    "  (SELECT id FROM transactions WHERE transfer_group_id = " + groupId + " AND type = 'transfer_out' ORDER BY id DESC LIMIT 1),",
    "  (SELECT id FROM transactions WHERE transfer_group_id = " + groupId + " AND type = 'transfer_in' ORDER BY id DESC LIMIT 1),",
    "  COALESCE(",
    `    (SELECT id FROM users WHERE LOWER(email) = LOWER(${defaultUserSql}) LIMIT 1),`,
    "    (SELECT id FROM users ORDER BY id ASC LIMIT 1)",
    "  ),",
    `  ${createdAt};`,
  ].join("\n");
}

async function main() {
  const oldDbName = process.env.OLD_DB_NAME ?? "u230791526_caissedb";
  const outputFileName = process.env.OLD_SQL_OUTPUT ?? "old_to_new_inserts.sql";
  const outputPath = resolve(process.cwd(), outputFileName);

  const old = await connect(oldDbName);
  try {
    const [oldUsers] = await old.query<OldUser[]>(
      "SELECT id, name, email, password, role FROM users ORDER BY id ASC"
    );
    const [oldCategories] = await old.query<OldCategory[]>(
      "SELECT id, category_name, category_type FROM categories ORDER BY id ASC"
    );
    const [oldDataRows] = await old.query<OldDataRow[]>(
      `SELECT id, category, description, price, type, payment_method, user_id, location, created_at
       FROM data
       ORDER BY created_at ASC, id ASC`
    );
    const [oldTransferRows] = await old.query<OldTransferRow[]>(
      `SELECT id, tr_from, tr_to, amount, date, created_at
       FROM transactions
       ORDER BY date ASC, id ASC`
    );

    const users = oldUsers
      .map((row) => {
        const email = toNonEmpty(row.email, "");
        if (!email) return null;
        return {
          oldId: row.id,
          fullName: toNonEmpty(row.name, "Utilisateur"),
          email,
          passwordHash: toNonEmpty(row.password, "changeme"),
          role: mapRole(row.role),
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (users.length === 0) {
      users.push({
        oldId: -1,
        fullName: "Admin",
        email: "admin@example.com",
        passwordHash: "changeme",
        role: "admin",
      });
    }

    const defaultUserEmail = users[0].email;
    const userIdToEmail = new Map<number, string>();
    for (const user of users) {
      if (user.oldId > 0) {
        userIdToEmail.set(user.oldId, user.email);
      }
    }

    const categoryMap = new Map<string, { name: string; type: "income" | "expense" }>();
    for (const row of oldCategories) {
      const name = toNonEmpty(row.category_name, "");
      if (!name) continue;
      categoryMap.set(normalizeText(name), {
        name,
        type: mapCategoryType(toNonEmpty(row.category_type, "charges variables")),
      });
    }

    const preparedTransactions: PreparedTransaction[] = [];
    for (const row of oldDataRows) {
      const categoryName = toNonEmpty(row.category, "Autre");
      const type = mapTransactionType(toNonEmpty(row.type, "cv"));
      if (!categoryMap.has(normalizeText(categoryName))) {
        categoryMap.set(normalizeText(categoryName), { name: categoryName, type });
      }

      const userEmail = (row.user_id ? userIdToEmail.get(row.user_id) : null) ?? defaultUserEmail;
      const nowSql = toMySqlDateTime(new Date(), "1970-01-01 00:00:00");
      const createdAt = toMySqlDateTime(row.created_at, nowSql);

      preparedTransactions.push({
        type,
        categoryName,
        locationCode: normalizeLocationCode(row.location),
        amount: toNumber(row.price, 0),
        description: toNonEmpty(row.description, ""),
        paymentMethod: mapPaymentMethod(toNonEmpty(row.payment_method, "cash")),
        userEmail,
        transactionDate: createdAt,
        createdAt,
      });
    }

    const locations = new Map<string, { code: string; name: string }>();
    for (const transaction of preparedTransactions) {
      if (transaction.locationCode) {
        locations.set(transaction.locationCode, {
          code: transaction.locationCode,
          name: transaction.locationCode,
        });
      }
    }

    const preparedTransfers: PreparedTransfer[] = [];
    for (const row of oldTransferRows) {
      const fromCode = normalizeLocationCode(row.tr_from);
      const toCode = normalizeLocationCode(row.tr_to);
      const nowSql = toMySqlDateTime(new Date(), "1970-01-01 00:00:00");
      const transferDate = toMySqlDateTime(row.date, nowSql);
      const createdAt = toMySqlDateTime(row.created_at ?? row.date, transferDate);

      locations.set(fromCode, { code: fromCode, name: fromCode });
      locations.set(toCode, { code: toCode, name: toCode });

      preparedTransfers.push({
        groupId: randomUUID(),
        fromCode,
        toCode,
        amount: toNumber(row.amount, 0),
        transferDate,
        createdAt,
      });
    }

    const sqlBlocks: string[] = [];
    sqlBlocks.push("-- =============================================================");
    sqlBlocks.push("-- Generated by scripts/generate-old-to-new-sql.ts");
    sqlBlocks.push(`-- Source DB: ${oldDbName}`);
    sqlBlocks.push(`-- Generated at: ${new Date().toISOString()}`);
    sqlBlocks.push(`-- Users: ${users.length}`);
    sqlBlocks.push(`-- Categories: ${categoryMap.size}`);
    sqlBlocks.push(`-- Locations: ${locations.size}`);
    sqlBlocks.push(`-- Transactions (from old data): ${preparedTransactions.length}`);
    sqlBlocks.push(`-- Transfers (from old transactions): ${preparedTransfers.length}`);
    sqlBlocks.push("-- =============================================================");
    sqlBlocks.push("");
    sqlBlocks.push("START TRANSACTION;");
    sqlBlocks.push("SET FOREIGN_KEY_CHECKS = 0;");
    sqlBlocks.push("");

    if (users.length > 0) {
      sqlBlocks.push("-- Users");
      sqlBlocks.push(
        "INSERT INTO users (full_name, email, password_hash, role, is_active, status) VALUES"
      );
      sqlBlocks.push(users.map((user) => `  ${userInsertTuple(user)}`).join(",\n"));
      sqlBlocks.push(
        "ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash), role = VALUES(role), is_active = VALUES(is_active), status = VALUES(status);"
      );
      sqlBlocks.push("");
    }

    if (categoryMap.size > 0) {
      sqlBlocks.push("-- Categories");
      sqlBlocks.push("INSERT INTO categories (name, type, is_active) VALUES");
      sqlBlocks.push(
        Array.from(categoryMap.values())
          .map((category) => `  ${categoryInsertTuple(category)}`)
          .join(",\n")
      );
      sqlBlocks.push(
        "ON DUPLICATE KEY UPDATE type = VALUES(type), is_active = VALUES(is_active);"
      );
      sqlBlocks.push("");
    }

    if (locations.size > 0) {
      sqlBlocks.push("-- Locations");
      sqlBlocks.push("INSERT INTO locations (name, code, color, is_active) VALUES");
      sqlBlocks.push(
        Array.from(locations.values())
          .map((location) => `  ${locationInsertTuple(location)}`)
          .join(",\n")
      );
      sqlBlocks.push(
        "ON DUPLICATE KEY UPDATE name = VALUES(name), color = VALUES(color), is_active = VALUES(is_active);"
      );
      sqlBlocks.push("");
    }

    if (preparedTransactions.length > 0) {
      sqlBlocks.push("-- Transactions from old `data` table");
      for (const transaction of preparedTransactions) {
        sqlBlocks.push(insertTransactionStatement(transaction, defaultUserEmail));
        sqlBlocks.push("");
      }
    }

    if (preparedTransfers.length > 0) {
      sqlBlocks.push("-- Transfers from old `transactions` table");
      for (const transfer of preparedTransfers) {
        sqlBlocks.push(insertTransferStatements(transfer, defaultUserEmail));
        sqlBlocks.push("");
      }
    }

    sqlBlocks.push("SET FOREIGN_KEY_CHECKS = 1;");
    sqlBlocks.push("COMMIT;");
    sqlBlocks.push("");

    await writeFile(outputPath, sqlBlocks.join("\n"), "utf8");
    console.log(`SQL export generated at: ${outputPath}`);
  } finally {
    await old.end();
  }
}

main().catch((error) => {
  console.error("Failed to generate SQL export:", error);
  process.exit(1);
});
