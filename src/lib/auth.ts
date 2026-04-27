// Auth utilities — works in both Edge (middleware) and Node (API routes)
// Uses Web Crypto API which is available in both runtimes

export type Role = "admin" | "agent";

export interface SessionUser {
  username: string;
  role: Role;
  displayName: string;
}

// User definitions — passwords come from env vars
// Defaults are only for local dev, must set real passwords in Vercel
const USERS: Record<string, { password: string; role: Role; displayName: string }> = {
  edgar: {
    password: process.env.EDGAR_PASSWORD || "edgar2026",
    role: "admin",
    displayName: "Edgar Pringle",
  },
  ana: {
    password: process.env.ANA_PASSWORD || "ana2026",
    role: "admin",
    displayName: "Ana Lorena Chanis",
  },
  valentina: {
    password: process.env.VALENTINA_PASSWORD || "valentina2026",
    role: "agent",
    displayName: "Valentina",
  },
};

const SECRET = process.env.AUTH_SECRET || "crm-dev-secret-change-in-production";

export function lookupUser(username: string, password: string): SessionUser | null {
  const u = USERS[username.toLowerCase()];
  if (!u || u.password !== password) return null;
  return { username: username.toLowerCase(), role: u.role, displayName: u.displayName };
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

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: "/",
};
