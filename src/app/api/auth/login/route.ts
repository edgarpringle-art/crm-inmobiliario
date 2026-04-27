import { NextRequest, NextResponse } from "next/server";
import { lookupUser, createSession, COOKIE_SESSION, COOKIE_USER, COOKIE_OPTIONS } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  const user = lookupUser(username, password);

  if (!user) {
    return NextResponse.json(
      { error: "Usuario o contraseña incorrectos" },
      { status: 401 }
    );
  }

  const session = await createSession(user);

  const response = NextResponse.json({ ok: true, role: user.role, displayName: user.displayName });

  // httpOnly session cookie (secure)
  response.cookies.set(COOKIE_SESSION, session, COOKIE_OPTIONS);

  // Readable cookie for client-side UI (role + name)
  response.cookies.set(COOKIE_USER, `${user.username}:${user.role}:${user.displayName}`, {
    ...COOKIE_OPTIONS,
    httpOnly: false,
  });

  return response;
}
