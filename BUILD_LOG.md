# Hackathon build log

## 1 November 2026

- Started a fresh repository on the founder's personal GitHub.
- Reviewed the organisers' Builders Guide. Judging gives equal weight to idea/usefulness, use of Codex, execution, and demo/clarity, each scored 1–5.
- Defined the direction with the founder: multi-input music discovery, with recommendation quality as the main goal.
- Codex checked transcription capabilities and identified that speech transcription does not replace music fingerprinting. The product direction is discovery rather than identifying an unknown recording.
- Checking Spotify's current API access, playback and AI-use constraints before implementation.

Add concrete implementation changes, commands run, observed results and limitations here as the build progresses. Do not claim tests or deployments that have not happened.

- Verified Spotify's current development-mode constraints: Premium app owner, up to five allowlisted users. Its Developer Policy prohibits ingesting Spotify content into AI models and restricts voice control. This changes the data boundary: user-authored preferences must remain separate from Spotify content; Spotify history must not be sent to an AI service.
- Spotify integration access and input interpretation are being confirmed before implementation. The public repository is documentation-only at this checkpoint.

### First implementation and local verification

- Retrieved Auricle's public client ID from its live OAuth redirect. No existing application code copied. New OAuth code uses PKCE, encrypted HttpOnly cookies, state/expiry checks and refresh.
- Verified the existing local OpenAI credential with the models endpoint, without printing or committing it. Selected available models rather than guessing IDs.
- Implemented typed/voice request → structured recommendations → exact title/artist catalogue verification → preview/store links → save/hide → refine. Spotify seeds use catalogue genres without sending Spotify content to OpenAI.
- Used the AdeyStudios web-design skill: responsive dark record-store identity, original CSS sleeve/vinyl, music artwork, visible focus/selected/processing/error states and reduced motion.
- `npm test`: 7 tests passed. `npm run typecheck`: passed. `npm run build`: passed, homepage pre-rendered and API routes built.
- Live API discovery: HTTP 200 in 7.55 seconds, six real catalogue matches with preview URLs; four uncertain suggestions were omitted. Another live browser request returned three verified matches. This is not evidence of listener preference or recommendation quality.
- A synthetic spoken request was transcribed correctly; HTTP 200 in 1.43 seconds. No private user audio used.
- Playwright: real browser discovery exercised; existing live response replayed separately for repeatable UI checks. Preview playback entered its playing state, hiding removed a track, and a saved find survived reload. No page errors or overflow at 1440px and 390px. Actual iPhone microphone/keyboard behaviour is not yet verified.
- Codex caught the initial local-origin guard rejecting a same-site browser request, fixed it and added a regression test. Accessibility scan also caught mismatched button labels, which were corrected; the final reduced-motion mobile results scan reported zero violations (automated check, not a full accessibility audit).
- Deployment and live Spotify authorization still pending; callback allowlisting must be configured for the new app URL.

### Public deployment

- The connected Vercel app returned 403 creating a project; the local CLI had no session. The founder completed CLI login. Used that verified account to create a separate `devday-music` project, connect this public Git repository and configure only the needed runtime variables. Auricle was not modified.
- Public homepage: HTTP 200 without authentication. Live public discovery: HTTP 200 in 13.49 seconds, six confirmed songs, two unconfirmed suggestions omitted. Production URL: https://devday-music.vercel.app.
- Homepage and results checks at 320px, 768px and 1440px: no horizontal overflow, no browser page errors, zero automated accessibility violations with reduced motion enabled.
- Verified a higher-resolution artwork URL before using it; replaced the improvised store label with Apple's official badge and preview attribution.
- Founder needs to add the new Spotify callback. Actual Spotify consent/playback and physical-phone behaviour remain unverified.

### Refinement boundary and demo recording

- Review found a mixed-mode edge case: the refinement exclusions could include names from Spotify catalogue selections. Split Spotify IDs from non-Spotify text exclusions; only the latter enter the model. Spotify ID exclusions are applied after catalogue verification. Added a focused regression test. All eight tests, TypeScript and production build pass.
- Recorded a 45.16-second real public browser journey: typed request, live generation (16 seconds, six confirmed songs), actual preview playing, save/hide and saved finds. No page errors. Recording is silent: no private audio or music audio is bundled in the video.

### Public artifact checks

- Published the 45.16-second H.264 demo as a GitHub release asset; public unauthenticated HEAD requests returned 200 for both repository and video. Inspected opening, preview/results and Codex-caption frames before publishing. No audio stream is included.
- Production synthetic voice transcription returned HTTP 200 in 2.12 seconds and correctly transcribed the test sentence. Spotify login reaches Spotify's official sign-in screen; actual user consent and callback completion are not yet verified.
- Added a submission draft with links, credits and the concrete Codex example; team/contact details should go directly into the event form.

### Links and operational notes

- Confirmed the live app link is present in the README and GitHub website field; synchronised the hackathon brief with current app/repo/video/submission links and the exact Spotify callback.
- Rechecked Spotify's official access rules: standard development mode has five allowlisted accounts per developer app. Undertone and Auricle currently share a developer app; the founder’s dashboard screenshot showed 0/5 manual entries while their owner account worked; any grandfathered allowance is unknown. Guest discovery avoids Spotify sign-in slots.
- Split completed public-link checks from the still-pending event submission. Founder screenshots subsequently confirmed successful Spotify connection, listening seeds and embed playback.

