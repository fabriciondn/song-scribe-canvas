import React, { useState, useRef, useEffect } from 'react';
import { Play, Volume2, VolumeX } from 'lucide-react';

interface CustomVideoPlayerProps {
  videoUrl: string;
  onPlay?: () => void;
  onProgress?: (watchTime: number, percentComplete: number) => void;
  onComplete?: () => void;
  /** Se true, mostra overlay de "clique para ativar som" antes de liberar o áudio */
  useSoundOverlay?: boolean;
  /** Altura da barra de progresso fake em pixels */
  progressBarHeight?: number;
}

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  videoUrl,
  onPlay,
  onProgress,
  onComplete,
  useSoundOverlay = true,
  progressBarHeight = 6
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showSoundOverlay, setShowSoundOverlay] = useState(useSoundOverlay);
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

  const handleOverlayClick = () => {
    const video = videoRef.current;
    if (!video) return;

    // Ativar som e reiniciar do início
    video.currentTime = 0;
    video.muted = false;
    setIsMuted(false);
    video.play();
    setIsPlaying(true);
    setShowSoundOverlay(false);

    if (!hasTrackedPlay.current) {
      onPlay?.();
      hasTrackedPlay.current = true;
    }
  };

  const handleVideoClick = () => {
    const video = videoRef.current;
    if (!video || showSoundOverlay) return;

    // Toggle play/pause
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  // Start video muted on load (autoplay)
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      setIsMuted(true);
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // Autoplay blocked
      });
    }
  }, [videoUrl]);

  // Sync overlay state with prop
  useEffect(() => {
    setShowSoundOverlay(useSoundOverlay);
  }, [useSoundOverlay]);

  return (
    <div 
      className="relative w-full max-w-3xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-2xl border-2 border-primary/30 cursor-pointer group"
      onClick={showSoundOverlay ? handleOverlayClick : handleVideoClick}
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

      {/* Overlay de "clique para ativar som" - estilo amarelo/preto */}
      {showSoundOverlay && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 transition-opacity z-10">
          <div className="border-4 border-yellow-400 rounded-lg p-8 flex flex-col items-center gap-4">
            <p className="text-yellow-400 text-xl font-bold">Clique aqui</p>
            <div className="relative">
              <VolumeX className="h-16 w-16 text-yellow-400" />
              {/* Linha diagonal riscando o ícone */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-1 bg-yellow-400 rotate-45 origin-center" />
              </div>
            </div>
            <p className="text-yellow-400 text-xl font-bold">para ativar o som</p>
          </div>
        </div>
      )}

      {/* Fake progress bar - colada na parte inferior, mais grossa */}
      <div 
        className="absolute bottom-0 left-0 right-0 bg-white/20 overflow-hidden z-20"
        style={{ height: `${progressBarHeight}px` }}
      >
        <div 
          className="h-full bg-gradient-to-r from-primary to-green-400 transition-all duration-100 ease-linear"
          style={{ width: `${fakeProgress}%` }}
        />
      </div>

      {/* Controls overlay (bottom) - acima da barra de progresso */}
      {!showSoundOverlay && (
        <div 
          className="absolute left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent"
          style={{ bottom: `${progressBarHeight}px` }}
        >
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
      )}
    </div>
  );
};
