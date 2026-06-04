import * as React from "react";
import { cn } from "@/lib/utils";
import { Play, X } from "lucide-react";

interface VideoPlayerProps extends React.HTMLAttributes<HTMLDivElement> {
  thumbnailUrl: string;
  videoUrl: string;
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
      title,
      description,
      aspectRatio = "16/9",
      ...props
    },
    ref
  ) => {
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    React.useEffect(() => {
      const handleEsc = (event: KeyboardEvent) => {
        if (event.key === "Escape") setIsModalOpen(false);
      };
      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
    }, []);

    React.useEffect(() => {
      if (isModalOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "auto";
      }
      return () => {
        document.body.style.overflow = "auto";
      };
    }, [isModalOpen]);

    const aspectClass =
      aspectRatio === "1/1"
        ? "aspect-square"
        : aspectRatio === "4/3"
        ? "aspect-[4/3]"
        : "aspect-video";

    return (
      <>
        <div
          ref={ref}
          role="button"
          tabIndex={0}
          onClick={() => setIsModalOpen(true)}
          onKeyDown={(e) => e.key === "Enter" && setIsModalOpen(true)}
          aria-label={`Reproduzir vídeo: ${title}`}
          className={cn(
            "group relative w-full overflow-hidden rounded-2xl cursor-pointer outline-none",
            "ring-1 ring-white/10 hover:ring-[color:var(--c-primary)]/60 transition-all duration-500",
            "shadow-[0_20px_60px_-20px_rgba(0,177,140,0.35)]",
            aspectClass,
            className
          )}
          {...props}
        >
          {/* Thumbnail */}
          <img
            src={thumbnailUrl}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />

          {/* Play Button */}
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

          {/* Title and Description */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <h3 className="font-display text-2xl md:text-3xl font-bold text-white">
              {title}
            </h3>
            {description && (
              <p className="mt-2 text-sm md:text-base text-white/80 max-w-2xl">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in"
            onClick={() => setIsModalOpen(false)}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 z-50 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              aria-label="Fechar player"
            >
              <X className="h-6 w-6" />
            </button>

            <div
              className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                src={`${videoUrl}${videoUrl.includes("?") ? "&" : "?"}autoplay=1`}
                title={title}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </>
    );
  }
);
VideoPlayer.displayName = "VideoPlayer";
