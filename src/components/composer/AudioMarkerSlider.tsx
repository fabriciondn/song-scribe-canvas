import React from 'react';
import { cn } from '@/lib/utils';

export interface Marker {
  id: string;
  time: number;
  label?: string;
  color: string;
}

interface AudioMarkerSliderProps {
  value: number;
  duration: number;
  markers: Marker[];
  loopStart: number | null;
  loopEnd: number | null;
  isLoopActive: boolean;
  onSeek: (time: number) => void;
  onAddMarker: (time: number) => void;
  onMarkerClick: (marker: Marker) => void;
  onMarkerRemove: (markerId: string) => void;
  className?: string;
}

export const AudioMarkerSlider: React.FC<AudioMarkerSliderProps> = ({
  value,
  duration,
  markers,
  loopStart,
  loopEnd,
  isLoopActive,
  onSeek,
  onAddMarker,
  onMarkerClick,
  onMarkerRemove,
  className
}) => {
  const trackRef = React.useRef<HTMLDivElement>(null);

  const getPositionPercent = (time: number) => {
    if (duration <= 0) return 0;
    return (time / duration) * 100;
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || duration <= 0) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    const newTime = percent * duration;
    onSeek(Math.max(0, Math.min(duration, newTime)));
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || duration <= 0) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    const newTime = percent * duration;
    onAddMarker(Math.max(0, Math.min(duration, newTime)));
  };

  const handleMarkerClick = (e: React.MouseEvent, marker: Marker) => {
    e.stopPropagation();
    onMarkerClick(marker);
  };

  const handleMarkerContextMenu = (e: React.MouseEvent, markerId: string) => {
    e.preventDefault();
    e.stopPropagation();
    onMarkerRemove(markerId);
  };

  const progressPercent = getPositionPercent(value);
  const loopStartPercent = loopStart !== null ? getPositionPercent(loopStart) : null;
  const loopEndPercent = loopEnd !== null ? getPositionPercent(loopEnd) : null;

  return (
    <div className={cn("relative w-full", className)}>
      {/* Main track container */}
      <div
        ref={trackRef}
        className="relative h-3 w-full cursor-pointer rounded-full bg-secondary"
        onClick={handleTrackClick}
        onDoubleClick={handleDoubleClick}
      >
        {/* Loop region highlight */}
        {isLoopActive && loopStartPercent !== null && loopEndPercent !== null && (
          <div
            className="absolute top-0 h-full rounded-full bg-green-500/20 pointer-events-none"
            style={{
              left: `${loopStartPercent}%`,
              width: `${loopEndPercent - loopStartPercent}%`
            }}
          />
        )}

        {/* Progress bar */}
        <div
          className="absolute top-0 left-0 h-full rounded-full bg-primary pointer-events-none"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Loop Start marker (A) */}
        {loopStart !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow-md z-20 cursor-pointer hover:scale-125 transition-transform"
            style={{ left: `calc(${loopStartPercent}% - 6px)` }}
            title="Ponto A (início do loop)"
          />
        )}

        {/* Loop End marker (B) */}
        {loopEnd !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-md z-20 cursor-pointer hover:scale-125 transition-transform"
            style={{ left: `calc(${loopEndPercent}% - 6px)` }}
            title="Ponto B (fim do loop)"
          />
        )}

        {/* Regular markers */}
        {markers.map((marker) => (
          <div
            key={marker.id}
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-background shadow-md z-10 cursor-pointer hover:scale-150 transition-transform"
            style={{
              left: `calc(${getPositionPercent(marker.time)}% - 5px)`,
              backgroundColor: marker.color
            }}
            onClick={(e) => handleMarkerClick(e, marker)}
            onContextMenu={(e) => handleMarkerContextMenu(e, marker.id)}
            title={marker.label || `Marcador: ${formatTime(marker.time)} (clique direito para remover)`}
          />
        ))}

        {/* Thumb/handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-background border-2 border-primary shadow-md z-30 pointer-events-none"
          style={{ left: `calc(${progressPercent}% - 8px)` }}
        />
      </div>

      {/* Marker hints */}
      <div className="mt-1 text-[10px] text-muted-foreground text-center">
        Duplo clique para adicionar marcador • Clique direito no marcador para remover
      </div>
    </div>
  );
};

function formatTime(time: number): string {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
