import * as React from "react";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";

interface VideoPlayerProps extends React.HTMLAttributes<HTMLDivElement> {
  thumbnailUrl?: string;
  videoUrl: string;
  videoId?: string;
  title: string;
  description?: string;
  aspectRatio?: "16/9" | "4/3" | "1/1";
}

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
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [thumbSrc, setThumbSrc] = React.useState<string | undefined>(
      thumbnailUrl ||
        (videoId ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` : undefined)
    );

    const aspectClass =
      aspectRatio === "1/1"
        ? "aspect-square"
        : aspectRatio === "4/3"
        ? "aspect-[4/3]"
        : "aspect-video";

    const handleThumbError = () => {
      if (!videoId) return;
      // Fallback chain: maxres → sddefault → hqdefault
      if (thumbSrc?.includes("maxresdefault")) {
        setThumbSrc(`https://i.ytimg.com/vi/${videoId}/sddefault.jpg`);
      } else if (thumbSrc?.includes("sddefault")) {
        setThumbSrc(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-2xl ring-1 ring-white/10",
          "shadow-[0_20px_60px_-20px_rgba(0,177,140,0.35)]",
          aspectClass,
          className
        )}
        {...props}
      >
        {!isPlaying ? (
          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            aria-label={`Reproduzir vídeo: ${title}`}
            className="group absolute inset-0 cursor-pointer outline-none"
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />
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
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-left">
              <h3 className="font-display text-2xl md:text-3xl font-bold text-white">
                {title}
              </h3>
              {description && (
                <p className="mt-2 text-sm md:text-base text-white/80 max-w-2xl">
                  {description}
                </p>
              )}
            </div>
          </button>
        ) : (
          <iframe
            src={`${videoUrl}${videoUrl.includes("?") ? "&" : "?"}autoplay=1&rel=0`}
            title={title}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
    );
  }
);
VideoPlayer.displayName = "VideoPlayer";
