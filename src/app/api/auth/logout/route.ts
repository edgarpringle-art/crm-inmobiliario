import { NextResponse } from "next/server";
import { COOKIE_SESSION, COOKIE_USER } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(COOKIE_SESSION);
  response.cookies.delete(COOKIE_USER);
  return response;
}
