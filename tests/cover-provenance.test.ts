import assert from "node:assert/strict";
import test from "node:test";
import { fromSpotify, resolve, type SpotifyTrack } from "../src/lib/catalogue";

const recording: SpotifyTrack = {
  id: "a".repeat(22),
  name: "Independent Song",
  artists: [{ id: "b".repeat(22), name: "Example Artist" }],
  album: { images: [] },
  external_urls: { spotify: "https://open.spotify.com/track/example" },
};

test("Spotify-only catalogue conversion does not invent an AI cover brief", () => {
  assert.equal(
    fromSpotify(recording, "Genre connection").coverBrief,
    undefined,
  );
});

test("an independently authored song brief survives catalogue verification", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ tracks: { items: [recording] } }),
  );
  const candidate = {
    title: "Independent Song",
    artist: "Example Artist",
    reason: "An independently authored musical interpretation.",
    coverBrief:
      "A kinetic sculpture translating crisp percussion into moving brass rings.",
  };
  const verified = await resolve(candidate, "synthetic-test-token");
  assert.equal(verified?.source, "spotify");
  assert.equal(verified?.coverBrief, candidate.coverBrief);
});
