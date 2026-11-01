"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  AudioLines,
  Check,
  Disc3,
  Heart,
  LoaderCircle,
  Mic,
  Pause,
  Play,
  RefreshCw,
  Sparkles,
  Square,
  X,
} from "lucide-react";
import type { Mixtape, Track } from "@/lib/music";
import { discoveryExclusions } from "@/lib/discovery-input";

type Seed = {
  id: string;
  artistId: string;
  title: string;
  artist: string;
  artwork: string | null;
};
type SpotifyState = {
  connected: boolean;
  seeds?: Seed[];
  current?: Seed | null;
  error?: string;
};
const examples = [
  {
    label: "The long way home",
    note: "Warm, unhurried, a little wistful",
    prompt:
      "Warm soulful music for a late train home. Intimate vocals, a steady bass groove, a little wistful, like Cleo Sol and Sault. Find me some less obvious songs.",
  },
  {
    label: "Kitchen at midnight",
    note: "Loose grooves, low lights",
    prompt:
      "Left-field soulful grooves for cooking at midnight. I like Khruangbin, Yussef Dayes and BADBADNOTGOOD. Instrumentals welcome, nothing too frantic.",
  },
  {
    label: "Out of office",
    note: "A head start on the weekend",
    prompt:
      "Joyful, bouncy, slightly left-field dance music for Friday evening. I like disco, UK garage and warm house. Interesting percussion, not big festival EDM.",
  },
];
const directions = [
  { id: "balanced", label: "A little of both" },
  { id: "deeper", label: "Less obvious" },
  { id: "warmer", label: "More warmth" },
  { id: "energy", label: "More energy" },
] as const;

async function jsonRequest(url: string, body: unknown) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  if (!r.ok)
    throw new Error(
      d.error ?? "Something interrupted that request. Please try again.",
    );
  return d;
}

