// Auth utilities — works in both Edge (middleware) and Node (API routes)
// Session creation/verification uses Web Crypto API (works in both runtimes).
// User lookup hits the DB (Node.js runtime only — used in /api/auth/login).

import { query } from "@/lib/db";

export type Role = "broker" | "admin" | "agent";

export interface SessionUser {
  username: string;       // Agent.code
  role: Role;
  displayName: string;    // Agent.fullName
}

const SECRET = process.env.AUTH_SECRET || "crm-dev-secret-change-in-production";

/** Looks up an agent by code + password. Returns SessionUser if active. */
export async function lookupUser(username: string, password: string): Promise<SessionUser | null> {
  const code = username.toLowerCase().trim();
  try {
    const rows = await query<{
      code: string;
      password: string;
      role: string;
      fullName: string;
      active: number;
    }>(
      "SELECT code, password, role, fullName, active FROM Agent WHERE code = ?",
      [code]
    );
    if (!rows.length) return null;
    const a = rows[0];
    if (!a.active) return null;
    if (a.password !== password) return null;
    return {
      username: a.code,
      role: (a.role as Role) || "agent",
      displayName: a.fullName,
    };
  } catch {
    return null;
  }
}

async function hmac(message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSession(user: SessionUser): Promise<string> {
  const payload = `${user.username}:${user.role}:${user.displayName}`;
  const sig = await hmac(payload);
  return `${btoa(payload)}.${sig}`;
}

export async function verifySession(cookie: string): Promise<SessionUser | null> {
  try {
    const dotIdx = cookie.lastIndexOf(".");
    if (dotIdx === -1) return null;
    const encodedPayload = cookie.slice(0, dotIdx);
    const sig = cookie.slice(dotIdx + 1);
    const payload = atob(encodedPayload);
    const expectedSig = await hmac(payload);
    if (sig !== expectedSig) return null;
    const parts = payload.split(":");
    if (parts.length < 3) return null;
    const [username, role, ...nameParts] = parts;
    return {
      username,
      role: role as Role,
      displayName: nameParts.join(":"),
    };
  } catch {
    return null;
  }
}

export const COOKIE_SESSION = "crm_session";
export const COOKIE_USER = "crm_user"; // non-httpOnly, for client-side UI

/**
 * Server-only helper to read the current user from request cookies.
 * Use only in API route handlers (Node.js runtime).
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_SESSION)?.value;
  if (!session) return null;
  return await verifySession(session);
}

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: "/",
};
