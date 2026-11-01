# Undertone

**Find your next favourite song, starting with a feeling or a photo.**

[Open the app](https://devday-music.vercel.app/) · [Watch the demo](https://drive.google.com/file/d/1FPBEF3NEoOqLH4QpxAfrH36T9VlPr5tz/view?usp=sharing) · [Codex-made demo (47 seconds)](https://github.com/tobiadey/devday-music/releases/download/hackathon-demo/undertone-demo.mp4) · [Build log](BUILD_LOG.md)

![Undertone interface](docs/undertone.png)

Describe a sound, say it aloud, upload an image, or connect Spotify and start from your listening. Get a short selection of real songs, listen, keep a find and refine what misses. No account needed for guest discovery.

## One complete journey

1. **Set the tone.** Text, an editable voice transcription, a photo, or a Spotify listening seed.
2. **Explore up to six songs.** Each has a reason for the recommendation and a verified catalogue match.
3. **Listen and refine.** Play a preview or use Spotify’s player, save a find, hide a miss and edit your request.
4. **Make it yours.** Generate an original cover for an individual song; restore the original whenever you like.

## How it chooses music

Text and photos guide a model’s musical interpretation. Images supply clues such as atmosphere, expression, texture and energy; they do not reveal someone’s taste or have one objectively correct soundtrack. Add a few words to steer an ambiguous image. Songs are checked by title and artist before display; that verifies existence, not preference or every musical claim.

Spotify listening seeds follow a separate genre-search and artist-verification path. Spotify content and listening history are kept out of AI requests. AI recommendations carry independent song-specific artwork briefs; Spotify-only finds ask for your own description. Covers are creative interpretations, not audio analysis.

## Run it

Node.js 22+ and npm:

```sh
npm ci
cp .env.example .env.local
# Set OPENAI_API_KEY in .env.local.
npm run dev
```

Open **http://127.0.0.1:3000**. Spotify is optional. Its callback, required variables, access rules and model configuration are in [setup and technical notes](docs/SETUP.md).

```sh
npm test
npm run build
```

15 unit tests plus browser checks cover catalogue matching, image validation, data boundaries and player behaviour. [Evidence and limits](BUILD_LOG.md).

## Practical limits

- Spotify development access supports five manually added testers; the owner needs Premium. The shared Auricle developer app has one shared allowance. Guest discovery needs no Spotify login.
- Playback depends on provider, account and browser permissions. Some browsers may require Play inside the Spotify widget.
- Saved finds stay in this browser. Personal covers last for the current selection, across edit/return, but not reloads; they do not change Spotify artwork.
- API usage is billed to the configured key. Demo limits are best-effort, not distributed abuse protection. Photos are resized before sending; no application database stores photos or recordings.

## Built today, with Codex

Built during **DevDay Exchange London, 1 November 2026** using Next.js, React, TypeScript, Vercel AI SDK, OpenAI, Spotify and Apple’s catalogue. Codex implemented and tested the journey, fixed a real origin-check failure, tightened genre matching and added regression coverage. [Submission draft](docs/SUBMISSION.md).

Existing project **Auricle** inspired the direction; no source or assets were copied. Its player was later inspected as a playback reference. Design used [AdeyStudios web-design](https://github.com/AdeyStudios/skills). CSS sleeve artwork is original; icons are Lucide, fonts DM Sans and Instrument Serif. Album art belongs to its owners; song previews are courtesy of iTunes, with Apple’s official store badge. [Full setup, credits and official references](docs/SETUP.md).
