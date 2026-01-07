import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { BaseMusical } from '@/services/basesMusicais/basesService';
import { AudioFile } from '@/services/drafts/types';
import { toast as sonnerToast } from 'sonner';

interface MobileComposerEditorProps {
  title: string;
  content: string;
  selectedBase: BaseMusical | null;
  folderName: string;
  audioFiles: AudioFile[];
  isSaving: boolean;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onSave: () => void;
  onBack: () => void;
  onRecordingChange?: (files: AudioFile[]) => void;
}

export const MobileComposerEditor: React.FC<MobileComposerEditorProps> = ({
  title,
  content,
  selectedBase,
  folderName,
  audioFiles,
  isSaving,
  onTitleChange,
  onContentChange,
  onSave,
  onBack,
  onRecordingChange
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [markerA, setMarkerA] = useState<number | null>(null);
  const [markerB, setMarkerB] = useState<number | null>(null);
  const [isLooping, setIsLooping] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const { isDark, toggleTheme, setTheme } = useTheme();

  // Force light mode on mount
  useEffect(() => {
    setTheme('light');
  }, [setTheme]);

  // Audio controls
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      
      // Handle loop between markers
      if (isLooping && markerA !== null && markerB !== null) {
        if (audio.currentTime >= markerB) {
          audio.currentTime = markerA;
        }
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      if (isLooping && markerA !== null) {
        audio.currentTime = markerA;
        audio.play();
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isLooping, markerA, markerB]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !selectedBase) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const setMarker = (type: 'A' | 'B') => {
    if (type === 'A') {
      setMarkerA(currentTime);
      sonnerToast.success(`Marcador A definido em ${formatTime(currentTime)}`);
    } else {
      setMarkerB(currentTime);
      sonnerToast.success(`Marcador B definido em ${formatTime(currentTime)}`);
    }
  };

  const goToMarker = (type: 'A' | 'B') => {
    const marker = type === 'A' ? markerA : markerB;
    if (marker !== null && audioRef.current) {
      audioRef.current.currentTime = marker;
      setCurrentTime(marker);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getBaseAudioUrl = () => {
    if (!selectedBase) return '';
    return supabase.storage
      .from('music-bases')
      .getPublicUrl(selectedBase.file_path).data.publicUrl;
  };

  return (
    <div className="mx-auto max-w-md h-screen flex flex-col relative bg-[#F3F4F6] dark:bg-[#0F172A] overflow-hidden shadow-2xl">
      {/* Header */}
      <header className="pt-12 pb-4 px-6 flex items-center justify-between bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-md z-20 border-b border-gray-200 dark:border-gray-800">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <span className="material-icons-round text-2xl text-gray-500 dark:text-gray-400">arrow_back</span>
        </button>
        
        <div className="flex flex-col items-center">
          <span className="text-xs font-medium tracking-wider text-[#00C853] uppercase">
            Rascunho
          </span>
          {isEditingTitle ? (
            <Input
              ref={titleInputRef}
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              className="text-lg font-bold text-center bg-transparent border-none focus:ring-0 max-w-[180px] text-gray-900 dark:text-white"
              autoFocus
            />
          ) : (
            <button 
              onClick={() => setIsEditingTitle(true)}
              className="flex items-center gap-1 group cursor-pointer"
            >
              <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-[180px]">
                {title || 'Sem título'}
              </h1>
              <span className="material-icons-round text-sm text-gray-500 dark:text-gray-400 group-hover:text-[#00C853] transition">edit</span>
            </button>
          )}
        </div>
        
        <div className="flex items-center -mr-2">
          <button 
            onClick={toggleTheme}
            className="p-2 mr-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <span className="material-icons-round text-2xl text-gray-500 dark:text-gray-400 dark:hidden">dark_mode</span>
            <span className="material-icons-round text-2xl text-gray-500 dark:text-gray-400 hidden dark:block">light_mode</span>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <span className="material-icons-round text-2xl text-gray-500 dark:text-gray-400">more_vert</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-[#1E293B] border-gray-200 dark:border-gray-700">
              <DropdownMenuItem onClick={onSave} disabled={isSaving}>
                <span className="material-icons-round text-sm mr-2">save</span>
                {isSaving ? 'Salvando...' : 'Salvar'}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-500">
                <span className="material-icons-round text-sm mr-2">delete</span>
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Tags Bar */}
      <div className="px-4 py-3 flex items-center justify-center gap-3 overflow-x-auto no-scrollbar border-b border-gray-200 dark:border-gray-800 bg-[#F3F4F6] dark:bg-[#0F172A]">
        <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#1E293B] rounded-full shadow-sm border border-gray-200 dark:border-gray-700 whitespace-nowrap">
          <span className="material-icons-round text-[#00C853] text-sm">folder_open</span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {folderName || 'Sem pasta'}
          </span>
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#1E293B] rounded-full shadow-sm border border-gray-200 dark:border-gray-700 whitespace-nowrap">
          <span className="material-icons-round text-[#00C853] text-sm">group_add</span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Compor em parceria
          </span>
        </button>
      </div>

      {/* Main Content - Textarea */}
      <main className="flex-1 overflow-y-auto relative no-scrollbar bg-white dark:bg-[#1E293B]">
        <div className="p-6 min-h-full">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            className="w-full h-[60vh] bg-transparent border-none resize-none focus:ring-0 focus:outline-none text-lg leading-relaxed text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 font-sans"
            placeholder="Comece a escrever sua letra aqui..."
          />
          
          {/* Floating Mic Button */}
          <div className="fixed top-1/2 right-4 transform -translate-y-1/2 flex flex-col gap-3">
            <button 
              onClick={() => setIsRecording(!isRecording)}
              className={`w-10 h-10 rounded-full shadow-lg border flex items-center justify-center transition hover:scale-110 ${
                isRecording 
                  ? 'bg-red-500 border-red-400 animate-pulse' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              {isRecording ? (
                <span className="material-icons-round text-xl text-white">stop</span>
              ) : (
                <span className="material-icons-round text-xl text-red-500">mic</span>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Audio Player Panel */}
      <div className="bg-black border-t border-gray-800 pb-12 pt-4 px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] z-20">
        {selectedBase && (
          <audio 
            ref={audioRef} 
            src={getBaseAudioUrl()}
            preload="metadata"
          />
        )}
        
        <div className="flex flex-col gap-3">
          {/* Base name and speed controls */}
          <div className="flex justify-between items-center text-white/90">
            <div className="flex items-center gap-2">
              <span className="material-icons-round text-[#00C853] text-sm">music_note</span>
              <span className="text-xs font-semibold">
                {selectedBase?.name || 'Nenhuma base selecionada'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400">Vel:</span>
              <div className="flex bg-gray-900 rounded-md overflow-hidden border border-gray-800">
                {[0.75, 1, 1.25, 1.5].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={`px-1.5 py-0.5 text-[10px] transition ${
                      playbackSpeed === speed
                        ? 'bg-[#00C853] text-black font-bold'
                        : 'hover:bg-gray-800 text-gray-400'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Progress Slider */}
          <div className="relative w-full group">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-0 accent-[#00C853] z-10 relative"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between mt-4 w-full px-1">
            <button 
              onClick={() => setMarker(markerA === null ? 'A' : 'B')}
              className="flex items-center gap-1 px-3 py-2 bg-[#1A2130] border border-gray-700/50 rounded-lg text-xs text-white hover:bg-gray-800 transition shadow-sm h-10 min-w-[80px] justify-center"
            >
              <span className="material-icons-round text-[16px]">add</span>
              <span className="font-medium tracking-wide">Marcar</span>
            </button>
            
            <button 
              onClick={() => goToMarker('A')}
              onDoubleClick={() => setMarker('A')}
              className={`w-10 h-10 flex items-center justify-center border text-xs font-bold rounded-full transition shadow-sm ${
                markerA !== null 
                  ? 'bg-[#00C853]/20 border-[#00C853]/50 text-[#00C853]' 
                  : 'bg-[#1A2130] border-[#00C853]/20 text-[#00C853]'
              } hover:bg-[#00C853] hover:text-black`}
            >
              A
            </button>
            
            <button 
              onClick={() => goToMarker('B')}
              onDoubleClick={() => setMarker('B')}
              className={`w-10 h-10 flex items-center justify-center border text-xs font-bold rounded-full transition shadow-sm ${
                markerB !== null 
                  ? 'bg-red-500/20 border-red-500/50 text-red-500' 
                  : 'bg-[#1A2130] border-red-500/20 text-red-500'
              } hover:bg-red-500 hover:text-white`}
            >
              B
            </button>
            
            <button 
              onClick={() => setIsLooping(!isLooping)}
              className={`flex items-center gap-1 px-3 py-2 border rounded-lg text-xs transition shadow-sm h-10 min-w-[70px] justify-center ${
                isLooping 
                  ? 'bg-[#00C853]/20 border-[#00C853]/50 text-[#00C853]' 
                  : 'bg-[#1A2130] border-gray-700/50 text-white hover:bg-gray-800'
              }`}
            >
              <span className="material-icons-round text-[16px]">loop</span>
              <span className="font-medium tracking-wide">Loop</span>
            </button>
            
            <button 
              onClick={togglePlayPause}
              disabled={!selectedBase}
              className="w-12 h-12 rounded-full bg-[#00C853] flex items-center justify-center shadow-lg hover:bg-[#009624] active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPlaying ? (
                <span className="material-icons-round text-black text-3xl">pause</span>
              ) : (
                <span className="material-icons-round text-black text-3xl ml-1">play_arrow</span>
              )}
            </button>
            
            <button 
              onClick={() => navigate('/dashboard/bases')}
              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition rounded-full hover:bg-gray-800/50"
            >
              <span className="material-icons-round text-2xl">library_music</span>
            </button>
          </div>
        </div>
      </div>

      {/* Background Effects */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 bg-[#F3F4F6] dark:bg-[#0F172A] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#00C853]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Custom Slider Styles */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        input[type=range] {
          -webkit-appearance: none;
          width: 100%;
          background: transparent;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #00C853;
          cursor: pointer;
          margin-top: -4px;
          border: 2px solid #1E293B;
        }
        input[type=range]::-webkit-slider-runnable-track {
          width: 100%;
          height: 4px;
          cursor: pointer;
          background: #334155;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
};

export default MobileComposerEditor;
