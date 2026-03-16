import { createConnection } from "mysql2/promise";
import bcrypt from "bcryptjs";

async function seed() {
  const conn = await createConnection({
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "jamal",
    database: process.env.DB_DATABASE ?? "caisse",
  });

  console.log("Seeding database...");

  // Seed locations (c1-c4 as defaults)
  const locations = [
    { code: "c1", name: "Caisse 1", color: "#6366f1" },
    { code: "c2", name: "Caisse 2", color: "#10b981" },
    { code: "c3", name: "Caisse 3", color: "#f59e0b" },
    { code: "c4", name: "Caisse 4", color: "#ef4444" },
  ];

  for (const loc of locations) {
    await conn.execute(
      `INSERT IGNORE INTO locations (code, name, color, is_active) VALUES (?, ?, ?, 1)`,
      [loc.code, loc.name, loc.color]
    );
  }
  console.log("Locations seeded");

  // Seed categories
  const categories = [
    { name: "Vente",         type: "income" },
    { name: "Service",       type: "income" },
    { name: "Remboursement", type: "income" },
    { name: "Fournitures",   type: "expense" },
    { name: "Transport",     type: "expense" },
    { name: "Marketing",     type: "expense" },
    { name: "Loyer",         type: "expense" },
    { name: "Salaires",      type: "expense" },
    { name: "Assurance",     type: "expense" },
  ];

  for (const cat of categories) {
    await conn.execute(
      `INSERT IGNORE INTO categories (name, type, is_active) VALUES (?, ?, 1)`,
      [cat.name, cat.type]
    );
  }
  console.log("Categories seeded");

  // Seed default admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  await conn.execute(
    `INSERT IGNORE INTO users (full_name, email, password_hash, role, is_active)
     VALUES ('Admin', 'admin@caisse.ma', ?, 'admin', 1)`,
    [adminPassword]
  );
  console.log("Admin user seeded -- email: admin@caisse.ma / password: admin123");

  await conn.end();
  console.log("Done!");
}

seed().catch(console.error);
