import { NextResponse } from "next/server";
import { createConcept, listConcepts } from "@/lib/repositories/concepts";
import { parseConcept } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ data: listConcepts() });
}

export async function POST(request) {
  try {
    const concept = createConcept(parseConcept(await request.json()));
    return NextResponse.json({ data: concept }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
