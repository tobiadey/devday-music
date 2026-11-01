# devday-music

A fresh music-discovery experiment for the DevDay Exchange Community Hackathon, London, 1 November 2026.

**Goal:** recommendations people actually want to hear, using Spotify taste, a typed or spoken request, or a seed song as inputs to one discovery journey.

## Core journey

Connect Spotify → choose a seed or describe what you want → get real song suggestions → listen and give feedback → refine the next suggestions.

Current status: initial project setup and API feasibility checks. No working demo is published yet.

## Build constraints

- Build the core during today's hackathon; submission closes at 17:00 London time.
- Prioritise recommendation quality and one complete journey.
- Verify current Spotify access, playback and AI-use policies before integrating.
- Use Codex meaningfully and record a concrete contribution in `BUILD_LOG.md`.
- Keep API keys, OAuth tokens, personal listening history and private recordings out of the repository and demo.

## Setup

Application setup and verified run/test commands will be added as implementation lands. No credentials are needed for this documentation-only starting point.

## Credits

Auricle, an existing AdeyStudios project, inspired the music-discovery direction. No Auricle source code or assets have been copied into this repository. Any later reuse will be credited explicitly.

Built with Codex. Third-party libraries, APIs and assets will be recorded as they are introduced.

## Submission checklist

- [ ] One complete, tested core journey
- [ ] Public demo and try-it instructions
- [ ] README with verified setup commands and credits
- [ ] Demo video, 90 seconds maximum
- [ ] Concrete example of Codex's contribution
- [ ] Public links checked in a signed-out browser

## Verified integration constraints

Spotify development mode requires a Premium app owner and permits up to five allowlisted users. Spotify content must not be ingested into AI models, and Spotify voice control is restricted. Full streaming requires Premium. We will keep independently supplied user preferences separate from Spotify content and verify playback/API capabilities before promising them.

Sources: [quota modes](https://developer.spotify.com/documentation/web-api/concepts/quota-modes), [Developer Policy](https://developer.spotify.com/policy).
