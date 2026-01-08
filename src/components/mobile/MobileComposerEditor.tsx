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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useQuery } from '@tanstack/react-query';
import { BaseMusical, getBases } from '@/services/basesMusicais/basesService';
import { AudioFile } from '@/services/drafts/types';
import { toast as sonnerToast } from 'sonner';
import { CollaborativeSessionModal } from '@/components/collaborative/CollaborativeSessionModal';

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
  onBaseChange?: (base: BaseMusical | null) => void;
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
  onRecordingChange,
  onBaseChange
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showBaseSelector, setShowBaseSelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCollaborativeModal, setShowCollaborativeModal] = useState(false);
  const [previewingBaseId, setPreviewingBaseId] = useState<string | null>(null);
  
  // Settings state with localStorage persistence
  const COMPOSER_SETTINGS_KEY = 'composer-panel-settings';
  
  const getInitialSettings = () => {
    try {
      const saved = localStorage.getItem(COMPOSER_SETTINGS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading composer settings:', e);
    }
    return { showMicButton: true, showPlayerToggle: true };
  };
  
  const initialSettings = getInitialSettings();
  const [showMicButton, setShowMicButton] = useState(initialSettings.showMicButton);
  const [showPlayerToggle, setShowPlayerToggle] = useState(initialSettings.showPlayerToggle);
  
  // Save settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(COMPOSER_SETTINGS_KEY, JSON.stringify({
        showMicButton,
        showPlayerToggle
      }));
    } catch (e) {
      console.error('Error saving composer settings:', e);
    }
  }, [showMicButton, showPlayerToggle]);
  const [isPlayerHidden, setIsPlayerHidden] = useState(false);
  
  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [markerA, setMarkerA] = useState<number | null>(null);
  const [markerB, setMarkerB] = useState<number | null>(null);
  const [isLooping, setIsLooping] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const { isDark, toggleTheme, setTheme } = useTheme();

  // Fetch available bases for selector
  const { data: availableBases = [] } = useQuery({
    queryKey: ['music-bases-list'],
    queryFn: getBases,
  });
  // Theme is now persisted - no automatic override

  // Prevent iOS Safari overscroll bounce (white bar issue)
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalLeft = document.body.style.left;
    const originalRight = document.body.style.right;
    const originalWidth = document.body.style.width;
    const originalHeight = document.body.style.height;
    const originalHtmlBg = document.documentElement.style.backgroundColor;
    const originalBodyBg = document.body.style.backgroundColor;

    // Lock body to prevent overscroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = '0';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    // Match background color to prevent white flash
    document.documentElement.style.backgroundColor = '#F3F4F6';
    document.body.style.backgroundColor = '#F3F4F6';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.left = originalLeft;
      document.body.style.right = originalRight;
      document.body.style.width = originalWidth;
      document.body.style.height = originalHeight;
      document.documentElement.style.backgroundColor = originalHtmlBg;
      document.body.style.backgroundColor = originalBodyBg;
    };
  }, []);

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

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || !selectedBase) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      // iOS/Safari can reject play() if the element isn't fully loaded yet.
      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('Erro ao tocar a base:', err);
      setIsPlaying(false);
      sonnerToast.error('Não foi possível tocar a base. Toque novamente no Play.');
    }
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
    if (!selectedBase) {
      sonnerToast.error('Selecione uma base primeiro');
      return;
    }
    
    if (type === 'A') {
      setMarkerA(currentTime);
      sonnerToast.success(`Marcador A definido em ${formatTime(currentTime)}`);
    } else {
      if (markerA !== null && currentTime <= markerA) {
        sonnerToast.error('Marcador B deve ser após o marcador A');
        return;
      }
      setMarkerB(currentTime);
      sonnerToast.success(`Marcador B definido em ${formatTime(currentTime)}`);
    }
  };

  const handleMarkButtonClick = () => {
    if (!selectedBase) {
      sonnerToast.error('Selecione uma base primeiro');
      return;
    }
    
    if (markerA === null) {
      // Define marcador A
      setMarker('A');
    } else if (markerB === null) {
      // Define marcador B
      setMarker('B');
    } else {
      // Ambos definidos, reseta e define A novamente
      setMarkerA(currentTime);
      setMarkerB(null);
      setIsLooping(false);
      sonnerToast.success(`Marcador A redefinido em ${formatTime(currentTime)}`);
    }
  };

  const clearMarkers = () => {
    setMarkerA(null);
    setMarkerB(null);
    setIsLooping(false);
    sonnerToast.info('Marcadores limpos');
  };

  const goToMarker = (type: 'A' | 'B') => {
    const marker = type === 'A' ? markerA : markerB;
    if (marker !== null && audioRef.current) {
      audioRef.current.currentTime = marker;
      setCurrentTime(marker);
    }
  };

  const handleToggleLoop = () => {
    if (markerA === null || markerB === null) {
      sonnerToast.error('Defina os marcadores A e B primeiro');
      return;
    }
    setIsLooping(!isLooping);
    if (!isLooping) {
      sonnerToast.success('Loop ativado entre A e B');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getBaseAudioUrl = () => {
    if (!selectedBase) return '';
    // Use file_url directly if available (already validated)
    return selectedBase.file_url || '';
  };

  const baseAudioUrl = getBaseAudioUrl();

  // iOS/Safari: ensure the audio element reloads the source when base changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Always keep playback rate in sync
    audio.playbackRate = playbackSpeed;

    // If no base or URL, stop/reset
    if (!selectedBase || !baseAudioUrl) {
      audio.pause();
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    // New base selected: reset and force reload
    audio.pause();
    setIsPlaying(false);
    audio.currentTime = 0;
    setCurrentTime(0);

    // Important on mobile: reload metadata for the new src
    audio.load();
  }, [selectedBase?.id, baseAudioUrl, playbackSpeed]);

  const handleSelectBase = (base: BaseMusical | null) => {
    // Stop any preview
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    setPreviewingBaseId(null);
    
    // Update selected base
    if (onBaseChange) {
      onBaseChange(base);
    }
    setShowBaseSelector(false);
    
    if (base) {
      sonnerToast.success(`Base "${base.name}" selecionada`);
    } else {
      sonnerToast.info('Composição sem base');
    }
  };

  const handlePreviewBase = (base: BaseMusical) => {
    if (!previewAudioRef.current) return;
    
    if (previewingBaseId === base.id) {
      // Stop preview
      previewAudioRef.current.pause();
      setPreviewingBaseId(null);
    } else {
      // Play this base
      previewAudioRef.current.src = base.file_url || '';
      previewAudioRef.current.play();
      setPreviewingBaseId(base.id);
    }
  };

  return (
    <div 
      className="fixed inset-0 flex flex-col bg-[#F3F4F6] dark:bg-[#0F172A] overflow-hidden"
      style={{ 
        overscrollBehavior: 'none',
        touchAction: 'pan-y pinch-zoom',
        WebkitOverflowScrolling: 'auto'
      }}
    >
      {/* Header - fixed at top */}
      <header className="flex-shrink-0 pt-12 pb-4 px-6 flex items-center justify-between bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-md z-20 border-b border-gray-200 dark:border-gray-800">
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
        
        <button 
          onClick={() => setShowSettings(true)}
          className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <span className="material-icons-round text-2xl text-gray-500 dark:text-gray-400">more_vert</span>
        </button>
      </header>


      {/* Main Content - ONLY this scrolls */}
      <main 
        className="flex-1 overflow-y-auto relative bg-white dark:bg-[#1E293B]"
        style={{ overscrollBehavior: 'contain' }}
      >
        <div className={`p-6 ${isPlayerHidden ? 'pb-10' : 'pb-24'}`}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            className="w-full bg-transparent border-none resize-none focus:ring-0 focus:outline-none text-lg leading-relaxed text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 font-sans overflow-visible"
            placeholder="Comece a escrever sua letra aqui..."
            style={{ minHeight: '50vh', height: 'auto' }}
            rows={15}
          />
        </div>
        
        {/* Floating Buttons Container */}
        <div className="fixed right-4 z-30 flex flex-col gap-3" style={{ top: '50%', transform: 'translateY(-50%)' }}>
          {/* Mic Button - conditionally shown */}
          {showMicButton && (
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
          )}
          
          {/* Toggle Player Button - conditionally shown */}
          {showPlayerToggle && (
            <button 
              onClick={() => setIsPlayerHidden(!isPlayerHidden)}
              className={`w-10 h-10 rounded-full shadow-lg border flex items-center justify-center transition hover:scale-110 ${
                isPlayerHidden 
                  ? 'bg-[#00C853] border-[#00C853]/50' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              <span className="material-icons-round text-xl text-gray-700 dark:text-gray-300">
                {isPlayerHidden ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          )}
        </div>
      </main>

      {/* Audio element always mounted to keep playing when panel is hidden */}
      {selectedBase && (
        <audio
          ref={audioRef}
          src={baseAudioUrl}
          preload="metadata"
          playsInline
          className="hidden"
        />
      )}

      {/* Audio Player Panel - fixed at bottom, hideable */}
      {!isPlayerHidden && (
      <div className="flex-shrink-0 bg-black border-t border-gray-800 pt-4 pb-8 px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] z-20">
        
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
              onClick={handleMarkButtonClick}
              disabled={!selectedBase}
              className={`flex items-center gap-1 px-3 py-2 border rounded-lg text-xs transition shadow-sm h-10 min-w-[80px] justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
                markerA !== null && markerB !== null
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-500 hover:bg-amber-500/30'
                  : 'bg-[#1A2130] border-gray-700/50 text-white hover:bg-gray-800'
              }`}
            >
              <span className="material-icons-round text-[16px]">
                {markerA !== null && markerB !== null ? 'refresh' : 'add'}
              </span>
              <span className="font-medium tracking-wide">
                {markerA === null ? 'A' : markerB === null ? 'B' : 'Reset'}
              </span>
            </button>
            
            <button 
              onClick={() => markerA !== null ? goToMarker('A') : null}
              onDoubleClick={() => setMarker('A')}
              disabled={!selectedBase}
              className={`w-10 h-10 flex items-center justify-center border text-xs font-bold rounded-full transition shadow-sm disabled:opacity-50 ${
                markerA !== null 
                  ? 'bg-[#00C853]/20 border-[#00C853]/50 text-[#00C853] hover:bg-[#00C853] hover:text-black' 
                  : 'bg-[#1A2130] border-[#00C853]/20 text-[#00C853]/50'
              }`}
            >
              A
            </button>
            
            <button 
              onClick={() => markerB !== null ? goToMarker('B') : null}
              onDoubleClick={() => setMarker('B')}
              disabled={!selectedBase}
              className={`w-10 h-10 flex items-center justify-center border text-xs font-bold rounded-full transition shadow-sm disabled:opacity-50 ${
                markerB !== null 
                  ? 'bg-red-500/20 border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white' 
                  : 'bg-[#1A2130] border-red-500/20 text-red-500/50'
              }`}
            >
              B
            </button>
            
            <button 
              onClick={handleToggleLoop}
              disabled={!selectedBase || markerA === null || markerB === null}
              className={`flex items-center gap-1 px-3 py-2 border rounded-lg text-xs transition shadow-sm h-10 min-w-[70px] justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
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
              onClick={() => setShowBaseSelector(true)}
              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition rounded-full hover:bg-gray-800/50"
            >
              <span className="material-icons-round text-2xl">library_music</span>
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Base Selector Sheet */}
      <Sheet open={showBaseSelector} onOpenChange={setShowBaseSelector}>
        <SheetContent side="bottom" className="h-[70vh] bg-[#0F172A] border-t border-gray-800 rounded-t-3xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-white text-lg font-bold">Selecionar Base Musical</SheetTitle>
          </SheetHeader>
          
          <audio ref={previewAudioRef} preload="metadata" onEnded={() => setPreviewingBaseId(null)} />
          
          <div className="overflow-y-auto max-h-[calc(70vh-100px)] space-y-2 pb-6">
            {/* Option: No base */}
            <button
              onClick={() => handleSelectBase(null)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl transition ${
                !selectedBase 
                  ? 'bg-[#00C853]/20 border border-[#00C853]/50' 
                  : 'bg-[#1E293B] hover:bg-[#334155]'
              }`}
            >
              <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center">
                <span className="material-icons-round text-gray-400">music_off</span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-medium">Sem base</p>
                <p className="text-gray-400 text-sm">Compor em branco</p>
              </div>
              {!selectedBase && (
                <span className="material-icons-round text-[#00C853]">check_circle</span>
              )}
            </button>

            {/* Available bases */}
            {availableBases.map((base) => (
              <div
                key={base.id}
                className={`w-full flex items-center gap-3 p-4 rounded-xl transition ${
                  selectedBase?.id === base.id 
                    ? 'bg-[#00C853]/20 border border-[#00C853]/50' 
                    : 'bg-[#1E293B] hover:bg-[#334155]'
                }`}
              >
                {/* Preview button */}
                <button
                  onClick={() => handlePreviewBase(base)}
                  className="w-12 h-12 rounded-lg bg-[#00C853]/20 flex items-center justify-center shrink-0"
                >
                  <span className="material-icons-round text-[#00C853]">
                    {previewingBaseId === base.id ? 'stop' : 'play_arrow'}
                  </span>
                </button>
                
                {/* Base info - click to select */}
                <button
                  onClick={() => handleSelectBase(base)}
                  className="flex-1 text-left"
                >
                  <p className="text-white font-medium">{base.name}</p>
                  <p className="text-gray-400 text-sm">{base.genre}</p>
                </button>
                
                {selectedBase?.id === base.id && (
                  <span className="material-icons-round text-[#00C853]">check_circle</span>
                )}
              </div>
            ))}

            {availableBases.length === 0 && (
              <div className="text-center py-8">
                <span className="material-icons-round text-4xl text-gray-600 mb-2">library_music</span>
                <p className="text-gray-400">Nenhuma base disponível</p>
                <button
                  onClick={() => {
                    setShowBaseSelector(false);
                    navigate('/dashboard/bases');
                  }}
                  className="mt-4 px-4 py-2 bg-[#00C853] rounded-lg text-black font-medium"
                >
                  Adicionar Bases
                </button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Settings Sheet */}
      <Sheet open={showSettings} onOpenChange={setShowSettings}>
        <SheetContent side="bottom" className="h-auto bg-[#0F172A] border-t border-gray-800 rounded-t-3xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-white text-lg font-bold">Configurações do Painel</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-4 pb-8">
            {/* Current Folder Info */}
            <div className="flex items-center justify-between p-4 bg-[#1E293B] rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#00C853]/20 flex items-center justify-center">
                  <span className="material-icons-round text-[#00C853]">folder_open</span>
                </div>
                <div>
                  <p className="text-white font-medium">Pasta</p>
                  <p className="text-gray-400 text-sm">{folderName || 'Sem pasta'}</p>
                </div>
              </div>
              <span className="material-icons-round text-gray-500">chevron_right</span>
            </div>

            {/* Partnership Button */}
            <button
              onClick={() => {
                setShowSettings(false);
                setShowCollaborativeModal(true);
              }}
              className="w-full flex items-center justify-between p-4 bg-[#1E293B] rounded-xl hover:bg-[#334155] transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <span className="material-icons-round text-blue-500">group_add</span>
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Compor em Parceria</p>
                  <p className="text-gray-400 text-sm">Criar ou entrar em sessão</p>
                </div>
              </div>
              <span className="material-icons-round text-gray-500">chevron_right</span>
            </button>

            {/* Divider */}
            <div className="border-t border-gray-700 my-2" />

            {/* Theme Toggle */}
            <div className="flex items-center justify-between p-4 bg-[#1E293B] rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <span className="material-icons-round text-purple-400">
                    {isDark ? 'dark_mode' : 'light_mode'}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">Modo Escuro</p>
                  <p className="text-gray-400 text-sm">Alternar tema da interface</p>
                </div>
              </div>
              <Switch
                checked={isDark}
                onCheckedChange={toggleTheme}
                className="data-[state=checked]:bg-[#00C853]"
              />
            </div>

            {/* Mic Button Toggle */}
            <div className="flex items-center justify-between p-4 bg-[#1E293B] rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <span className="material-icons-round text-red-500">mic</span>
                </div>
                <div>
                  <p className="text-white font-medium">Botão de Gravação</p>
                  <p className="text-gray-400 text-sm">Exibir ícone de microfone</p>
                </div>
              </div>
              <Switch
                checked={showMicButton}
                onCheckedChange={setShowMicButton}
                className="data-[state=checked]:bg-[#00C853]"
              />
            </div>

            {/* Player Toggle Button Setting */}
            <div className="flex items-center justify-between p-4 bg-[#1E293B] rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#00C853]/20 flex items-center justify-center">
                  <span className="material-icons-round text-[#00C853]">expand_more</span>
                </div>
                <div>
                  <p className="text-white font-medium">Ocultar Player</p>
                  <p className="text-gray-400 text-sm">Botão para esconder área inferior</p>
                </div>
              </div>
              <Switch
                checked={showPlayerToggle}
                onCheckedChange={setShowPlayerToggle}
                className="data-[state=checked]:bg-[#00C853]"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={() => {
                onSave();
                setShowSettings(false);
              }}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 p-4 bg-[#1E293B] rounded-xl text-white hover:bg-[#334155] transition disabled:opacity-50"
            >
              <span className="material-icons-round">save</span>
              <span className="font-medium">{isSaving ? 'Salvando...' : 'Salvar Rascunho'}</span>
            </button>

            {/* Delete Button */}
            <button
              className="w-full flex items-center justify-center gap-2 p-4 bg-red-500/10 rounded-xl text-red-500 hover:bg-red-500/20 transition"
            >
              <span className="material-icons-round">delete</span>
              <span className="font-medium">Excluir Rascunho</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

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

      {/* Collaborative Session Modal */}
      <CollaborativeSessionModal
        isOpen={showCollaborativeModal}
        onClose={() => setShowCollaborativeModal(false)}
        onSessionJoined={(session, draftId) => {
          setShowCollaborativeModal(false);
          // Navigate to the draft from the session
          navigate(`/dashboard/composer?draft=${draftId}`);
        }}
      />
    </div>
  );
};

export default MobileComposerEditor;
