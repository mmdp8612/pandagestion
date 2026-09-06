import { getDatabase } from "@/lib/db";

function mapConcept(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    defaultAmount: row.default_amount_cents / 100,
    dueDay: row.due_day,
    closingDay: row.closing_day,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
  };
}

export function listConcepts() {
  const db = getDatabase();
  return db.prepare("SELECT * FROM concepts ORDER BY is_active DESC, name COLLATE NOCASE").all().map(mapConcept);
}

export function getConcept(id) {
  const db = getDatabase();
  const row = db.prepare("SELECT * FROM concepts WHERE id = ?").get(id);
  return row ? mapConcept(row) : null;
}

export function createConcept(data) {
  const db = getDatabase();
  const category = db.prepare("SELECT id FROM categories WHERE name = ? AND is_active = 1").get(data.category);
  if (!category) throw new Error("Seleccioná una categoría activa.");
  const result = db.prepare(`
    INSERT INTO concepts (name, category, default_amount_cents, due_day, closing_day, is_active)
    VALUES (@name, @category, @defaultAmountCents, @dueDay, @closingDay, @isActive)
  `).run(data);
  return getConcept(result.lastInsertRowid);
}

export function updateConcept(id, data) {
  const db = getDatabase();
  const category = db.prepare("SELECT id FROM categories WHERE name = ?").get(data.category);
  if (!category) throw new Error("Seleccioná una categoría válida.");
  const result = db.prepare(`
    UPDATE concepts SET name = @name, category = @category,
      default_amount_cents = @defaultAmountCents, due_day = @dueDay,
      closing_day = @closingDay,
      is_active = @isActive, updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `).run({ id, ...data });
  return result.changes ? getConcept(id) : null;
}

export function deleteConcept(id) {
  const db = getDatabase();
  const used = db.prepare("SELECT COUNT(*) AS count FROM expenses WHERE concept_id = ?").get(id).count;
  if (used) {
    const result = db.prepare("UPDATE concepts SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
    return { deleted: false, archived: Boolean(result.changes) };
  }
  const result = db.prepare("DELETE FROM concepts WHERE id = ?").run(id);
  return { deleted: Boolean(result.changes), archived: false };
}
