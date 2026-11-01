import { spotifyToken } from "@/lib/session";
import { spotifyGet, SpotifyTrack } from "@/lib/catalogue";

export async function GET() {
  try {
    const token = await spotifyToken();
    if (!token) return Response.json({ connected: false });
    const [top, current] = await Promise.all([
      spotifyGet("/me/top/tracks?limit=10&time_range=short_term", token),
      spotifyGet("/me/player/currently-playing", token).catch(() => null),
    ]);
    const simplify = (t: SpotifyTrack) => ({
      id: t.id,
      title: t.name,
      artist: t.artists[0]?.name,
      artistId: t.artists[0]?.id,
      artwork: t.album.images[0]?.url ?? null,
    });
    return Response.json(
      {
        connected: true,
        seeds: (top.items as SpotifyTrack[]).map(simplify),
        current:
          current?.item?.type === "track" ? simplify(current.item) : null,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      {
        connected: false,
        error:
          "Spotify couldn't load your music. Check developer access or reconnect.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
