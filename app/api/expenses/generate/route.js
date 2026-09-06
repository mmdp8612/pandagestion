import { NextResponse } from "next/server";
import { generateMonth } from "@/lib/repositories/expenses";
import { isValidMonth } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request) {
  const { month } = await request.json();
  if (!isValidMonth(month)) return NextResponse.json({ error: "Mes inválido." }, { status: 400 });
  return NextResponse.json({ data: generateMonth(month) });
}
