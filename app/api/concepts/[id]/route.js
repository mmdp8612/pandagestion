import { NextResponse } from "next/server";
import { deleteConcept, updateConcept } from "@/lib/repositories/concepts";
import { parseConcept } from "@/lib/validation";

export const runtime = "nodejs";

export async function PUT(request, context) {
  try {
    const { id } = await context.params;
    const concept = updateConcept(Number(id), parseConcept(await request.json()));
    if (!concept) return NextResponse.json({ error: "Concepto no encontrado." }, { status: 404 });
    return NextResponse.json({ data: concept });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(_request, context) {
  try {
    const { id } = await context.params;
    const result = deleteConcept(Number(id));
    if (!result.deleted && !result.archived) return NextResponse.json({ error: "Concepto no encontrado." }, { status: 404 });
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
