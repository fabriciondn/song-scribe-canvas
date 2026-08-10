import * as React from "react";
import { cn } from "@/lib/utils";
import { Play, Pause, Volume2, VolumeX, Maximize2 } from "lucide-react";

interface VideoPlayerProps extends React.HTMLAttributes<HTMLDivElement> {
  thumbnailUrl?: string;
  videoUrl: string;
  videoId?: string;
  title: string;
  description?: string;
  aspectRatio?: "16/9" | "4/3" | "1/1";
}

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const loadYouTubeAPI = (): Promise<any> =>
  new Promise((resolve) => {
    if (window.YT && window.YT.Player) return resolve(window.YT);
    const existing = document.getElementById("yt-iframe-api");
    if (!existing) {
      const s = document.createElement("script");
      s.id = "yt-iframe-api";
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT);
    };
    const check = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(check);
        resolve(window.YT);
      }
    }, 200);
  });

const fmt = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export const VideoPlayer = React.forwardRef<HTMLDivElement, VideoPlayerProps>(
  (
    {
      className,
      thumbnailUrl,
      videoUrl,
      videoId,
      title,
      description,
      aspectRatio = "16/9",
      ...props
    },
    ref
  ) => {
    const resolvedId = React.useMemo(() => {
      if (videoId) return videoId;
      const m = videoUrl.match(/(?:embed\/|v=|youtu\.be\/)([\w-]{6,})/);
      return m?.[1];
    }, [videoId, videoUrl]);

    const [started, setStarted] = React.useState(false);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [isMuted, setIsMuted] = React.useState(false);
    const [current, setCurrent] = React.useState(0);
    const [duration, setDuration] = React.useState(0);
    const [thumbSrc, setThumbSrc] = React.useState<string | undefined>(
      thumbnailUrl ||
        (resolvedId
          ? `https://i.ytimg.com/vi/${resolvedId}/maxresdefault.jpg`
          : undefined)
    );

    const containerRef = React.useRef<HTMLDivElement>(null);
    const mountRef = React.useRef<HTMLDivElement>(null);
    const playerRef = React.useRef<any>(null);

    const aspectClass =
      aspectRatio === "1/1"
        ? "aspect-square"
        : aspectRatio === "4/3"
        ? "aspect-[4/3]"
        : "aspect-video";

    const handleThumbError = () => {
      if (!resolvedId) return;
      if (thumbSrc?.includes("maxresdefault")) {
        setThumbSrc(`https://i.ytimg.com/vi/${resolvedId}/sddefault.jpg`);
      } else if (thumbSrc?.includes("sddefault")) {
        setThumbSrc(`https://i.ytimg.com/vi/${resolvedId}/hqdefault.jpg`);
      }
    };

    // Cria o player quando o usuário inicia
    React.useEffect(() => {
      if (!started || !resolvedId || playerRef.current) return;
      let cancelled = false;
      loadYouTubeAPI().then((YT) => {
        if (cancelled || !mountRef.current) return;
        playerRef.current = new YT.Player(mountRef.current, {
          videoId: resolvedId,
          host: "https://www.youtube-nocookie.com",
          playerVars: {
            autoplay: 1,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            disablekb: 1,
            fs: 0,
            playsinline: 1,
          },
          events: {
            onReady: (e: any) => {
              setDuration(e.target.getDuration() || 0);
              e.target.playVideo();
            },
            onStateChange: (e: any) => {
              setIsPlaying(e.data === 1);
              if (e.data === 1) setDuration(e.target.getDuration() || 0);
            },
          },
        });
      });
      return () => {
        cancelled = true;
      };
    }, [started, resolvedId]);

    // Progresso
    React.useEffect(() => {
      if (!started) return;
      const t = setInterval(() => {
        const p = playerRef.current;
        if (p?.getCurrentTime) {
          setCurrent(p.getCurrentTime() || 0);
          if (!duration && p.getDuration) setDuration(p.getDuration() || 0);
        }
      }, 250);
      return () => clearInterval(t);
    }, [started, duration]);

    const togglePlay = () => {
      const p = playerRef.current;
      if (!p) return;
      if (isPlaying) p.pauseVideo();
      else p.playVideo();
    };

    const toggleMute = () => {
      const p = playerRef.current;
      if (!p) return;
      if (isMuted) {
        p.unMute();
        setIsMuted(false);
      } else {
        p.mute();
        setIsMuted(true);
      }
    };

    const seek = (e: React.MouseEvent<HTMLDivElement>) => {
      const p = playerRef.current;
      if (!p || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
      p.seekTo(ratio * duration, true);
      setCurrent(ratio * duration);
    };

    const goFullscreen = () => {
      containerRef.current?.requestFullscreen?.();
    };

    const progress = duration ? (current / duration) * 100 : 0;

    return (
      <div
        ref={(node) => {
          containerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className={cn(
          "group relative w-full overflow-hidden rounded-2xl ring-1 ring-white/10 bg-black",
          "shadow-[0_20px_60px_-20px_rgba(0,177,140,0.35)]",
          aspectClass,
          className
        )}
        {...props}
      >
        {!started ? (
          <button
            type="button"
            onClick={() => setStarted(true)}
            aria-label={`Reproduzir vídeo: ${title}`}
            className="absolute inset-0 cursor-pointer outline-none"
          >
            {thumbSrc && (
              <img
                src={thumbSrc}
                onError={handleThumbError}
                alt={title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
            )}
            <div className="absolute inset-0 bg-black/25" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 group-hover:scale-110"
                style={{
                  background: "var(--c-primary)",
                  boxShadow:
                    "0 0 0 8px rgba(0,177,140,0.15), 0 0 40px rgba(0,177,140,0.5)",
                }}
              >
                <Play className="h-8 w-8 fill-[#06130B] text-[#06130B] ml-1" />
              </div>
            </div>
          </button>
        ) : (
          <>
            {/* iframe do YouTube ampliado para esconder qualquer UI nativa */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div
                ref={mountRef}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ width: "100%", height: "100%" }}
              />
            </div>

            {/* Camada que intercepta cliques: nada da UI do YouTube é acessível */}
            <button
              type="button"
              aria-label={isPlaying ? "Pausar vídeo" : "Reproduzir vídeo"}
              onClick={togglePlay}
              className="absolute inset-0 cursor-pointer outline-none"
            />

            {/* Controles próprios */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="absolute inset-x-0 bottom-0 px-4 pb-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div
                onClick={seek}
                className="mb-3 h-1.5 w-full cursor-pointer rounded-full bg-white/25"
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${progress}%`, background: "var(--c-primary)" }}
                />
              </div>
              <div className="flex items-center gap-3 text-white">
                <button type="button" onClick={togglePlay} aria-label="Play/Pause">
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </button>
                <button type="button" onClick={toggleMute} aria-label="Som">
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </button>
                <span className="text-xs tabular-nums text-white/80">
                  {fmt(current)} / {fmt(duration)}
                </span>
                <button
                  type="button"
                  onClick={goFullscreen}
                  aria-label="Tela cheia"
                  className="ml-auto"
                >
                  <Maximize2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
);
VideoPlayer.displayName = "VideoPlayer";
