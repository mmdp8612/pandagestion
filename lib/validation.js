import { CATEGORIES } from "@/lib/constants";

const validCategories = new Set(CATEGORIES.map((item) => item.value));

export function parseConcept(input) {
  const name = String(input.name || "").trim();
  const category = String(input.category || "Otros");
  const amount = Number(input.defaultAmount);
  const dueDay = Number(input.dueDay);

  if (!name || name.length > 80) throw new Error("Ingresá un nombre válido (máximo 80 caracteres).");
  if (!validCategories.has(category)) throw new Error("La categoría no es válida.");
  if (!Number.isFinite(amount) || amount < 0) throw new Error("El importe debe ser un número mayor o igual a cero.");
  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) throw new Error("El día de vencimiento debe estar entre 1 y 31.");

  return {
    name,
    category,
    defaultAmountCents: Math.round(amount * 100),
    dueDay,
    isActive: input.isActive === false ? 0 : 1,
  };
}

export function parseExpense(input) {
  const conceptId = Number(input.conceptId);
  const month = String(input.month || "");
  const amount = Number(input.amount);
  const dueDate = String(input.dueDate || "");
  const notes = String(input.notes || "").trim();

  if (!Number.isInteger(conceptId) || conceptId < 1) throw new Error("Seleccioná un concepto válido.");
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error("El mes no es válido.");
  if (!Number.isFinite(amount) || amount < 0) throw new Error("El importe debe ser un número mayor o igual a cero.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) throw new Error("La fecha de vencimiento no es válida.");
  if (notes.length > 300) throw new Error("Las notas no pueden superar los 300 caracteres.");

  return { conceptId, month, amountCents: Math.round(amount * 100), dueDate, notes };
}

export function isValidMonth(month) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(month || ""));
}
