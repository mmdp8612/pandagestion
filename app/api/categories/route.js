import { NextResponse } from "next/server";
import { createCategory, listCategories } from "@/lib/repositories/categories";
import { parseCategory } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ data: listCategories() });
}

export async function POST(request) {
  try {
    return NextResponse.json({ data: createCategory(parseCategory(await request.json())) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
