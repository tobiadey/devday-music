import { z } from "zod";

export const requestSchema = z
  .object({
    prompt: z.string().trim().max(1000).default(""),
    image: z.string().max(1_800_000).optional(),
    direction: z
      .enum(["balanced", "deeper", "warmer", "energy"])
      .default("balanced"),
    exclude: z.array(z.string().max(180)).max(40).default([]),
    spotifyExclusions: z
      .array(z.string().regex(/^[A-Za-z0-9]{22}$/))
      .max(40)
      .default([]),
  })
  .refine((value) => value.prompt.length >= 8 || !!value.image, {
    message: "Describe your sound or add an image.",
  });
export const mixtapeSchema = z.object({
  title: z.string(),
  description: z.string(),
  tracks: z.array(
    z.object({
      title: z.string(),
      artist: z.string(),
      reason: z.string(),
      coverBrief: z.string().max(1000),
    }),
  ),
});
export type Candidate = {
  title: string;
  artist: string;
  reason: string;
  // Authored independently by the recommendation model before provider lookup.
  // Spotify-only catalogue discoveries never populate this field.
  coverBrief?: string;
};
export type Track = Candidate & {
  id: string;
  artwork: string | null;
  preview: string | null;
  url: string;
  spotifyUrl: string;
  source: "apple" | "spotify";
};
export type Mixtape = {
  title: string;
  description: string;
  tracks: Track[];
  unavailable: number;
};

export function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
export function sameRecording(
  candidate: Candidate,
  title: string,
  artist: string,
) {
  const clean = (s: string) =>
    normalize(
      s.replace(/\s*[([](?:remaster(?:ed)?[^)\]]*|[^)\]]*version)[)\]]/gi, ""),
    );
  const a = normalize(candidate.artist);
  const b = normalize(artist);
  return (
    clean(candidate.title) === clean(title) &&
    (a === b || b.split(" ").includes(a))
  );
}
export function diverse<T extends Candidate>(
  tracks: T[],
  exclude: string[] = [],
  limit = 6,
): T[] {
  const seen = new Set(exclude.map(normalize));
  const artists = new Map<string, number>();
  return tracks
    .filter((t) => {
      const key = normalize(`${t.artist} ${t.title}`);
      const artist = normalize(t.artist);
      if (seen.has(key) || (artists.get(artist) ?? 0) >= 2) return false;
      seen.add(key);
      artists.set(artist, (artists.get(artist) ?? 0) + 1);
      return true;
    })
    .slice(0, limit);
}
export function spotifySearch(title: string, artist: string) {
  return `https://open.spotify.com/search/${encodeURIComponent(`${artist} ${title}`)}`;
}
