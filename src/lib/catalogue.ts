import { Candidate, Track, sameRecording, spotifySearch } from "./music";

type AppleTrack = {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackViewUrl: string;
};
export type SpotifyTrack = {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: { images: { url: string }[] };
  external_urls: { spotify: string };
};
export async function spotifyGet(path: string, token: string) {
  const r = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) throw new Error(`Spotify ${r.status}`);
  if (r.status === 204) return null;
  return r.json();
}
export function fromSpotify(t: SpotifyTrack, reason: string): Track {
  return {
    id: t.id,
    title: t.name,
    artist: t.artists.map((a) => a.name).join(", "),
    reason,
    artwork: t.album.images[0]?.url ?? null,
    preview: null,
    url: t.external_urls.spotify,
    spotifyUrl: t.external_urls.spotify,
    source: "spotify",
  };
}
export async function resolve(
  candidate: Candidate,
  token?: string | null,
): Promise<Track | null> {
  if (token) {
    const q = new URLSearchParams({
      q: `track:${candidate.title} artist:${candidate.artist}`,
      type: "track",
      limit: "5",
    });
    const d = await spotifyGet(`/search?${q}`, token);
    const match = ((d.tracks?.items as SpotifyTrack[]) ?? []).find((t) =>
      sameRecording(candidate, t.name, t.artists[0]?.name ?? ""),
    );
    if (!match) return null;
    return {
      ...fromSpotify(match, candidate.reason),
      reason: candidate.reason,
    };
  }
  const q = new URLSearchParams({
    term: `${candidate.artist} ${candidate.title}`,
    entity: "song",
    country: "GB",
    limit: "5",
  });
  const r = await fetch(`https://itunes.apple.com/search?${q}`, {
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) return null;
  const d = await r.json();
  const match = (d.results as AppleTrack[]).find((t) =>
    sameRecording(candidate, t.trackName, t.artistName),
  );
  if (!match) return null;
  return {
    ...candidate,
    id: `apple-${match.trackId}`,
    title: match.trackName,
    artist: match.artistName,
    artwork: match.artworkUrl100?.replace("100x100bb", "600x600bb") ?? null,
    preview: match.previewUrl ?? null,
    url: match.trackViewUrl,
    spotifyUrl: spotifySearch(match.trackName, match.artistName),
    source: "apple",
  };
}
