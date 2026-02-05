import React, { useState, useRef, useEffect } from 'react';
import { Play, Volume2, VolumeX } from 'lucide-react';

interface CustomVideoPlayerProps {
  videoUrl: string;
  onPlay?: () => void;
  onProgress?: (watchTime: number, percentComplete: number) => void;
  onComplete?: () => void;
}

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  videoUrl,
  onPlay,
  onProgress,
  onComplete
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [fakeProgress, setFakeProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchTimeRef = useRef(0);
  const hasTrackedPlay = useRef(false);
  const hasTrackedComplete = useRef(false);

  // Fake progress animation - purely visual
  useEffect(() => {
    if (isPlaying && !progressIntervalRef.current) {
      progressIntervalRef.current = setInterval(() => {
        setFakeProgress(prev => {
          // Slow, natural-looking progress that loops
          const newProgress = prev + 0.15;
          return newProgress >= 100 ? 0 : newProgress;
        });
      }, 100);
    } else if (!isPlaying && progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying]);

  // Track actual watch time for analytics
  useEffect(() => {
    let trackingInterval: NodeJS.Timeout | null = null;

    if (isPlaying) {
      trackingInterval = setInterval(() => {
        watchTimeRef.current += 30;
        const percentComplete = Math.min((watchTimeRef.current / 180) * 100, 100);
        
        onProgress?.(watchTimeRef.current, percentComplete);

        // Track completion at 90%
        if (percentComplete >= 90 && !hasTrackedComplete.current) {
          onComplete?.();
          hasTrackedComplete.current = true;
        }
      }, 30000);
    }

    return () => {
      if (trackingInterval) {
        clearInterval(trackingInterval);
      }
    };
  }, [isPlaying, onProgress, onComplete]);

  const handlePlayClick = () => {
    const video = videoRef.current;
    if (!video) return;

    if (showPlayButton) {
      // First click - unmute and play
      video.muted = false;
      setIsMuted(false);
      video.play();
      setIsPlaying(true);
      setShowPlayButton(false);

      if (!hasTrackedPlay.current) {
        onPlay?.();
        hasTrackedPlay.current = true;
      }
    } else {
      // Toggle play/pause
      if (video.paused) {
        video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  // Start video muted on load
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.play().catch(() => {
        // Autoplay blocked, that's fine
      });
    }
  }, []);

  return (
    <div 
      className="relative w-full max-w-3xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-2xl border-2 border-primary/30 cursor-pointer group"
      onClick={handlePlayClick}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        loop
        playsInline
        className="w-full h-full object-cover"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

      {/* Play button overlay */}
      {showPlayButton && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity">
          <div className="relative">
            {/* Pulse animation */}
            <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping" />
            <div className="relative bg-primary hover:bg-primary/90 rounded-full p-6 transition-transform group-hover:scale-110">
              <Play className="h-12 w-12 text-black fill-current" />
            </div>
          </div>
          <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-sm bg-black/60 px-4 py-2 rounded-full">
            Clique para assistir com som 🔊
          </p>
        </div>
      )}

      {/* Controls bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        {/* Fake progress bar */}
        <div className="relative h-1 bg-white/20 rounded-full mb-3 overflow-hidden">
          <div 
            className="absolute h-full bg-gradient-to-r from-primary to-green-400 rounded-full transition-all duration-100 ease-linear"
            style={{ width: `${fakeProgress}%` }}
          />
          {/* Glowing dot */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary/50 transition-all duration-100 ease-linear"
            style={{ left: `calc(${fakeProgress}% - 6px)` }}
          />
        </div>

        {/* Bottom controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/80 text-sm">
            {isPlaying ? (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Ao vivo
              </span>
            ) : (
              <span>Pausado</span>
            )}
          </div>

          {/* Mute button */}
          <button
            onClick={handleMuteToggle}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5 text-white" />
            ) : (
              <Volume2 className="h-5 w-5 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
