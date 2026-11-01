// Run against a local dev server. Set PLAYBACK_LIVE_SPOTIFY=1 to also exercise the real public embed.
const { chromium } = require("@playwright/test");
const assert = require("assert/strict");
const tracks = [
  {
    id: "4uLU6hMCjMI75M1A2tKUQC",
    title: "Never Gonna Give You Up",
    artist: "Rick Astley",
  },
  {
    id: "0VjIjW4GlUZAMYd2vXMi3b",
    title: "Blinding Lights",
    artist: "The Weeknd",
  },
].map((t) => ({
  ...t,
  reason: "Public playback test recording.",
  artwork: null,
  preview: null,
  url: "https://open.spotify.com/track/" + t.id,
  spotifyUrl: "https://open.spotify.com/track/" + t.id,
  source: "spotify",
}));
const fixture = {
  title: "Playback regression fixture",
  description:
    "Public tracks used to verify controls, not a recommendation quality test.",
  tracks,
  unavailable: 0,
};
const mockSDK = `window.__playCalls=[];window.onSpotifyIframeApiReady({createController(el,opts,cb){let uri=opts.uri;const listeners={};el.textContent='Player fixture';const emit=()=>{for(const f of listeners.playback_update||[])f({data:{playingURI:uri,isPaused:false,isBuffering:false}})};cb({loadEntity(u){uri=u;window.__playCalls.push(['load',u])},play(){window.__playCalls.push(['play']);setTimeout(emit,10)},pause(){window.__playCalls.push(['pause'])},destroy(){},addListener(e,f){(listeners[e]??=[]).push(f)}});}});`;
(async () => {
  const browser = await chromium.launch();
  for (const mode of process.env.PLAYBACK_LIVE_SPOTIFY === "1"
    ? ["early-ready-regression", "real-spotify"]
    : ["early-ready-regression"]) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.route("**/api/discover", (r) => r.fulfill({ json: fixture }));
    if (mode === "early-ready-regression")
      await page.route("https://open.spotify.com/embed/iframe-api/v1", (r) =>
        r.fulfill({ contentType: "application/javascript", body: mockSDK }),
      );
    await page.goto(process.env.PLAYBACK_TEST_URL || "http://127.0.0.1:3000/");
    await page.locator("#music-request").fill("A public playback test");
    await page
      .getByRole("button", { name: "Find my next favourite", exact: true })
      .click();
    await page.locator("#results-heading").waitFor();
    if (mode === "real-spotify") await page.waitForTimeout(3000);
    else await page.waitForFunction(() => window.__playCalls);
    const dock = page.locator(".spotify-player");
    assert((await dock.getAttribute("class")).includes("player-idle"));
    assert.notEqual(
      await dock.evaluate((n) => getComputedStyle(n).display),
      "none",
    );
    await page
      .getByRole("button", { name: "Play " + tracks[0].title, exact: true })
      .click();
    await page
      .getByRole("button", { name: "Pause " + tracks[0].title, exact: true })
      .waitFor({ timeout: 15000 });
    if (mode === "early-ready-regression") {
      assert.deepEqual(await page.evaluate(() => window.__playCalls), [
        ["load", "spotify:track:" + tracks[0].id],
        ["play"],
      ]);
    }
    await page
      .getByRole("button", { name: "Play " + tracks[1].title, exact: true })
      .click();
    await page
      .getByRole("button", { name: "Pause " + tracks[1].title, exact: true })
      .waitFor({ timeout: 20000 });
    await page
      .getByRole("button", { name: "Pause " + tracks[1].title, exact: true })
      .click();
    await page
      .getByRole("button", { name: "Play " + tracks[1].title, exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Play " + tracks[1].title, exact: true })
      .click();
    await page
      .getByRole("button", { name: "Pause " + tracks[1].title, exact: true })
      .waitFor({ timeout: 15000 });
    console.log(mode, "PASS first click, switch, pause and restart");
    await context.close();
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