### Multimodal discovery, focused results and individual covers

- Founder feedback exposed poor Spotify seed matches. Removed random-offset/first-query filling; interleave genre searches, verify candidate artists’ own genres, omit unverifiable artists and exclude known/recent tracks. Added explicit Afrobeats versus broad Afrobeat regression coverage. This fixes a matching failure; improved listener satisfaction still needs a real listening test.
- Composer and hero now step aside for results, with Edit your request / Back to your songs. Added five rotating light-hearted placeholders and five quick-start pills; rotation pauses on focus and respects reduced motion.
- Replaced the open-widget-only action with Spotify’s official iframe controller. In a real public embed test, one card click reached the playing/Pause state without a second widget click. Actual playback events drive the UI. Account/browser restrictions can still require the visible widget’s Play button; Premium full-track playback is not established by this guest test.
- Added browser-resized JPEG/PNG/WebP upload and image-aware structured discovery. A live image-only request returned HTTP 200 in 13.36 seconds with six catalogue-confirmed tracks and reasons grounded in the fixture’s dark blue rainy street and warm windows. Fixture was synthetic, not a private user photo.
- Added **Make a cover on each song card**, never on the whole selection. OpenAI generated original square artwork successfully, both from text alone (12.5 seconds) and with the user-image reference path (12.02 seconds). New artwork replaces only that card; Restore original is available. Provider artwork remains attributed, and Spotify streaming retains its official widget artwork. Covers are local to the current results view.
- Cover generation receives only an independent user brief/photo, not Spotify song metadata or artwork. Five cover requests/hour/IP/instance is best-effort demo protection; no automatic generation retries.
- `npm test`: 13 tests passed, including image-only validation, image bounds/signatures and three Spotify matching regressions. TypeScript and production build passed. Browser verification and production deployment results recorded below after completion.

- Browser regression checks passed at 320, 390, 768 and 1440 pixels with reduced motion: no overflow, no page errors, zero automated accessibility violations. Replayed real smoke-test outputs for repeatability; verified photo-only submission, hidden composer on results, per-song replacement without changing neighbours, restore, clean cover request payload, and artwork surviving edit/return. An initial missing/incorrect heading hierarchy was caught by the scan and corrected.

### Production verification of the multimodal pass

- Production deployment `8f77937` reached READY. A real unauthenticated public-browser journey returned six confirmed songs from the synthetic photo, generated and displayed original artwork for just the selected song, played a preview and saved the song. No browser page errors. Vercel reported no grouped runtime errors in the selected ten-minute window.
- Refreshed the public demo: 47.24 seconds, H.264, 837 KB, silent. Inspected opening, generated-cover and final Codex-contribution frames. Updated the release asset at the existing public demo URL and the README screenshot. Image input and cover output are synthetic/original; no private photos, listening histories or music audio are included.
- Updated README setup/limits, submission draft, GitHub website link and the Obsidian hackathon brief. Event-form submission/team details remain outstanding.

### Follow-up: playback parity and song-specific artwork

- Founder reported the signed-in player still needed a second click. Inspected Auricle’s existing player as a reference without copying its component. Differences: this app hid the preload with `display:none`, waited on an extra readiness flag that can miss an early event, used `resume()` on a never-started recording, and sent pause immediately before play. Kept the embed mounted off-screen, issue `loadEntity(spotify URI)` + `play()` synchronously on the card click, use the SDK’s own loading queue, handle an already-ready controller, and removed the preceding pause/close sequence.
- Added a reproducible browser regression (`tests/browser/spotify-playback.cjs`) whose controller is ready before listeners and never emits another ready event. First click, track switch, pause and restart passed both that fixture and a real public Spotify embed. This verifies guest embeds; founder’s signed-in browser and Safari restrictions still need confirmation.
- Artwork now has a distinct 35–55-word brief for each AI-recommended song, generated before provider lookup from independent musical knowledge. The brief carries through catalogue verification. Image generation prioritises the recording’s rhythm/instruments/emotional character; an uploaded photo is only a secondary palette/texture reference.
- Spotify-only catalogue discoveries have no independent song brief and ask the listener for a short sound description. They do not silently send Spotify content to AI. Added two tests for this provenance boundary; all 15 unit tests pass.
- Live checks: typed discovery returned song-specific briefs in 20.57 seconds; image-only discovery returned six verified songs with distinct briefs in 19.98 seconds. Original artwork for Floating Points’ “Nespole” rendered a brass/glass kinetic sculpture in 11.89 seconds, matching the song brief rather than the rainy-city reference scene. This is a creative interpretation, not audio analysis.
- Raised the best-effort cover allowance to 12/hour/IP/instance so a six-song selection can have a cover for each track and room for revisions.

- Founder’s pet-image feedback exposed an overly literal object-to-song-title interpretation. Updated visual guidance to use whole-image expression/style/energy, avoid robot→“Robot Rock” keyword matching and treat ambiguous imagery as an interpretation rather than a known preference. Listener fit for the pet image has not been established by this prompt change.
- Kept the uploaded image visible above the results with a quick mood-edit action, so it can be compared while listening. Condensed the README; moved detailed setup/operational references into `docs/SETUP.md`.
