import { NextResponse } from "next/server";
import { createExpense, listExpenses } from "@/lib/repositories/expenses";
import { isValidMonth, parseExpense } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request) {
  const month = request.nextUrl.searchParams.get("month");
  if (!isValidMonth(month)) return NextResponse.json({ error: "Mes inválido." }, { status: 400 });
  return NextResponse.json({ data: listExpenses(month) });
}

export async function POST(request) {
  try {
    const expense = createExpense(parseExpense(await request.json()));
    return NextResponse.json({ data: expense }, { status: 201 });
  } catch (error) {
    const duplicate = String(error.message).includes("UNIQUE constraint");
    return NextResponse.json(
      { error: duplicate ? "Ese concepto ya fue cargado en el mes seleccionado." : error.message },
      { status: 400 },
    );
  }
}
