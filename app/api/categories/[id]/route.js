import { NextResponse } from "next/server";
import { deleteCategory, updateCategory } from "@/lib/repositories/categories";
import { parseCategory } from "@/lib/validation";

export const runtime = "nodejs";

export async function PUT(request, context) {
  try {
    const { id } = await context.params;
    const category = updateCategory(Number(id), parseCategory(await request.json()));
    if (!category) return NextResponse.json({ error: "Categoría no encontrada." }, { status: 404 });
    return NextResponse.json({ data: category });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(_request, context) {
  const { id } = await context.params;
  const result = deleteCategory(Number(id));
  if (!result.deleted && !result.archived) return NextResponse.json({ error: "Categoría no encontrada." }, { status: 404 });
  return NextResponse.json({ data: result });
}
