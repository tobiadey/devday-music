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
