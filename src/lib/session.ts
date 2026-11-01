import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { cookies } from "next/headers";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32)
    throw new Error("SESSION_SECRET must be configured");
  return createHash("sha256").update(value).digest();
}
export function seal(value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secret(), iv);
  const body = Buffer.concat([
    cipher.update(JSON.stringify(value)),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}
export function unseal<T>(value?: string): T | null {
  if (!value) return null;
  try {
    const b = Buffer.from(value, "base64url");
    const decipher = createDecipheriv(
      "aes-256-gcm",
      secret(),
      b.subarray(0, 12),
    );
    decipher.setAuthTag(b.subarray(12, 28));
    return JSON.parse(
      Buffer.concat([
        decipher.update(b.subarray(28)),
        decipher.final(),
      ]).toString(),
    ) as T;
  } catch {
    return null;
  }
}
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
export type Session = { access: string; refresh: string; expires: number };
export async function spotifyToken() {
  const jar = await cookies();
  const session = unseal<Session>(jar.get("undertone_session")?.value);
  if (!session) return null;
  if (session.expires > Date.now() + 30000) return session.access;
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: session.refresh,
      client_id: process.env.SPOTIFY_CLIENT_ID!,
    }),
    signal: AbortSignal.timeout(10000),
    cache: "no-store",
  });
  if (!res.ok) {
    jar.delete("undertone_session");
    return null;
  }
  const token = await res.json();
  jar.set(
    "undertone_session",
    seal({
      access: token.access_token,
      refresh: token.refresh_token ?? session.refresh,
      expires: Date.now() + token.expires_in * 1000,
    }),
    { ...cookieOptions, maxAge: 60 * 60 * 24 * 7 },
  );
  return token.access_token as string;
}
