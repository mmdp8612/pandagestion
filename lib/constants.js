export const CATEGORIES = [
  { value: "Vivienda", color: "#7c3aed" },
  { value: "Servicios", color: "#0ea5e9" },
  { value: "Tarjetas", color: "#f97316" },
  { value: "Transporte", color: "#14b8a6" },
  { value: "Alimentación", color: "#ef4444" },
  { value: "Salud", color: "#ec4899" },
  { value: "Educación", color: "#8b5cf6" },
  { value: "Suscripciones", color: "#06b6d4" },
  { value: "Impuestos", color: "#eab308" },
  { value: "Otros", color: "#64748b" },
];

export const CATEGORY_COLORS = Object.fromEntries(
  CATEGORIES.map((category) => [category.value, category.color]),
);
