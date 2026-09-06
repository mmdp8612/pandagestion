import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { CATEGORIES } from "@/lib/constants";

export const runtime = "nodejs";

export function POST() {
  const db = getDatabase();
  const reset = db.transaction(() => {
    db.prepare("DELETE FROM expenses").run();
    db.prepare("DELETE FROM concepts").run();
    db.prepare("DELETE FROM categories").run();
    db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('expenses', 'concepts', 'categories')").run();
    const insertCategory = db.prepare("INSERT INTO categories (name, color) VALUES (?, ?)");
    for (const category of CATEGORIES) insertCategory.run(category.value, category.color);
  });
  reset();
  return NextResponse.json({ data: { reset: true } });
}
