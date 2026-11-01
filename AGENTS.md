# Hackathon working agreement

Ship one complete music-discovery journey by 17:00 London time on 1 November 2026. Target submission by 16:45; freeze features by 15:30.

- Keep the core new for this hackathon. Credit any reused code, libraries or assets.
- Verify Spotify and OpenAI APIs against current official documentation. Respect Spotify's data and playback policies.
- Never commit keys, OAuth tokens, personal listening histories or private audio. Keep secrets server-side.
- Prefer real catalogue tracks and honest uncertainty over fabricated recommendations or playback claims.
- Record meaningful Codex contributions and actual checks in BUILD_LOG.md.
- Keep README setup/test instructions accurate as the app is implemented.
- Preserve user edits and avoid changing unrelated repositories.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
