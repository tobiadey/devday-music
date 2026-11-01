import { NextRequest } from "next/server";

export class PublicError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
const buckets = new Map<string, { count: number; until: number }>();
// Best-effort per-instance demo protection. Platform rate limits are required before scaling.
export function guard(req: NextRequest, lane = "discover", max = 12) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (
    origin &&
    origin !== req.nextUrl.origin &&
    (!host || new URL(origin).host !== host)
  )
    throw new PublicError("Please make this request from the app.", 403);
  const key = `${lane}:${req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local"}`;
  const now = Date.now();
  for (const [k, b] of buckets) if (b.until < now) buckets.delete(k);
  const bucket = buckets.get(key) ?? { count: 0, until: now + 3600000 };
  if (bucket.count >= max)
    throw new PublicError(
      "You've reached the demo limit. Please try again in an hour.",
      429,
    );
  bucket.count++;
  buckets.set(key, bucket);
}
export function failure(error: unknown) {
  const status = error instanceof PublicError ? error.status : 502;
  return Response.json(
    {
      error:
        error instanceof PublicError
          ? error.message
          : "That didn't come through. Please try again in a moment.",
    },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
