const Database = require("better-sqlite3");
const fs = require("node:fs");
const path = require("node:path");

const dbPath = path.resolve(process.cwd(), process.env.DATABASE_PATH || "data/panda-gestion.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL COLLATE NOCASE UNIQUE,
    color TEXT NOT NULL DEFAULT '#64748b', is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS concepts (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT NOT NULL,
    default_amount_cents INTEGER NOT NULL DEFAULT 0 CHECK(default_amount_cents >= 0),
    due_day INTEGER NOT NULL DEFAULT 1 CHECK(due_day BETWEEN 1 AND 31),
    closing_day INTEGER,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT, concept_id INTEGER NOT NULL, concept_name TEXT NOT NULL,
    category TEXT NOT NULL, amount_cents INTEGER NOT NULL CHECK(amount_cents >= 0),
    month TEXT NOT NULL CHECK(length(month) = 7), due_date TEXT NOT NULL, closing_date TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid')),
    paid_at TEXT, notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE RESTRICT, UNIQUE(concept_id, month)
  );
`);

const categories = [
  ["Vivienda", "#7c3aed"], ["Servicios", "#0ea5e9"], ["Tarjetas", "#f97316"],
  ["Transporte", "#14b8a6"], ["Alimentación", "#ef4444"], ["Salud", "#ec4899"],
  ["Educación", "#8b5cf6"], ["Suscripciones", "#06b6d4"], ["Impuestos", "#eab308"], ["Otros", "#64748b"],
];
const insertCategory = db.prepare("INSERT OR IGNORE INTO categories (name, color) VALUES (?, ?)");
for (const category of categories) insertCategory.run(...category);

const existing = db.prepare("SELECT COUNT(*) AS count FROM concepts").get().count;
if (existing) {
  console.log("La base ya contiene conceptos; no se agregaron datos de demostración.");
  db.close();
  process.exit(0);
}

const concepts = [
  ["Alquiler", "Vivienda", 52000000, 5, null],
  ["Internet", "Servicios", 3200000, 10, null],
  ["Celular", "Servicios", 1850000, 12, null],
  ["Tarjeta de crédito", "Tarjetas", 24500000, 15, 28],
  ["Obra social", "Salud", 9600000, 8, null],
  ["Streaming", "Suscripciones", 1500000, 20, null],
];

const insertConcept = db.prepare("INSERT INTO concepts (name, category, default_amount_cents, due_day, closing_day) VALUES (?, ?, ?, ?, ?)");
const insertExpense = db.prepare(`
  INSERT INTO expenses (concept_id, concept_name, category, amount_cents, month, due_date, closing_date, status, paid_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

function dateForDay(month, day) {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  return `${month}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}

function closingDateForMonth(month, closingDay, dueDay) {
  if (!closingDay) return null;
  if (closingDay <= dueDay) return dateForDay(month, closingDay);
  const [year, monthNumber] = month.split("-").map(Number);
  const previous = new Date(year, monthNumber - 2, 1);
  return dateForDay(`${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, "0")}`, closingDay);
}

const now = new Date();
const seed = db.transaction(() => {
  const inserted = concepts.map((concept) => ({ id: Number(insertConcept.run(...concept).lastInsertRowid), data: concept }));
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    inserted.forEach(({ id, data }, index) => {
      const [name, category, baseAmount, day, closingDay] = data;
      const variation = 1 + ((5 - offset) * 0.015) + (index % 2 ? 0.01 : 0);
      const amount = Math.round(baseAmount * variation);
      const paid = offset > 0 || index < 3;
      insertExpense.run(id, name, category, amount, month, dateForDay(month, day), closingDateForMonth(month, closingDay, day), paid ? "paid" : "pending", paid ? new Date().toISOString() : null);
    });
  }
});

seed();
db.close();
console.log(`Datos de demostración creados en ${dbPath}`);
