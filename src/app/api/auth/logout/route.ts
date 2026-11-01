import { NextRequest, NextResponse } from "next/server";
import { guard, failure } from "@/lib/guard";
export async function POST(req: NextRequest) {
  try {
    guard(req, "logout", 60);
    const response = NextResponse.json({ ok: true });
    response.cookies.delete("undertone_session");
    response.cookies.delete("undertone_oauth");
    return response;
  } catch (e) {
    return failure(e);
  }
}
