import type { Track } from "./music";

// Keep provider-derived Spotify names out of model prompts, including refinements.
// Spotify IDs are used only after catalogue lookup, to remove repeated finds locally.
export function discoveryExclusions(tracks: Track[]) {
  return {
    exclude: tracks
      .filter((t) => t.source !== "spotify")
      .map((t) => `${t.artist} ${t.title}`)
      .slice(0, 40),
    spotifyExclusions: tracks
      .filter((t) => t.source === "spotify")
      .map((t) => t.id)
      .slice(0, 40),
  };
}
