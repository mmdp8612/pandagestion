import { getDatabase } from "@/lib/db";

function mapCategory(row) {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    isActive: Boolean(row.is_active),
  };
}

export function listCategories() {
  const db = getDatabase();
  return db.prepare("SELECT * FROM categories ORDER BY is_active DESC, name COLLATE NOCASE").all().map(mapCategory);
}

export function getCategory(id) {
  const db = getDatabase();
  const row = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
  return row ? mapCategory(row) : null;
}

function ensureUniqueName(db, name, excludedId = 0) {
  const duplicate = db.prepare("SELECT id FROM categories WHERE name = ? AND id != ?").get(name, excludedId);
  if (duplicate) throw new Error("Ya existe una categoría con ese nombre.");
}

export function createCategory(data) {
  const db = getDatabase();
  ensureUniqueName(db, data.name);
  const result = db.prepare(`
    INSERT INTO categories (name, color, is_active) VALUES (@name, @color, @isActive)
  `).run(data);
  return getCategory(result.lastInsertRowid);
}

export function updateCategory(id, data) {
  const db = getDatabase();
  const current = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
  if (!current) return null;
  ensureUniqueName(db, data.name, id);

  const update = db.transaction(() => {
    db.prepare(`
      UPDATE categories SET name = @name, color = @color, is_active = @isActive,
        updated_at = CURRENT_TIMESTAMP WHERE id = @id
    `).run({ id, ...data });
    if (current.name !== data.name) {
      db.prepare("UPDATE concepts SET category = ?, updated_at = CURRENT_TIMESTAMP WHERE category = ?").run(data.name, current.name);
    }
  });
  update();
  return getCategory(id);
}

export function deleteCategory(id) {
  const db = getDatabase();
  const category = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
  if (!category) return { deleted: false, archived: false };
  const used = db.prepare("SELECT COUNT(*) AS count FROM concepts WHERE category = ?").get(category.name).count;
  if (used) {
    db.prepare("UPDATE categories SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
    return { deleted: false, archived: true };
  }
  db.prepare("DELETE FROM categories WHERE id = ?").run(id);
  return { deleted: true, archived: false };
}
