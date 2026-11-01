import { NextRequest } from "next/server";
import { spotifyToken } from "@/lib/session";
import { spotifyGet, SpotifyTrack } from "@/lib/catalogue";
import { findSpotifyNeighbours } from "@/lib/spotify-discovery";
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
    const excluded = Array.isArray(body.excludeIds)
      ? body.excludeIds
          .filter(
            (id: unknown): id is string =>
              typeof id === "string" && /^[A-Za-z0-9]{22}$/.test(id),
          )
          .slice(0, 40)
      : [];
    // Verify candidate artists' own genre metadata. No Spotify content enters AI.
    const tracks = await findSpotifyNeighbours(
      artist,
      top.items as SpotifyTrack[],
      (path) => spotifyGet(path, token),
      excluded,
    );
    if (!tracks.length)
      throw new PublicError(
        "I couldn't verify strong matches for this artist. Try another seed or describe the sound you want.",
        502,
      );
    return Response.json(
      {
        title: `Beyond ${artist.name}`,
        description: `A selection from artists with verified genre connections to ${artist.name}.`,
        tracks,
        unavailable: 0,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
