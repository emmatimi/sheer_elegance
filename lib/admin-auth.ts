import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { queryRows } from "@/db";

const sessionCookie = "sheer_admin_session";
const sessionMaxAgeSeconds = 60 * 60 * 8;

type AdminRow = RowDataPacket & {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: "owner" | "manager" | "editor";
};

export type AdminSession = {
  id: number;
  name: string;
  email: string;
  role: AdminRow["role"];
};

export async function authenticateAdmin(email: string, password: string) {
  const rows = await queryRows<AdminRow>(
    `SELECT id, name, email, password_hash, role
     FROM admins
     WHERE email = ?
     LIMIT 1`,
    [email],
  );
  const admin = rows[0];
  if (!admin || !verifyPassword(password, admin.password_hash)) return null;

  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  } satisfies AdminSession;
}

export function createAdminSessionResponse(admin: AdminSession) {
  const value = signSession({
    admin,
    expiresAt: Date.now() + sessionMaxAgeSeconds * 1000,
    nonce: randomBytes(12).toString("hex"),
  });

  return Response.json({ admin }, {
    headers: {
      "Set-Cookie": serializeCookie(sessionCookie, value, sessionMaxAgeSeconds),
    },
  });
}

export function clearAdminSessionResponse() {
  return Response.json({ ok: true }, {
    headers: {
      "Set-Cookie": serializeCookie(sessionCookie, "", 0),
    },
  });
}

export function requireAdminSession(request: Request) {
  const admin = getAdminSession(request);
  if (!admin) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }
  return admin;
}

export function getAdminSession(request: Request) {
  const rawCookie = parseCookie(request.headers.get("cookie") ?? "")[sessionCookie];
  if (!rawCookie) return null;

  const payload = verifySession(rawCookie);
  if (!payload || payload.expiresAt < Date.now()) return null;
  return payload.admin;
}

function parseCookie(cookieHeader: string) {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        if (index === -1) return [part, ""];
        return [
          decodeURIComponent(part.slice(0, index)),
          decodeURIComponent(part.slice(index + 1)),
        ];
      }),
  );
}

function serializeCookie(name: string, value: string, maxAge: number) {
  const parts = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string) {
  if (!storedHash.startsWith("scrypt:")) return false;

  const [, salt, expectedHash] = storedHash.split(":");
  if (!salt || !expectedHash) return false;

  const actual = Buffer.from(scryptSync(password, salt, 64).toString("hex"), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function signSession(payload: {
  admin: AdminSession;
  expiresAt: number;
  nonce: string;
}) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", getSessionSecret())
    .update(body)
    .digest("base64url");
  return `${body}.${signature}`;
}

function verifySession(value: string) {
  const [body, signature] = value.split(".");
  if (!body || !signature) return null;

  const expected = createHmac("sha256", getSessionSecret())
    .update(body)
    .digest("base64url");
  const actual = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actual.length !== expectedBuffer.length || !timingSafeEqual(actual, expectedBuffer)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      admin: AdminSession;
      expiresAt: number;
      nonce: string;
    };
  } catch {
    return null;
  }
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing required environment variable: ADMIN_SESSION_SECRET");
  }
  return secret;
}
