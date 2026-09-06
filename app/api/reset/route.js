import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

export const runtime = "nodejs";

export function POST() {
  const db = getDatabase();
  const reset = db.transaction(() => {
    db.prepare("DELETE FROM expenses").run();
    db.prepare("DELETE FROM concepts").run();
    db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('expenses', 'concepts')").run();
  });
  reset();
  return NextResponse.json({ data: { reset: true } });
}
