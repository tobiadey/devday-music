# Undertone

**A song, a mood, a half-formed thought. Find your next favourite.**

**[Try the live app](https://devday-music.vercel.app)** · No account needed for guest discovery.

A fresh music-discovery web app built for DevDay Exchange London, 1 November 2026. `devday-music` is the repository name; Undertone is the working product name.

## The complete journey

1. Describe the sound you want, type a reference song, or record a spoken request.
2. Review/edit a voice transcription before sending it.
3. Get up to six catalogue-verified songs with a musical reason for each suggestion.
4. Hear a preview, open the song in a music service, save a find or hide a miss.
5. Refine your description and ask for a fresh selection.

Guest discovery works without an account, using Apple's catalogue for song verification, promotional previews and store links. Spotify connection adds catalogue lookup, listening seeds and Spotify's embedded player. A Spotify seed uses genre-based catalogue discovery; it is deliberately separate from the AI request path.

## Run locally

Requires Node.js 22+ and npm.

```sh
npm ci
cp .env.example .env.local
# Fill in OPENAI_API_KEY for guest discovery.
# For Spotify, also fill in SPOTIFY_CLIENT_ID, APP_URL and SESSION_SECRET.
npm run dev
```

Open **http://127.0.0.1:3000**. Generate a session secret with `openssl rand -hex 32`. Keep all values in the ignored `.env.local`; never commit them.

`OPENAI_MODEL` defaults to `gpt-6-luna`, checked against the model list during this build. Voice transcription uses `gpt-transcribe`. Access depends on your OpenAI project. API use is billed to the configured key.

### Spotify setup

Use Spotify's Authorization Code with PKCE. Register the exact callback `${APP_URL}/api/auth/callback` in the Spotify developer dashboard. Use `http://127.0.0.1:3000` locally, not `localhost`. Production needs its own HTTPS callback. No Spotify client secret is required.

Development-mode Spotify apps require a Premium owner and currently allow up to five allowlisted users. Spotify playback depends on account, region and widget availability. A working guest journey is available without Spotify sign-in.

## Checks

```sh
npm test
npm run typecheck
npm run build
```

Eight focused tests cover recording verification, exclusions/diversity, input limits, encoded links, encrypted cookie tampering, origin checks, Spotify-to-AI exclusion boundaries and demo rate limits. Local live checks also exercised OpenAI generation, real catalogue lookup, browser playback and synthetic voice transcription. See [BUILD_LOG.md](BUILD_LOG.md) for evidence and limitations.

## Data and limits

- Independently supplied text/voice preferences enter AI requests. Spotify content and listening history do not.
- OAuth tokens use encrypted, HttpOnly cookies with PKCE/state validation. Disconnect clears the session and locally saved Spotify finds.
- Saved finds stay in this browser. No database, uploaded-audio storage, background listening or song fingerprinting.
- Song existence is verified by title and artist. This does not prove every AI-written musical description is correct. Unconfirmed suggestions are omitted.
- Per-instance demo limits reduce API spend; they are not distributed abuse protection. Configure platform limits and a project budget before wider promotion.
- Apple's search API has a modest request quota; guest results can be fewer than six. Music is streamed from its provider, not downloaded or bundled.

## Stack and credits

Next.js, React, TypeScript, Vercel AI SDK with the OpenAI provider, OpenAI transcription, Spotify Web API/Embeds, Apple iTunes Search API, Lucide icons, Zod and Playwright.

Auricle, an existing private AdeyStudios project, inspired the direction. **No Auricle source code or assets were copied.** The application code and record-sleeve illustration were created during this hackathon. The illustration uses CSS; no generated artwork is required for the core journey.

Design used the [AdeyStudios web-design skill](https://github.com/AdeyStudios/skills). Typography: DM Sans and Instrument Serif from Google Fonts, under their open font licences. Album artwork, song previews and Spotify marks belong to their respective owners. The iTunes badge is Apple's official artwork from its [identity guidelines](https://marketing.services.apple/itunes-identity-guidelines). Song previews are provided courtesy of iTunes. iTunes and the iTunes Store are trademarks of Apple Inc., registered in the U.S. and other countries.

Codex checked current documentation, wrote the application, caught an origin-check failure during live testing, added regression coverage, and exercised the real discovery/preview flow. [Build log](BUILD_LOG.md).

## Submission status

- [x] Public repository and reproducible setup
- [x] Local end-to-end guest discovery and preview
- [x] Public deployment verified without authentication
- [ ] Spotify callback configured and live sign-in checked
- [ ] Demo video, maximum 90 seconds
- [ ] Submit project and team details by 17:00 London

Official references: [OpenAI docs](https://developers.openai.com/), [Codex](https://developers.openai.com/codex), [Spotify PKCE](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow), [Spotify 2026 migration](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide), [Spotify policy](https://developer.spotify.com/policy), [Apple catalogue API](https://performance-partners.apple.com/search-api).
