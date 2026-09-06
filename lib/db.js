import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dbPath = process.env.DATABASE_PATH
  ? path.resolve(/* turbopackIgnore: true */ process.env.DATABASE_PATH)
  : path.join(process.cwd(), "data", "panda-gestion.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const globalForDb = globalThis;
const db = globalForDb.__pandaDb || new Database(dbPath);

if (process.env.NODE_ENV !== "production") globalForDb.__pandaDb = db;

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

db.exec(`
  CREATE TABLE IF NOT EXISTS concepts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    default_amount_cents INTEGER NOT NULL DEFAULT 0 CHECK(default_amount_cents >= 0),
    due_day INTEGER NOT NULL DEFAULT 1 CHECK(due_day BETWEEN 1 AND 31),
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

export default db;
export { dbPath };
