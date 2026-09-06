import { NextResponse } from "next/server";
import { getHistory } from "@/lib/repositories/expenses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ data: getHistory() });
}
