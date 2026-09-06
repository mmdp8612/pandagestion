import { NextResponse } from "next/server";
import { deleteExpense, setExpenseStatus, updateExpense } from "@/lib/repositories/expenses";

export const runtime = "nodejs";

export async function PATCH(request, context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    let expense;
    if (body.status) {
      if (!["paid", "pending"].includes(body.status)) throw new Error("Estado inválido.");
      expense = setExpenseStatus(Number(id), body.status);
    } else {
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount < 0) throw new Error("Importe inválido.");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(body.dueDate))) throw new Error("Fecha inválida.");
      const closingDate = body.closingDate ? String(body.closingDate) : null;
      if (closingDate && !/^\d{4}-\d{2}-\d{2}$/.test(closingDate)) throw new Error("Fecha de cierre inválida.");
      expense = updateExpense(Number(id), {
        amountCents: Math.round(amount * 100),
        dueDate: String(body.dueDate),
        closingDate,
        notes: String(body.notes || "").trim().slice(0, 300),
      });
    }
    if (!expense) return NextResponse.json({ error: "Gasto no encontrado." }, { status: 404 });
    return NextResponse.json({ data: expense });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(_request, context) {
  const { id } = await context.params;
  const deleted = deleteExpense(Number(id));
  return deleted
    ? NextResponse.json({ data: { deleted: true } })
    : NextResponse.json({ error: "Gasto no encontrado." }, { status: 404 });
}