export function Discovery() {
  const [prompt, setPrompt] = useState("");
  const [direction, setDirection] =
    useState<(typeof directions)[number]["id"]>("balanced");
  const [mixtape, setMixtape] = useState<Mixtape | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [spotify, setSpotify] = useState<SpotifyState>({ connected: false });
  const [showSeeds, setShowSeeds] = useState(false);
  const [saved, setSaved] = useState<Track[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const results = useRef<HTMLElement | null>(null);
  const input = useRef<HTMLTextAreaElement | null>(null);
  const [spotifyPlayer, setSpotifyPlayer] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/spotify")
      .then((r) => r.json())
      .then(setSpotify)
      .catch(() => {});
    const params = new URLSearchParams(window.location.search);
    if (params.has("error")) {
      setError(
        "Spotify didn't connect. You can still describe your sound and discover music below.",
      );
      window.history.replaceState({}, "", "/");
    }
    if (params.has("connected")) window.history.replaceState({}, "", "/");
    try {
      const d = JSON.parse(localStorage.getItem("undertone-saved") ?? "[]");
      if (Array.isArray(d)) setSaved(d.slice(0, 60));
    } catch {
      /* storage is optional */
    }
    return () => {
      audio.current?.pause();
      recorder.current?.stream.getTracks().forEach((t) => t.stop());
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    if (!loading && !recording) {
      setElapsed(0);
      return;
    }
    const id = setInterval(() => setElapsed((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [loading, recording]);

  async function discover(seed?: Seed, nextPrompt = prompt) {
    if (loading) return;
    setLoading(true);
    setError("");
    audio.current?.pause();
    setPlaying(null);
    setSpotifyPlayer(null);
    try {
      const d = seed
        ? await jsonRequest("/api/spotify/discover", {
            artistId: seed.artistId,
          })
        : await jsonRequest("/api/discover", {
            prompt: nextPrompt,
            direction,
            ...discoveryExclusions([...(mixtape?.tracks ?? []), ...saved]),
          });
      setMixtape(d);
      setHidden([]);
      setShowSeeds(false);
      requestAnimationFrame(() =>
        results.current?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
          block: "start",
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  function save(track: Track) {
    const next = saved.some((t) => t.id === track.id)
      ? saved.filter((t) => t.id !== track.id)
      : [...saved, track].slice(-60);
    setSaved(next);
    try {
      localStorage.setItem("undertone-saved", JSON.stringify(next));
    } catch {
      /* storage is optional */
    }
  }
  async function listen(track: Track) {
    setError("");
    if (playing === track.id) {
      audio.current?.pause();
      setPlaying(null);
      setSpotifyPlayer(null);
      return;
    }
    audio.current?.pause();
    setSpotifyPlayer(null);
    if (track.source === "spotify") {
      setSpotifyPlayer(track.id);
      setPlaying(track.id);
      return;
    }
    if (!track.preview) return;
    const player = new Audio(track.preview);
    audio.current = player;
    player.onended = () => setPlaying(null);
    player.onerror = () => {
      setPlaying(null);
      setError(
        "This preview couldn't play. You can open the song in its store instead.",
      );
    };
    try {
      await player.play();
      setPlaying(track.id);
    } catch {
      setError(
        "Your browser couldn't play this preview. Try the music link instead.",
      );
    }
  }
  async function voice() {
    if (recording) {
      recorder.current?.stop();
      return;
    }
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError(
        "Voice recording isn't supported here. You can type your request instead.",
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm", "audio/mp4"].find((t) =>
        MediaRecorder.isTypeSupported(t),
      );
      const rec = new MediaRecorder(
        stream,
        mime ? { mimeType: mime } : undefined,
      );
      recorder.current = rec;
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        if (timer.current) clearTimeout(timer.current);
        setTranscribing(true);
        try {
          const clip = new Blob(chunks, { type: rec.mimeType });
          if (clip.size > 3 * 1024 * 1024) {
            throw new Error(
              "That recording is a little too large. Please try a shorter voice note.",
            );
          }
          const form = new FormData();
          form.append(
            "audio",
            clip,
            rec.mimeType.includes("mp4") ? "request.m4a" : "request.webm",
          );
          const r = await fetch("/api/transcribe", {
            method: "POST",
            body: form,
          });
          const d = await r.json();
          if (!r.ok) throw new Error(d.error);
          setPrompt(d.text.slice(0, 1000));
          input.current?.focus();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setTranscribing(false);
        }
      };
      rec.start();
      setRecording(true);
      timer.current = setTimeout(() => {
        if (rec.state === "recording") rec.stop();
      }, 60000);
    } catch {
      setError(
        "Microphone access wasn't available. You can type your request instead.",
      );
    }
  }

  return (
    <div className="app-shell">
      <header className="masthead">
        <a href="/" className="wordmark" aria-label="Undertone home">
          <AudioLines size={25} strokeWidth={1.8} />
          undertone<span className="wordmark-dot">.</span>
        </a>
        <div className="header-actions">
          {saved.length > 0 && (
            <a className="saved-link" href="#your-collection">
              <Heart size={15} /> <span>Your finds</span>
              <span className="count">{saved.length}</span>
            </a>
          )}
          {spotify.connected ? (
            <button
              className="connect connected"
              onClick={async () => {
                await jsonRequest("/api/auth/logout", {});
                setSpotify({ connected: false });
                setShowSeeds(false);
                setMixtape(null);
                audio.current?.pause();
                setPlaying(null);
                setSpotifyPlayer(null);
                const keep = saved.filter((t) => t.source !== "spotify");
                setSaved(keep);
                try {
                  localStorage.setItem("undertone-saved", JSON.stringify(keep));
                } catch {}
              }}
            >
              <span className="status-dot" /> Spotify connected{" "}
              <span className="disconnect">Disconnect</span>
            </button>
          ) : (
            <a className="connect" href="/api/auth/login">
              <SpotifyIcon /> Connect Spotify <ArrowUpRight size={14} />
            </a>
          )}
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-heading">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="tiny-line" /> GOOD MUSIC. YOUR KIND.
            </p>
            <h1 id="hero-heading">
              For the feeling
              <br />
              you can’t <em>quite name.</em>
            </h1>
            <p className="intro">
              A song, a mood, a half-formed thought.
              <br />
              Start anywhere. Find your next favourite.
            </p>
          </div>
          <div className="record-art" aria-hidden="true">
            <div className="sleeve">
              <div className="sleeve-grain" />
              <span className="sleeve-top">
                A LITTLE FURTHER FROM THE ALGORITHM
              </span>
              <span className="sleeve-title">
                the
                <br />
                <em>good</em>
                <br />
                stuff.
              </span>
              <span className="sleeve-bottom">
                SIDE A · THE THINGS YOU HAVEN’T HEARD YET
              </span>
            </div>
            <div className="vinyl">
              <div className="vinyl-label">
                <AudioLines size={28} />
                <span>UNDERTONE</span>
                <i />
              </div>
            </div>
            <span className="art-caption">
              YOUR NEXT FAVOURITE IS OUT THERE. ↗
            </span>
          </div>
        </section>

        <section className="discovery-desk" aria-label="Find music">
          <div className="desk-heading">
            <span className="eyebrow">01 / SET THE TONE</span>
            <span className="quiet">No perfect words needed.</span>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void discover();
            }}
          >
            <label className="sr-only" htmlFor="music-request">
              Describe the music you want
            </label>
            <textarea
              ref={input}
              id="music-request"
              maxLength={1000}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Something like Cleo Sol, but for a rainy Sunday. Warm bass, a little soul, nothing too obvious…"
              disabled={recording || transcribing}
            />
            <div className="composer-bottom">
              <button
                type="button"
                className={`voice-button ${recording ? "recording" : ""}`}
                disabled={loading || transcribing}
                onClick={() => void voice()}
                aria-label={
                  recording
                    ? "Stop recording"
                    : "Say it instead: describe your music by voice"
                }
              >
                {recording ? (
                  <Square size={15} fill="currentColor" />
                ) : transcribing ? (
                  <LoaderCircle size={17} className="spin" />
                ) : (
                  <Mic size={18} />
                )}
                <span>
                  {recording
                    ? `Stop recording · ${elapsed}s`
                    : transcribing
                      ? "Writing that down…"
                      : "Say it instead"}
                </span>
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={
                  prompt.trim().length < 8 ||
                  loading ||
                  recording ||
                  transcribing
                }
              >
                {loading ? (
                  <>
                    <LoaderCircle size={17} className="spin" /> Finding your
                    sound…
                  </>
                ) : (
                  <>
                    Find my next favourite <ArrowUpRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>
          {(recording || transcribing) && (
            <p className="voice-note">
              Record your request, not a song. Audio is sent for transcription;
              review the text before searching.
            </p>
          )}
          <div className="direction-row">
            <span>Take me somewhere</span>
            <div role="group" aria-label="Discovery direction">
              {directions.map((d) => (
                <button
                  key={d.id}
                  className={direction === d.id ? "pill selected" : "pill"}
                  aria-pressed={direction === d.id}
                  onClick={() => setDirection(d.id)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          {spotify.connected && (
            <div className="spotify-seeds">
              <button
                className="text-button"
                onClick={() => setShowSeeds(!showSeeds)}
              >
                <SpotifyIcon /> Or start with your listening{" "}
                <ArrowDown size={14} className={showSeeds ? "flipped" : ""} />
              </button>
              {showSeeds && (
                <div className="seed-list">
                  {spotify.current && (
                    <button
                      disabled={loading}
                      onClick={() => void discover(spotify.current!)}
                      className="seed current-seed"
                    >
                      <AudioLines size={17} />
                      <span>
                        <small>PLAYING NOW</small>
                        {spotify.current.title}
                        <em>{spotify.current.artist}</em>
                      </span>
                      <ArrowUpRight size={16} />
                    </button>
                  )}
                  {spotify.seeds?.map((s) => (
                    <button
                      className="seed"
                      key={s.id}
                      disabled={loading}
                      onClick={() => void discover(s)}
                    >
                      {s.artwork && (
                        <img src={s.artwork} alt="" width={42} height={42} />
                      )}
                      <span>
                        {s.title}
                        <em>{s.artist}</em>
                      </span>
                      <ArrowUpRight size={16} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {error && (
          <div className="error-message" role="alert">
            <span>{error}</span>
            <button aria-label="Dismiss message" onClick={() => setError("")}>
              <X size={17} />
            </button>
          </div>
        )}
        {loading && (
          <section className="loading-state" aria-live="polite">
            <div className="loading-heading">
              <Disc3 className="spin-slow" size={27} />
              <div>
                <h2>
                  {elapsed < 5
                    ? "Pulling a few records…"
                    : "Finding songs that fit…"}
                </h2>
                <p>A little curation beats an endless scroll.</p>
              </div>
            </div>
            <div className="skeleton-grid">
              {[1, 2, 3].map((n) => (
                <div key={n} className="skeleton-card">
                  <div />
                  <span />
                  <span />
                </div>
              ))}
            </div>
          </section>
        )}

        {!loading && !mixtape && (
          <section className="starting-points" aria-labelledby="start-heading">
            <div className="section-heading">
              <h2 id="start-heading">Or borrow a feeling.</h2>
              <span>JUST A PLACE TO START</span>
            </div>
            <div className="example-grid">
              {examples.map((example, i) => (
                <button
                  className={`example example-${i}`}
                  key={example.label}
                  onClick={() => {
                    setPrompt(example.prompt);
                    input.current?.focus();
                  }}
                >
                  <span className="example-number">0{i + 1}</span>
                  <span className="example-shape" aria-hidden="true" />
                  <h3>{example.label}</h3>
                  <p>{example.note}</p>
                  <ArrowUpRight className="example-arrow" size={19} />
                </button>
              ))}
            </div>
          </section>
        )}

        {!loading && mixtape && (
          <section
            className="results"
            ref={results}
            aria-labelledby="results-heading"
          >
            <div className="results-intro">
              <div>
                <p className="eyebrow">02 / YOUR NEXT FINDS</p>
                <h2 id="results-heading">{mixtape.title}</h2>
                <p>{mixtape.description}</p>
              </div>
              <button
                className="secondary-button"
                disabled={prompt.trim().length < 8}
                onClick={() => void discover()}
              >
                <RefreshCw size={16} /> A fresh selection
              </button>
            </div>
            <div className="track-grid">
              {mixtape.tracks
                .filter((t) => !hidden.includes(t.id))
                .map((track, i) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    index={i}
                    saved={saved.some((t) => t.id === track.id)}
                    playing={playing === track.id}
                    onListen={() => void listen(track)}
                    onSave={() => save(track)}
                    onHide={() => {
                      if (playing === track.id) {
                        audio.current?.pause();
                        setPlaying(null);
                        setSpotifyPlayer(null);
                      }
                      setHidden((h) => [...h, track.id]);
                    }}
                  />
                ))}
            </div>
            {mixtape.tracks.every((t) => hidden.includes(t.id)) && (
              <p className="empty-state">
                Not your sound yet. Adjust your description and try a fresh
                selection.
              </p>
            )}
            {mixtape.unavailable > 0 && (
              <p className="catalogue-note">
                We left out {mixtape.unavailable} suggestion
                {mixtape.unavailable === 1 ? "" : "s"} we couldn’t confirm in
                the catalogue.
              </p>
            )}
            <div className="selection-end">
              <Sparkles size={19} />
              <p>
                The closer you describe the feeling,
                <br />
                <strong>the closer we can get to your sound.</strong>
              </p>
              <a
                href="#music-request"
                className="text-button"
                onClick={() => input.current?.focus()}
              >
                Refine your request <ArrowUpRight size={15} />
              </a>
            </div>
          </section>
        )}

        {saved.length > 0 && (
          <section className="collection" id="your-collection">
            <div className="section-heading">
              <h2>Your finds.</h2>
              <span>{saved.length} SAVED ON THIS DEVICE</span>
            </div>
            <div className="collection-list">
              {saved.map((t) => (
                <div key={t.id}>
                  {t.artwork && (
                    <img src={t.artwork} width={46} height={46} alt="" />
                  )}
                  <a
                    href={t.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <strong>{t.title}</strong>
                    <span>{t.artist}</span>
                  </a>
                  <button
                    aria-label={`Remove ${t.title} from your finds`}
                    onClick={() => save(t)}
                  >
                    <Heart size={17} fill="currentColor" />
                  </button>
                  <a
                    href={t.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${t.title}`}
                  >
                    <ArrowUpRight size={17} />
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {spotifyPlayer && (
        <aside className="spotify-player" aria-label="Spotify player">
          <button
            aria-label="Close player"
            onClick={() => {
              setSpotifyPlayer(null);
              setPlaying(null);
            }}
          >
            <X size={18} />
          </button>
          <iframe
            title="Play this song on Spotify"
            src={`https://open.spotify.com/embed/track/${spotifyPlayer}?utm_source=generator&theme=0`}
            width="100%"
            height="152"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </aside>
      )}
      <footer>
        <a className="wordmark" href="/">
          undertone<span className="wordmark-dot">.</span>
        </a>
        <span>Made for the good kind of discovery.</span>
        <button
          onClick={() => setShowPrivacy(!showPrivacy)}
          aria-expanded={showPrivacy}
        >
          A note on your data
        </button>
      </footer>
      {showPrivacy && (
        <div className="privacy-note">
          <p>
            Guest song previews are provided courtesy of iTunes. iTunes and the
            iTunes Store are trademarks of Apple Inc., registered in the U.S.
            and other countries.
          </p>
          <p>
            Your typed request or voice note goes to OpenAI to help find your
            sound. Voice text can be edited before searching. Spotify listening
            data stays out of AI requests. We don’t keep recordings or listening
            history in a database.
          </p>
          <p>
            Saved finds stay in this browser. Disconnect removes this app’s
            Spotify session. Guest previews are provided by Apple’s catalogue,
            with a link to each song in the store. Spotify playback and access
            depend on your account and region.
          </p>
        </div>
      )}
    </div>
  );
}

function TrackCard({
  track,
  index,
  saved,
  playing,
  onListen,
  onSave,
  onHide,
}: {
  track: Track;
  index: number;
  saved: boolean;
  playing: boolean;
  onListen: () => void;
  onSave: () => void;
  onHide: () => void;
}) {
  return (
    <article
      className="track-card"
      style={{ "--card-index": index } as React.CSSProperties}
    >
      <div className="artwork-wrap">
        {track.artwork ? (
          <img
            src={track.artwork}
            alt={`${track.title} album artwork`}
            width={300}
            height={300}
          />
        ) : (
          <div className="missing-art">
            <Disc3 size={60} />
          </div>
        )}
        <span className="track-number">0{index + 1}</span>
        <button
          className={`save-button ${saved ? "is-saved" : ""}`}
          onClick={onSave}
          aria-label={`${saved ? "Unsave" : "Save"} ${track.title}`}
          aria-pressed={saved}
        >
          {saved ? <Check size={18} /> : <Heart size={18} />}
        </button>
        {(track.preview || track.source === "spotify") && (
          <button
            className="play-button"
            aria-label={`${playing ? "Pause" : track.source === "apple" ? "Preview" : "Play"} ${track.title}`}
            onClick={onListen}
          >
            {playing ? (
              <Pause size={23} fill="currentColor" />
            ) : (
              <Play size={23} fill="currentColor" />
            )}
          </button>
        )}
      </div>
      <div className="track-info">
        <h3>{track.title}</h3>
        <p className="artist">{track.artist}</p>
        {track.source === "apple" && (
          <p className="preview-credit">Song preview · courtesy of iTunes</p>
        )}
        <p className="reason">{track.reason}</p>
        <div className="track-links">
          {track.source === "apple" ? (
            <a
              className="apple-badge"
              href={track.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Get it on iTunes: ${track.title}`}
            >
              <img
                src="/itunes-badge.png"
                alt="Get it on iTunes"
                width={88}
                height={30}
              />
            </a>
          ) : (
            <a
              className="source-badge"
              href={track.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <SpotifyIcon /> Spotify <ArrowUpRight size={12} />
            </a>
          )}
          <button
            className="not-for-me"
            onClick={onHide}
            aria-label={`Not for me: hide ${track.title}`}
          >
            Not for me
          </button>
        </div>
        {track.source === "apple" && (
          <a
            className="spotify-search"
            href={track.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <SpotifyIcon /> Find on Spotify <ArrowUpRight size={12} />
          </a>
        )}
      </div>
    </article>
  );
}
function SpotifyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm5.5 17.3a.75.75 0 0 1-1 .3c-2.8-1.7-6.3-2.1-10.4-1.2a.75.75 0 1 1-.3-1.5c4.4-1 8.3-.5 11.4 1.4a.75.75 0 0 1 .3 1Zm1.4-3.1a.94.94 0 0 1-1.3.3c-3.2-2-8-2.6-11.7-1.5a.94.94 0 1 1-.5-1.8c4.2-1.3 9.5-.7 13.2 1.6a.94.94 0 0 1 .3 1.4Zm.1-3.2c-3.8-2.3-10.2-2.5-13.9-1.4a1.13 1.13 0 1 1-.7-2.2C8.7 6.1 15.8 6.4 20.2 9a1.13 1.13 0 1 1-1.2 2Z" />
    </svg>
  );
}
