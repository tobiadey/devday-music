"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { X } from "lucide-react";

type PlaybackEvent = {
  data: {
    playingURI?: string;
    isPaused: boolean;
    isBuffering: boolean;
    duration: number;
    position: number;
  };
};
type EmbedController = {
  loadEntity: (uri: string) => void;
  play: () => void;
  pause: () => void;
  destroy: () => void;
  addListener: (
    event: string,
    callback: (event: PlaybackEvent) => void,
  ) => void;
};
type IFrameAPI = {
  createController: (
    element: HTMLElement,
    options: { uri: string; width: string; height: number },
    callback: (controller: EmbedController) => void,
  ) => void;
};
declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: IFrameAPI) => void;
    undertoneSpotifyApi?: IFrameAPI;
  }
}
let apiPromise: Promise<IFrameAPI> | null = null;
function loadApi() {
  if (window.undertoneSpotifyApi)
    return Promise.resolve(window.undertoneSpotifyApi);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<IFrameAPI>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Spotify player took too long to load.")),
      15000,
    );
    window.onSpotifyIframeApiReady = (api) => {
      clearTimeout(timeout);
      window.undertoneSpotifyApi = api;
      resolve(api);
    };
    let script = document.getElementById(
      "spotify-iframe-api",
    ) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = "spotify-iframe-api";
      script.src = "https://open.spotify.com/embed/iframe-api/v1";
      script.async = true;
      script.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Spotify player couldn't load."));
      };
      document.body.appendChild(script);
    }
  });
  return apiPromise;
}

export type SpotifyPlayerHandle = {
  play: (id: string) => void;
  pause: () => void;
  close: () => void;
};
type Props = {
  initialTrackId?: string;
  onState: (id: string | null, playing: boolean, pending: boolean) => void;
  onVisible: (visible: boolean) => void;
};

export const SpotifyPlayer = forwardRef<SpotifyPlayerHandle, Props>(
  function SpotifyPlayer({ initialTrackId, onState, onVisible }, ref) {
    const host = useRef<HTMLDivElement>(null);
    const controller = useRef<EmbedController | null>(null);
    const current = useRef<string | null>(null);
    const wantsPlay = useRef(false);
    const active = useRef(false);
    const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const callbacks = useRef({ onState, onVisible });
    callbacks.current = { onState, onVisible };
    const [visible, setVisible] = useState(false);
    const [notice, setNotice] = useState("");
    const [fallback, setFallback] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);

    function clearPending() {
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    }
    function pause() {
      wantsPlay.current = false;
      clearPending();
      controller.current?.pause();
      callbacks.current.onState(current.current, false, false);
    }
    function close() {
      pause();
      active.current = false;
      setVisible(false);
      callbacks.current.onVisible(false);
    }
    useImperativeHandle(ref, () => ({
      play(id) {
        current.current = id;
        wantsPlay.current = false;
        active.current = true;
        setSelected(id);
        setVisible(true);
        setNotice("");
        callbacks.current.onVisible(true);
        callbacks.current.onState(id, false, false);
        clearPending();
        controller.current?.pause();
        controller.current?.loadEntity(`spotify:track:${id}`);
      },
      pause,
      close,
    }));

    useEffect(() => {
      if (!initialTrackId || controller.current || !host.current) return;
      let cancelled = false;
      void loadApi()
        .then((api) => {
          if (cancelled || !host.current || controller.current) return;
          const element = document.createElement("div");
          host.current.replaceChildren(element);
          const id = current.current ?? initialTrackId;
          current.current = id;
          api.createController(
            element,
            { uri: `spotify:track:${id}`, width: "100%", height: 152 },
            (embed) => {
              if (cancelled) {
                embed.destroy();
                return;
              }
              controller.current = embed;
              embed.addListener("ready", () => {
                if (wantsPlay.current && current.current) {
                  embed.loadEntity(`spotify:track:${current.current}`);
                  embed.play();
                }
              });
              embed.addListener("playback_started", (event) => {
                if (!active.current) return;
                if (
                  event.data.playingURI &&
                  event.data.playingURI !== `spotify:track:${current.current}`
                )
                  return;
                wantsPlay.current = false;
                clearPending();
                setNotice("");
                callbacks.current.onState(current.current, true, false);
              });
              embed.addListener("playback_update", (event) => {
                if (!active.current) return;
                const data = event.data;
                if (
                  data.playingURI &&
                  data.playingURI !== `spotify:track:${current.current}`
                )
                  return;
                if (!data.isPaused && !data.isBuffering) {
                  wantsPlay.current = false;
                  clearPending();
                  setNotice("");
                }
                callbacks.current.onState(
                  current.current,
                  !data.isPaused && !data.isBuffering,
                  data.isBuffering || wantsPlay.current,
                );
              });
              // A cached embed can be ready before listeners are installed.
              if (wantsPlay.current && current.current) {
                embed.loadEntity(`spotify:track:${current.current}`);
                embed.play();
              }
            },
          );
        })
        .catch(() => {
          if (!cancelled) {
            setFallback(true);
            setNotice("Use Play in the Spotify player to start this song.");
            callbacks.current.onState(current.current, false, false);
          }
        });
      return () => {
        cancelled = true;
      };
    }, [initialTrackId]);

    useEffect(
      () => () => {
        clearPending();
        controller.current?.destroy();
      },
      [],
    );

    return (
      <aside
        className={`spotify-player${visible ? "" : " player-idle"}`}
        aria-label="Spotify player"
        aria-hidden={!visible}
      >
        <button aria-label="Close player" onClick={close}>
          <X size={18} />
        </button>
        {notice && (
          <p className="player-notice" role="status">
            {notice}
          </p>
        )}
        <div ref={host} hidden={fallback} />
        {fallback && selected && (
          <iframe
            title="Play this song on Spotify"
            src={`https://open.spotify.com/embed/track/${selected}?theme=0`}
            width="100%"
            height="152"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          />
        )}
      </aside>
    );
  },
);
