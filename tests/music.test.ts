import assert from "node:assert/strict";
import test from "node:test";
import {
  diverse,
  normalize,
  requestSchema,
  sameRecording,
  spotifySearch,
} from "../src/lib/music";
import { seal, unseal } from "../src/lib/session";
import { guard, PublicError } from "../src/lib/guard";
import { NextRequest } from "next/server";

test("catalogue verification rejects a different song or cover artist", () => {
  const song = { title: "Wildfires", artist: "SAULT", reason: "" };
  assert.equal(sameRecording(song, "Wildfires", "Sault"), true);
  assert.equal(sameRecording(song, "Wildfire", "Sault"), false);
  assert.equal(sameRecording(song, "Wildfires", "Another Artist"), false);
  assert.equal(
    sameRecording(
      { ...song, title: "Love Is Stronger Than Pride", artist: "Sade" },
      "Love Is Stronger Than Pride (Remastered)",
      "Sade",
    ),
    true,
  );
});
test("selection removes repeats and exclusions, and limits artist repetition", () => {
  const tracks = [
    { artist: "Sade", title: "A", reason: "" },
    { artist: "Sade", title: "B", reason: "" },
    { artist: "Sade", title: "C", reason: "" },
    { artist: "SAULT", title: "Wildfires", reason: "" },
    { artist: "Sault", title: "Wildfires", reason: "" },
    { artist: "Cleo Sol", title: "Rose", reason: "" },
  ];
  assert.deepEqual(
    diverse(tracks, ["SAULT Wildfires"]).map((t) => t.title),
    ["A", "B", "Rose"],
  );
});
test("input is bounded and direction is validated", () => {
  assert.equal(requestSchema.safeParse({ prompt: "x" }).success, false);
  assert.equal(
    requestSchema.safeParse({ prompt: "x".repeat(1001) }).success,
    false,
  );
  assert.equal(
    requestSchema.safeParse({
      prompt: "warm soulful music",
      direction: "override",
    }).success,
    false,
  );
  assert.equal(
    requestSchema.parse({ prompt: "warm soulful music" }).direction,
    "balanced",
  );
  assert.equal(
    requestSchema.safeParse({
      prompt: "warm soulful music",
      exclude: Array(41).fill("x"),
    }).success,
    false,
  );
});
test("Spotify search stays on Spotify with encoded user content", () => {
  const u = new URL(spotifySearch("A/B?x=<script>", "Artist & Co"));
  assert.equal(u.origin, "https://open.spotify.com");
  assert.equal(u.search, "");
  assert.equal(normalize("Beyoncé"), "beyonce");
});
test("OAuth payloads are encrypted and reject tampering or wrong keys", () => {
  process.env.SESSION_SECRET = "a".repeat(64);
  const encrypted = seal({ access: "private-test-token", expires: 123 });
  assert.equal(encrypted.includes("private-test-token"), false);
  assert.deepEqual(unseal(encrypted), {
    access: "private-test-token",
    expires: 123,
  });
  const bytes = Buffer.from(encrypted, "base64url");
  bytes[30] ^= 1;
  assert.equal(unseal(bytes.toString("base64url")), null);
  process.env.SESSION_SECRET = "b".repeat(64);
  assert.equal(unseal(encrypted), null);
});
test("POST guard permits local host origins and rejects other sites", () => {
  guard(
    new NextRequest("http://localhost:3123/api/discover", {
      headers: { host: "127.0.0.1:3123", origin: "http://127.0.0.1:3123" },
    }),
    "test-local",
    1,
  );
  assert.throws(
    () =>
      guard(
        new NextRequest("https://app.example/api/discover", {
          headers: { host: "app.example", origin: "https://evil.example" },
        }),
        "test-cross",
      ),
    PublicError,
  );
});
test("demo rate limiter stops repeated paid requests", () => {
  const req = new NextRequest("https://app.example/api/discover");
  guard(req, "test-limit", 1);
  assert.throws(
    () => guard(req, "test-limit", 1),
    (e: unknown) => e instanceof PublicError && e.status === 429,
  );
});
