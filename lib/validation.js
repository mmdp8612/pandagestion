export function parseConcept(input) {
  const name = String(input.name || "").trim();
  const category = String(input.category || "Otros");

  if (!name || name.length > 80) throw new Error("Ingresá un nombre válido (máximo 80 caracteres).");
  if (!category || category.length > 50) throw new Error("La categoría no es válida.");

  return {
    name,
    category,
    isActive: input.isActive === false ? 0 : 1,
  };
}

export function parseExpense(input) {
  const conceptId = Number(input.conceptId);
  const month = String(input.month || "");
  const amount = Number(input.amount);
  const dueDate = String(input.dueDate || "");
  const closingDate = input.closingDate ? String(input.closingDate) : null;
  const notes = String(input.notes || "").trim();

  if (!Number.isInteger(conceptId) || conceptId < 1) throw new Error("Seleccioná un concepto válido.");
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error("El mes no es válido.");
  if (!Number.isFinite(amount) || amount < 0) throw new Error("El importe debe ser un número mayor o igual a cero.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) throw new Error("La fecha de vencimiento no es válida.");
  if (closingDate && !/^\d{4}-\d{2}-\d{2}$/.test(closingDate)) throw new Error("La fecha de cierre no es válida.");
  if (notes.length > 300) throw new Error("Las notas no pueden superar los 300 caracteres.");

  return { conceptId, month, amountCents: Math.round(amount * 100), dueDate, closingDate, notes };
}

export function parseCategory(input) {
  const name = String(input.name || "").trim();
  const color = String(input.color || "").trim().toLowerCase();

  if (!name || name.length > 50) throw new Error("Ingresá un nombre válido (máximo 50 caracteres).");
  if (!/^#[0-9a-f]{6}$/.test(color)) throw new Error("Seleccioná un color válido.");

  return { name, color, isActive: input.isActive === false ? 0 : 1 };
}

export function isValidMonth(month) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(month || ""));
}
