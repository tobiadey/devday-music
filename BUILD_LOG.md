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
