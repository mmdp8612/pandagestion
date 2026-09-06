import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { CATEGORIES } from "@/lib/constants";

const dbPath = process.env.DATABASE_PATH
  ? path.resolve(/* turbopackIgnore: true */ process.env.DATABASE_PATH)
  : path.join(process.cwd(), "data", "panda-gestion.db");

const globalForDb = globalThis;

function ensureColumn(database, table, column, definition) {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some((item) => item.name === column)) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function seedDefaultCategories(database) {
  const insert = database.prepare("INSERT OR IGNORE INTO categories (name, color) VALUES (?, ?)");
  const seed = database.transaction(() => {
    for (const category of CATEGORIES) insert.run(category.value, category.color);
  });
  seed();
}

export function getDatabase() {
  if (globalForDb.__pandaDb) return globalForDb.__pandaDb;

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const database = new Database(dbPath);

  // El timeout se configura antes de WAL para tolerar arranques concurrentes.
  database.pragma("busy_timeout = 5000");
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");

  database.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL COLLATE NOCASE UNIQUE,
      color TEXT NOT NULL DEFAULT '#64748b',
      is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS concepts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      default_amount_cents INTEGER NOT NULL DEFAULT 0 CHECK(default_amount_cents >= 0),
      due_day INTEGER NOT NULL DEFAULT 1 CHECK(due_day BETWEEN 1 AND 31),
      closing_day INTEGER,
      is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      concept_id INTEGER NOT NULL,
      concept_name TEXT NOT NULL,
      category TEXT NOT NULL,
      amount_cents INTEGER NOT NULL CHECK(amount_cents >= 0),
      month TEXT NOT NULL CHECK(length(month) = 7),
      due_date TEXT NOT NULL,
      closing_date TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid')),
      paid_at TEXT,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE RESTRICT,
      UNIQUE(concept_id, month)
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_month ON expenses(month);
    CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
  `);

  ensureColumn(database, "concepts", "closing_day", "INTEGER");
  ensureColumn(database, "expenses", "closing_date", "TEXT");
  seedDefaultCategories(database);

  globalForDb.__pandaDb = database;
  return database;
}

export { dbPath };
