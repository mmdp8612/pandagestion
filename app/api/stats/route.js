import { NextResponse } from "next/server";
import { getStats } from "@/lib/repositories/expenses";
import { isValidMonth } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request) {
  const month = request.nextUrl.searchParams.get("month");
  if (!isValidMonth(month)) return NextResponse.json({ error: "Mes inválido." }, { status: 400 });
  return NextResponse.json({ data: getStats(month) });
}
