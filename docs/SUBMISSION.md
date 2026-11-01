# Submission draft

**Project:** Undertone

**One line:** Find your next favourite song, starting with a feeling or a photo.

**Who and why:** Music listeners often know the mood, vocals or groove they want, but a genre filter does not express it. Undertone turns a typed or spoken description, or a photo, into a short selection of real songs to explore.

**Working journey:** Describe your sound or upload a photo → get catalogue-checked suggestions → hear a preview → save a find or hide a miss → refine your request. Make an original personal cover for any individual song. Guest discovery needs no account. Spotify adds a separate listening-seed path and its player; development-mode access is limited.

## Links

- [Live app](https://devday-music.vercel.app)
- [Public repository and setup](https://github.com/tobiadey/devday-music)
- [45-second demo video](https://github.com/tobiadey/devday-music/releases/download/hackathon-demo/undertone-demo.mp4)

## Concrete Codex contribution

Codex implemented the application and tested the actual browser journey. It caught a local same-site origin check rejecting legitimate requests, fixed the guard and added a regression test. Further review caught Spotify names entering refinement exclusions; Codex separated provider IDs from the AI prompt and tested that boundary. Thirteen tests and the production build pass. Codex also traced irrelevant Afrobeats suggestions to unchecked genre-search hits and added artist-genre verification with regression coverage. Evidence: [build log](../BUILD_LOG.md), [tests](../tests/music.test.ts), [boundary fix](https://github.com/tobiadey/devday-music/commit/a24fe7a).

## Built today and credits

The application code, OAuth integration, catalogue verification, discovery interface and CSS record-sleeve illustration were built during this hackathon. Existing private project Auricle inspired the direction; none of its code or assets were copied. Third-party APIs, libraries, fonts and Apple's official badge are credited in the README.

**Before submitting:** add all team member names and a contact email directly to the organisers' submission form. The founder has confirmed the Spotify callback and signed-in flow; add any other demo accounts to the developer allowlist. Physical-phone behaviour remains to be checked. The event deadline is 17:00 London time on 1 November 2026.
