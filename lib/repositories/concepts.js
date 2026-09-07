import { getDatabase } from "@/lib/db";

function mapConcept(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
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
    INSERT INTO concepts (name, category, is_active)
    VALUES (@name, @category, @isActive)
  `).run(data);
  return getConcept(result.lastInsertRowid);
}

export function updateConcept(id, data) {
  const db = getDatabase();
  const category = db.prepare("SELECT id FROM categories WHERE name = ?").get(data.category);
  if (!category) throw new Error("Seleccioná una categoría válida.");

  const update = db.transaction(() => {
    const current = db.prepare("SELECT name FROM concepts WHERE id = ?").get(id);
    if (!current) return false;

    db.prepare(`
      UPDATE concepts SET name = @name, category = @category,
        is_active = @isActive, updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `).run({ id, ...data });

    if (current.name !== data.name) {
      db.prepare(`
        UPDATE expenses
        SET concept_name = ?, updated_at = CURRENT_TIMESTAMP
        WHERE concept_id = ?
      `).run(data.name, id);
    }

    return true;
  });

  return update() ? getConcept(id) : null;
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
