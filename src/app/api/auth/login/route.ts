import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { seal, cookieOptions } from "@/lib/session";

export async function GET(req: NextRequest) {
  if (
    !process.env.SPOTIFY_CLIENT_ID ||
    !process.env.APP_URL ||
    !process.env.SESSION_SECRET
  )
    return NextResponse.redirect(new URL("/?error=spotify_setup", req.url));
  const state = randomBytes(24).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const q = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: `${process.env.APP_URL}/api/auth/callback`,
    state,
    code_challenge_method: "S256",
    code_challenge: createHash("sha256").update(verifier).digest("base64url"),
    scope: "user-top-read user-read-currently-playing",
  });
  const response = NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${q}`,
  );
  response.cookies.set(
    "undertone_oauth",
    seal({ state, verifier, expires: Date.now() + 600000 }),
    { ...cookieOptions, maxAge: 600 },
  );
  return response;
}
