import assert from "node:assert/strict";
import test from "node:test";
import {
  findSpotifyNeighbours,
  genreMatch,
} from "../src/lib/spotify-discovery";
import type { SpotifyTrack } from "../src/lib/catalogue";

test("modern Afrobeats does not accept a broad Afrobeat-only or unrelated artist", () => {
  assert.equal(
    genreMatch(["alté", "afrobeats", "afrobeat"], ["afrobeat"]).score,
    0,
  );
  assert.equal(
    genreMatch(["alté", "afrobeats"], ["persian traditional"]).score,
    0,
  );
  assert.ok(
    genreMatch(["alté", "afrobeats"], ["afrobeats", "nigerian hip hop"]).score >
      0,
  );
  assert.deepEqual(genreMatch(["alté", "afrobeats"], ["alte"]).shared, [
    "alté",
  ]);
});

test("seed discovery verifies artists, rejects misleading search hits and removes prior picks", async () => {
  const track = (id: string, artistId: string): SpotifyTrack => ({
    id,
    name: `Song ${id}`,
    artists: [{ id: artistId, name: `Artist ${artistId}` }],
    album: { images: [] },
    external_urls: { spotify: `https://open.spotify.com/track/${id}` },
  });
  const seed = {
    id: "seed",
    name: "Seed artist",
    genres: ["alté", "afrobeats", "afrobeat"],
  };
  const calls: string[] = [];
  const get = async (path: string) => {
    calls.push(path);
    if (path.startsWith("/search")) {
      const genre = new URL(`https://api.spotify.com${path}`).searchParams.get(
        "q",
      );
      return {
        tracks: {
          items: genre?.includes("afrobeats")
            ? [
                track("known", "modern"),
                track("new", "modern"),
                track("previous", "modern"),
                track("own", "seed"),
              ]
            : [track("misleading", "unrelated"), track("broad", "broad-only")],
        },
      };
    }
    const id = path.split("/").at(-1)!;
    return {
      id,
      name: id,
      genres:
        id === "modern"
          ? ["afrobeats", "nigerian hip hop"]
          : id === "broad-only"
            ? ["afrobeat"]
            : ["persian traditional"],
    };
  };
  const found = await findSpotifyNeighbours(
    seed,
    [track("known", "modern")],
    get,
    ["previous"],
  );
  assert.deepEqual(
    found.map((t) => t.id),
    ["new"],
  );
  assert.ok(found[0].reason.includes("afrobeats"));
  assert.ok(calls.includes("/artists/unrelated"));
  assert.equal(calls.filter((p) => p.startsWith("/search")).length, 2);
  assert.ok(
    calls
      .filter((p) => p.startsWith("/search"))
      .every(
        (p) =>
          new URL(`https://api.spotify.com${p}`).searchParams.get("offset") ===
          "0",
      ),
  );
});

test("unverified candidate metadata gives no recommendations instead of arbitrary filler", async () => {
  const result = await findSpotifyNeighbours(
    { id: "seed", name: "Seed", genres: ["jazz"] },
    [],
    async (path) => {
      if (path.startsWith("/search"))
        return {
          tracks: {
            items: [
              {
                id: "candidate",
                name: "Song",
                artists: [{ id: "candidate-artist", name: "Artist" }],
                album: { images: [] },
                external_urls: { spotify: "https://open.spotify.com" },
              },
            ],
          },
        };
      throw new Error("Provider unavailable");
    },
  );
  assert.deepEqual(result, []);
});
