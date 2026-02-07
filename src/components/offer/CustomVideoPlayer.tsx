import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface CustomVideoPlayerProps {
  videoUrl: string;
  onPlay?: () => void;
  onProgress?: (watchTime: number, percentComplete: number) => void;
  onComplete?: () => void;
  /** Se true, mostra overlay de "clique para ativar som" antes de liberar o áudio */
  useSoundOverlay?: boolean;
  /** Altura da barra de progresso em pixels */
  progressBarHeight?: number;
}

/**
 * Calcula o progresso visual "inteligente":
 * - Começa rápido (parece que vai acabar logo)
 * - Desacelera quando chega perto de 50%
 * - Vai devagar até o final do vídeo
 */
const calculateSmartProgress = (realPercent: number): number => {
  if (realPercent <= 0) return 0;
  if (realPercent >= 100) return 100;

  // Fase 1: 0-30% do vídeo real → mostra 0-60% visual (rápido)
  if (realPercent <= 30) {
    return (realPercent / 30) * 60;
  }
  
  // Fase 2: 30-60% do vídeo real → mostra 60-80% visual (médio)
  if (realPercent <= 60) {
    return 60 + ((realPercent - 30) / 30) * 20;
  }
  
  // Fase 3: 60-100% do vídeo real → mostra 80-100% visual (lento)
  return 80 + ((realPercent - 60) / 40) * 20;
};

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
  const [isMuted, setIsMuted] = useState(false); // Começa com som ligado
  const [showSoundOverlay, setShowSoundOverlay] = useState(false);
  const [visualProgress, setVisualProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const watchTimeRef = useRef(0);
  const hasTrackedPlay = useRef(false);
  const hasTrackedComplete = useRef(false);

  // Atualiza o progresso visual baseado no tempo real do vídeo
  const updateProgress = useCallback(() => {
    const video = videoRef.current;
    if (!video || !videoDuration) return;

    const realPercent = (video.currentTime / videoDuration) * 100;
    const smartPercent = calculateSmartProgress(realPercent);
    setVisualProgress(smartPercent);
  }, [videoDuration]);

  // Listener para timeupdate do vídeo
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      updateProgress();
    };

    const handleLoadedMetadata = () => {
      setVideoDuration(video.duration);
    };

    const handleEnded = () => {
      // Quando o vídeo termina (antes do loop), marca 100%
      setVisualProgress(100);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    // Se já tiver duração disponível
    if (video.duration) {
      setVideoDuration(video.duration);
    }

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [updateProgress]);

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
    setVisualProgress(0);

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

  // Tenta autoplay COM SOM - se falhar, mostra overlay
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const attemptAutoplay = async () => {
      // Primeiro tenta com som
      video.muted = false;
      setIsMuted(false);
      
      try {
        await video.play();
        setIsPlaying(true);
        // Sucesso! Não precisa de overlay
        setShowSoundOverlay(false);
        
        if (!hasTrackedPlay.current) {
          onPlay?.();
          hasTrackedPlay.current = true;
        }
      } catch {
        // Autoplay com som bloqueado - tenta mutado e mostra overlay se configurado
        video.muted = true;
        setIsMuted(true);
        
        try {
          await video.play();
          setIsPlaying(true);
          // Mostra overlay apenas se useSoundOverlay estiver ativado
          setShowSoundOverlay(useSoundOverlay);
        } catch {
          // Autoplay totalmente bloqueado
          setShowSoundOverlay(true);
        }
      }
    };

    attemptAutoplay();
  }, [videoUrl, useSoundOverlay, onPlay]);

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

      {/* Smart progress bar - baseada no tempo real do vídeo */}
      <div 
        className="absolute bottom-0 left-0 right-0 bg-white/20 overflow-hidden z-20"
        style={{ height: `${progressBarHeight}px` }}
      >
        <div 
          className="h-full bg-gradient-to-r from-primary to-green-400 transition-all duration-300 ease-out"
          style={{ width: `${visualProgress}%` }}
        />
      </div>

      {/* Controls overlay (bottom) - acima da barra de progresso */}
      {!showSoundOverlay && (
        <div 
          className="absolute left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent"
          style={{ bottom: `${progressBarHeight}px` }}
        >
          <div className="flex items-center justify-end">

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
