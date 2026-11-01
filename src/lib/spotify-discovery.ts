import type { SpotifyTrack } from "./catalogue";
import { fromSpotify } from "./catalogue";
import { diverse, normalize } from "./music";

export type SpotifyArtist = { id: string; name: string; genres: string[] };
type GetSpotify = (path: string) => Promise<any>;

// Afrobeats (modern pop/rap) and Afrobeat (the older broad tradition) are distinct.
// A broad genre or an accent-insensitive search hit is not evidence of a match.
const modernAfro = new Set([
  "afrobeats",
  "afropop",
  "nigerian hip hop",
  "nigerian hiphop",
  "nigerian pop",
  "alte",
  "afroswing",
  "afro r b",
]);

export function genreMatch(seed: string[], candidate: string[]) {
  const a = new Set(seed.map(normalize));
  const b = new Set(candidate.map(normalize));
  const shared = [...a].filter((g) => b.has(g));
  if (!shared.length) return { score: 0, shared: [] as string[] };
  if (a.has("afrobeats") && ![...b].some((g) => modernAfro.has(g)))
    return { score: 0, shared: [] as string[] };
  const score =
    shared.reduce((sum, g) => sum + (g === "afrobeat" ? 1 : 3), 0) +
    (a.has("afrobeats") && b.has("afrobeats") ? 4 : 0);
  return { score, shared: seed.filter((g) => b.has(normalize(g))) };
}

async function mapLimit<T, U>(
  items: T[],
  limit: number,
  run: (item: T) => Promise<U>,
) {
  const out: (U | null)[] = Array(items.length).fill(null);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        try {
          out[i] = await run(items[i]);
        } catch {
          /* unverifiable artists are omitted */
        }
      }
    }),
  );
  return out;
}

export async function findSpotifyNeighbours(
  artist: SpotifyArtist,
  top: SpotifyTrack[],
  get: GetSpotify,
  excluded: string[] = [],
) {
  const hasModernAfro = artist.genres.some((g) => normalize(g) === "afrobeats");
  const genres = artist.genres
    .filter((g) => !hasModernAfro || normalize(g) !== "afrobeat")
    .sort((a, b) => {
      const priority = (g: string) =>
        normalize(g) === "afrobeats" ? 0 : normalize(g) === "afrobeat" ? 2 : 1;
      return priority(a) - priority(b);
    })
    .slice(0, 3);
  const searches = await Promise.allSettled(
    genres.map((genre) =>
      get(
        `/search?${new URLSearchParams({ q: `genre:"${genre}"`, type: "track", limit: "10", offset: "0" })}`,
      ),
    ),
  );
  const lists: SpotifyTrack[][] = searches.map((r) =>
    r.status === "fulfilled" ? (r.value.tracks?.items ?? []) : [],
  );
  const known = new Set([...top.map((t) => t.id), ...excluded]);
  const seen = new Set<string>();
  const candidates: SpotifyTrack[] = [];
  // Interleave queries, so the first genre cannot fill every place.
  for (let row = 0; row < 10; row++)
    for (const list of lists) {
      const t = list[row];
      if (
        !t ||
        seen.has(t.id) ||
        known.has(t.id) ||
        t.artists.some((a) => a.id === artist.id)
      )
        continue;
      seen.add(t.id);
      candidates.push(t);
    }
  const ids = [
    ...new Set(candidates.map((t) => t.artists[0]?.id).filter(Boolean)),
  ].slice(0, 18);
  const verified = await mapLimit(
    ids,
    4,
    (id) => get(`/artists/${id}`) as Promise<SpotifyArtist>,
  );
  const profiles = new Map(
    verified
      .filter((a): a is SpotifyArtist => !!a && Array.isArray(a.genres))
      .map((a) => [a.id, a]),
  );
  const ranked = candidates
    .flatMap((track, index) => {
      const profile = profiles.get(track.artists[0]?.id);
      if (!profile) return [];
      const match = genreMatch(genres, profile.genres);
      if (!match.score) return [];
      return [{ track, index, ...match }];
    })
    .sort((a, b) => b.score - a.score || a.index - b.index);
  return diverse(
    ranked.map(({ track, shared }) =>
      fromSpotify(
        track,
        `Shares ${shared.slice(0, 2).join(" and ")} with ${artist.name}, from a different artist.`,
      ),
    ),
  );
}
