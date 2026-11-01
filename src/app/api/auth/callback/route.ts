import { NextRequest, NextResponse } from "next/server";
import { unseal, seal, cookieOptions } from "@/lib/session";

export async function GET(req: NextRequest) {
  const base = process.env.APP_URL ?? req.nextUrl.origin;
  const failed = () => {
    const r = NextResponse.redirect(new URL("/?error=spotify_signin", base));
    r.cookies.delete("undertone_oauth");
    return r;
  };
  const attempt = unseal<{ state: string; verifier: string; expires: number }>(
    req.cookies.get("undertone_oauth")?.value,
  );
  const code = req.nextUrl.searchParams.get("code");
  if (
    !attempt ||
    attempt.expires < Date.now() ||
    attempt.state !== req.nextUrl.searchParams.get("state") ||
    !code
  )
    return failed();
  try {
    const tokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.SPOTIFY_CLIENT_ID!,
          grant_type: "authorization_code",
          code,
          redirect_uri: `${base}/api/auth/callback`,
          code_verifier: attempt.verifier,
        }),
        signal: AbortSignal.timeout(12000),
        cache: "no-store",
      },
    );
    if (!tokenResponse.ok) return failed();
    const t = await tokenResponse.json();
    if (!t.access_token || !t.refresh_token) return failed();
    const response = NextResponse.redirect(new URL("/?connected=1", base));
    response.cookies.delete("undertone_oauth");
    response.cookies.set(
      "undertone_session",
      seal({
        access: t.access_token,
        refresh: t.refresh_token,
        expires: Date.now() + t.expires_in * 1000,
      }),
      { ...cookieOptions, maxAge: 604800 },
    );
    return response;
  } catch {
    return failed();
  }
}
