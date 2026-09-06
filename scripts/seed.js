const Database = require("better-sqlite3");
const fs = require("node:fs");
const path = require("node:path");

const dbPath = path.resolve(process.cwd(), process.env.DATABASE_PATH || "data/panda-gestion.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS concepts (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT NOT NULL,
    default_amount_cents INTEGER NOT NULL DEFAULT 0 CHECK(default_amount_cents >= 0),
    due_day INTEGER NOT NULL DEFAULT 1 CHECK(due_day BETWEEN 1 AND 31),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT, concept_id INTEGER NOT NULL, concept_name TEXT NOT NULL,
    category TEXT NOT NULL, amount_cents INTEGER NOT NULL CHECK(amount_cents >= 0),
    month TEXT NOT NULL CHECK(length(month) = 7), due_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid')),
    paid_at TEXT, notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE RESTRICT, UNIQUE(concept_id, month)
  );
`);

const existing = db.prepare("SELECT COUNT(*) AS count FROM concepts").get().count;
if (existing) {
  console.log("La base ya contiene conceptos; no se agregaron datos de demostración.");
  db.close();
  process.exit(0);
}

const concepts = [
  ["Alquiler", "Vivienda", 52000000, 5],
  ["Internet", "Servicios", 3200000, 10],
  ["Celular", "Servicios", 1850000, 12],
  ["Tarjeta de crédito", "Tarjetas", 24500000, 15],
  ["Obra social", "Salud", 9600000, 8],
  ["Streaming", "Suscripciones", 1500000, 20],
];

const insertConcept = db.prepare("INSERT INTO concepts (name, category, default_amount_cents, due_day) VALUES (?, ?, ?, ?)");
const insertExpense = db.prepare(`
  INSERT INTO expenses (concept_id, concept_name, category, amount_cents, month, due_date, status, paid_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const now = new Date();
const seed = db.transaction(() => {
  const inserted = concepts.map((concept) => ({ id: Number(insertConcept.run(...concept).lastInsertRowid), data: concept }));
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    inserted.forEach(({ id, data }, index) => {
      const [name, category, baseAmount, day] = data;
      const variation = 1 + ((5 - offset) * 0.015) + (index % 2 ? 0.01 : 0);
      const amount = Math.round(baseAmount * variation);
      const paid = offset > 0 || index < 3;
      insertExpense.run(id, name, category, amount, month, `${month}-${String(day).padStart(2, "0")}`, paid ? "paid" : "pending", paid ? new Date().toISOString() : null);
    });
  }
});

seed();
db.close();
console.log(`Datos de demostración creados en ${dbPath}`);
