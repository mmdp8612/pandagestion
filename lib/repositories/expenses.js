import { getDatabase } from "@/lib/db";

function mapExpense(row) {
  return {
    id: row.id,
    conceptId: row.concept_id,
    name: row.concept_name,
    category: row.category,
    amount: row.amount_cents / 100,
    month: row.month,
    dueDate: row.due_date,
    closingDate: row.closing_date,
    status: row.status,
    paidAt: row.paid_at,
    notes: row.notes,
  };
}

export function listExpenses(month) {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM expenses WHERE month = ?
    ORDER BY status ASC, due_date ASC, concept_name COLLATE NOCASE
  `).all(month).map(mapExpense);
}

export function getExpense(id) {
  const db = getDatabase();
  const row = db.prepare("SELECT * FROM expenses WHERE id = ?").get(id);
  return row ? mapExpense(row) : null;
}

export function createExpense(data) {
  const db = getDatabase();
  const concept = db.prepare("SELECT * FROM concepts WHERE id = ?").get(data.conceptId);
  if (!concept) throw new Error("El concepto seleccionado ya no existe.");
  const result = db.prepare(`
    INSERT INTO expenses (concept_id, concept_name, category, amount_cents, month, due_date, closing_date, notes)
    VALUES (@conceptId, @name, @category, @amountCents, @month, @dueDate, @closingDate, @notes)
  `).run({ ...data, name: concept.name, category: concept.category });
  return getExpense(result.lastInsertRowid);
}

export function updateExpense(id, data) {
  const db = getDatabase();
  const result = db.prepare(`
    UPDATE expenses SET amount_cents = @amountCents, due_date = @dueDate,
      closing_date = @closingDate,
      notes = @notes, updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `).run({ id, ...data });
  return result.changes ? getExpense(id) : null;
}

export function setExpenseStatus(id, status) {
  const db = getDatabase();
  const paidAt = status === "paid" ? new Date().toISOString() : null;
  const result = db.prepare(`
    UPDATE expenses SET status = ?, paid_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(status, paidAt, id);
  return result.changes ? getExpense(id) : null;
}

export function deleteExpense(id) {
  const db = getDatabase();
  return Boolean(db.prepare("DELETE FROM expenses WHERE id = ?").run(id).changes);
}

export function getStats(month) {
  const db = getDatabase();
  const summary = db.prepare(`
    SELECT COUNT(*) AS count,
      COALESCE(SUM(amount_cents), 0) AS total,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_cents ELSE 0 END), 0) AS paid,
      COALESCE(SUM(CASE WHEN status = 'pending' THEN amount_cents ELSE 0 END), 0) AS pending
    FROM expenses WHERE month = ?
  `).get(month);

  const categories = db.prepare(`
    SELECT category, SUM(amount_cents) AS total
    FROM expenses WHERE month = ? GROUP BY category ORDER BY total DESC
  `).all(month).map((row) => ({ name: row.category, value: row.total / 100 }));

  const timeline = db.prepare(`
    WITH RECURSIVE months(month, step) AS (
      SELECT date(? || '-01', '-5 months'), 0
      UNION ALL
      SELECT date(month, '+1 month'), step + 1 FROM months WHERE step < 5
    )
    SELECT substr(months.month, 1, 7) AS month,
      COALESCE(SUM(expenses.amount_cents), 0) AS total,
      COALESCE(SUM(CASE WHEN expenses.status = 'paid' THEN expenses.amount_cents ELSE 0 END), 0) AS paid
    FROM months LEFT JOIN expenses ON expenses.month = substr(months.month, 1, 7)
    GROUP BY months.month ORDER BY months.month
  `).all(month).map((row) => ({ month: row.month, total: row.total / 100, paid: row.paid / 100 }));

  const recent = db.prepare(`
    SELECT * FROM expenses WHERE month = ? ORDER BY updated_at DESC, id DESC LIMIT 5
  `).all(month).map(mapExpense);

  return {
    summary: {
      count: summary.count,
      total: summary.total / 100,
      paid: summary.paid / 100,
      pending: summary.pending / 100,
      progress: summary.total ? Math.round((summary.paid / summary.total) * 100) : 0,
    },
    categories,
    timeline,
    recent,
  };
}

export function getHistory(limit = 18) {
  const db = getDatabase();
  return db.prepare(`
    SELECT month, COUNT(*) AS count,
      SUM(amount_cents) AS total,
      SUM(CASE WHEN status = 'paid' THEN amount_cents ELSE 0 END) AS paid,
      SUM(CASE WHEN status = 'pending' THEN amount_cents ELSE 0 END) AS pending
    FROM expenses GROUP BY month ORDER BY month DESC LIMIT ?
  `).all(limit).map((row) => ({
    month: row.month,
    count: row.count,
    total: row.total / 100,
    paid: row.paid / 100,
    pending: row.pending / 100,
    progress: row.total ? Math.round((row.paid / row.total) * 100) : 0,
  }));
}
