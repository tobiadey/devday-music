import { NextRequest } from "next/server";
import { spotifyToken } from "@/lib/session";
import { spotifyGet, SpotifyTrack, fromSpotify } from "@/lib/catalogue";
import { diverse } from "@/lib/music";
import { guard, failure, PublicError } from "@/lib/guard";

export async function POST(req: NextRequest) {
  try {
    guard(req, "spotify-discover", 20);
    const token = await spotifyToken();
    if (!token)
      throw new PublicError(
        "Connect Spotify to start from your listening.",
        401,
      );
    const body = await req.json();
    if (
      typeof body.artistId !== "string" ||
      !/^[A-Za-z0-9]{22}$/.test(body.artistId)
    )
      throw new PublicError("Choose an artist from your Spotify listening.");
    const [artist, top] = await Promise.all([
      spotifyGet(`/artists/${body.artistId}`, token),
      spotifyGet("/me/top/tracks?limit=30&time_range=short_term", token),
    ]);
    const genres: string[] = artist.genres?.slice(0, 3) ?? [];
    if (!genres.length)
      throw new PublicError(
        "Spotify doesn't have a genre for this artist. Try another artist or describe your sound instead.",
      );
    // Catalogue-only discovery: Spotify content is never passed to an AI model.
    const results = await Promise.allSettled(
      genres.map((genre) =>
        spotifyGet(
          `/search?${new URLSearchParams({ q: `genre:"${genre}"`, type: "track", limit: "10", offset: String(Math.floor(Math.random() * 4) * 10) })}`,
          token,
        ),
      ),
    );
    const known = new Set((top.items as SpotifyTrack[]).map((t) => t.id));
    const candidates = results
      .flatMap((r) =>
        r.status === "fulfilled"
          ? ((r.value.tracks?.items as SpotifyTrack[]) ?? [])
          : [],
      )
      .filter(
        (t) =>
          !known.has(t.id) && !t.artists.some((a) => a.id === body.artistId),
      );
    const tracks = diverse(
      candidates.map((t) =>
        fromSpotify(
          t,
          `Found through ${genres[0]}, shared with ${artist.name}.`,
        ),
      ),
    );
    if (!tracks.length)
      throw new PublicError(
        "No fresh matches came back. Try another artist.",
        502,
      );
    return Response.json(
      {
        title: `Beyond ${artist.name}`,
        description: `Exploring ${genres.join(", ")}. A catalogue selection based on shared genres.`,
        tracks,
        unavailable: 0,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
