import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getDraftById, updateDraft, createDraft } from '@/services/drafts/draftService';
import { Draft } from '@/services/drafts/types';
import { supabase } from '@/integrations/supabase/client';

interface MusicBase {
  id: string;
  name: string;
  file_path: string;
  genre: string;
}

export const MobileComposerPanel: React.FC = () => {
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draft');
  
  const [title, setTitle] = useState('Nova Ideia #4');
  const [content, setContent] = useState('');
  const [folderName, setFolderName] = useState('Pop / Rock');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<Draft | null>(null);
  
  // Audio player state
  const [selectedBase, setSelectedBase] = useState<MusicBase | null>({
    id: '1',
    name: 'Base 1 - Natanzinho',
    file_path: '',
    genre: 'Pop'
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(174); // 2:54 in seconds
  const [markerA, setMarkerA] = useState<number | null>(null);
  const [markerB, setMarkerB] = useState<number | null>(null);
  const [isLooping, setIsLooping] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isDark, toggleTheme, setTheme } = useTheme();

  // Force light mode on mount
  useEffect(() => {
    setTheme('light');
  }, [setTheme]);

  // Load draft if ID is provided
  useEffect(() => {
    if (draftId && isAuthenticated) {
      loadDraft(draftId);
    }
  }, [draftId, isAuthenticated]);

  const loadDraft = async (id: string) => {
    try {
      const draft = await getDraftById(id);
      if (draft) {
        setCurrentDraft(draft);
        setTitle(draft.title);
        setContent(draft.content);
        
        // Load base if selected
        if (draft.selected_base_id) {
          const { data: base } = await supabase
            .from('music_bases')
            .select('*')
            .eq('id', draft.selected_base_id)
            .single();
          if (base) {
            setSelectedBase(base as MusicBase);
          }
        }
        
        // Load folder name
        if (draft.folder_id) {
          const { data: folder } = await supabase
            .from('folders')
            .select('name')
            .eq('id', draft.folder_id)
            .single();
          if (folder) {
            setFolderName(folder.name);
          }
        }
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

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
      toast({ title: 'Marcador A definido', description: `em ${formatTime(currentTime)}` });
    } else {
      setMarkerB(currentTime);
      toast({ title: 'Marcador B definido', description: `em ${formatTime(currentTime)}` });
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

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: 'Título obrigatório', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      if (currentDraft) {
        await updateDraft(currentDraft.id, { title, content });
      } else {
        const newDraft = await createDraft({ title, content });
        setCurrentDraft(newDraft);
      }
      toast({ title: 'Salvo com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/dashboard/folders');
  };

  const getBaseAudioUrl = () => {
    if (!selectedBase || !selectedBase.file_path) return '';
    return supabase.storage
      .from('music-bases')
      .getPublicUrl(selectedBase.file_path).data.publicUrl;
  };

  return (
    <div className="mx-auto max-w-md h-screen flex flex-col relative bg-[#F3F4F6] dark:bg-[#0F172A] overflow-hidden shadow-2xl">
      {/* Background - Simplified for performance */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 bg-[#F3F4F6] dark:bg-[#0F172A] pointer-events-none" />

      {/* Header - Exact match to HTML */}
      <header className="pt-12 pb-4 px-6 flex items-center justify-between bg-[#FFFFFF]/[0.97] dark:bg-[#1E293B]/[0.97] z-20 border-b border-gray-200 dark:border-gray-800">
        <button 
          onClick={handleBack}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <span className="material-icons-round text-2xl text-[#6B7280] dark:text-[#94A3B8]">arrow_back</span>
        </button>
        
        <div className="flex flex-col items-center">
          <span className="text-xs font-medium tracking-wider text-[#00C853] uppercase">Rascunho</span>
          {isEditingTitle ? (
            <Input
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              className="text-lg font-bold text-center bg-transparent border-none focus:ring-0 max-w-[180px]"
              autoFocus
            />
          ) : (
            <div 
              onClick={() => setIsEditingTitle(true)}
              className="flex items-center gap-1 group cursor-pointer"
            >
              <h1 className="text-lg font-bold text-[#111827] dark:text-[#F9FAFB] truncate max-w-[180px]">{title}</h1>
              <span className="material-icons-round text-sm text-[#6B7280] dark:text-[#94A3B8] group-hover:text-[#00C853] transition">edit</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center -mr-2">
          <button 
            onClick={toggleTheme}
            className="p-2 mr-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <span className="material-icons-round text-2xl text-[#6B7280] dark:text-[#94A3B8] dark:hidden">dark_mode</span>
            <span className="material-icons-round text-2xl text-[#6B7280] dark:text-[#94A3B8] hidden dark:block">light_mode</span>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <span className="material-icons-round text-2xl text-[#6B7280] dark:text-[#94A3B8]">more_vert</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-[#1E293B] border-gray-200 dark:border-gray-700">
              <DropdownMenuItem onClick={handleSave}>
                <span className="material-icons-round text-base mr-2">save</span>
                Salvar
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-500">
                <span className="material-icons-round text-base mr-2">delete</span>
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Tags Bar - Exact match to HTML */}
      <div className="px-4 py-3 flex items-center justify-center gap-3 overflow-x-auto no-scrollbar border-b border-gray-200 dark:border-gray-800 bg-[#F3F4F6] dark:bg-[#0F172A]">
        <button className="flex items-center gap-2 px-3 py-1.5 bg-[#FFFFFF] dark:bg-[#1E293B] rounded-full shadow-sm border border-gray-200 dark:border-gray-700 whitespace-nowrap">
          <span className="material-icons-round text-[#00C853] text-sm">folder_open</span>
          <span className="text-xs font-medium text-[#6B7280] dark:text-[#94A3B8]">{folderName || 'Pop / Rock'}</span>
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-[#FFFFFF] dark:bg-[#1E293B] rounded-full shadow-sm border border-gray-200 dark:border-gray-700 whitespace-nowrap">
          <span className="material-icons-round text-[#00C853] text-sm">group_add</span>
          <span className="text-xs font-medium text-[#6B7280] dark:text-[#94A3B8]">Compor em parceria</span>
        </button>
      </div>

      {/* Main Content - Textarea - Exact match to HTML */}
      <main className="flex-1 overflow-y-auto relative no-scrollbar bg-[#FFFFFF] dark:bg-[#1E293B]">
        <div className="p-6 min-h-full">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-[60vh] bg-transparent border-none resize-none focus:ring-0 focus:outline-none text-lg leading-relaxed text-[#111827] dark:text-[#F9FAFB] placeholder-gray-400 dark:placeholder-gray-600 font-sans"
            placeholder="Comece a escrever sua letra aqui..."
          />
          
          {/* Floating Mic Button - Exact match: w-10 h-10, text-xl */}
          <div className="fixed top-1/2 right-4 transform -translate-y-1/2 flex flex-col gap-3">
            <button 
              onClick={() => setIsRecording(!isRecording)}
              className={`w-10 h-10 rounded-full shadow-lg border flex items-center justify-center transition hover:scale-110 ${
                isRecording 
                  ? 'bg-red-500 border-red-400 animate-pulse' 
                  : 'bg-[#FFFFFF] dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              <span className={`material-icons-round text-xl ${isRecording ? 'text-white' : 'text-red-500'}`}>
                {isRecording ? 'stop' : 'mic'}
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* Audio Player Panel - Exact match to HTML */}
      <div className="bg-black border-t border-gray-800 pb-12 pt-4 px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] z-20">
        {selectedBase && selectedBase.file_path && (
          <audio 
            ref={audioRef} 
            src={getBaseAudioUrl()}
            preload="metadata"
          />
        )}
        
        <div className="flex flex-col gap-3">
          {/* Base name and speed controls - Exact match */}
          <div className="flex justify-between items-center text-white/90">
            <div className="flex items-center gap-2">
              <span className="material-icons-round text-[#00C853] text-sm">music_note</span>
              <span className="text-xs font-semibold">{selectedBase?.name || 'Base 1 - Natanzinho'}</span>
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

          {/* Progress Slider - Exact match */}
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

          {/* Control Buttons - Exact match to HTML */}
          <div className="flex items-center justify-between mt-4 w-full px-1">
            {/* Marcar button - h-10 min-w-[80px], icon text-[16px] */}
            <button 
              onClick={() => setMarker(currentTime === markerA ? 'B' : 'A')}
              className="flex items-center gap-1 px-3 py-2 bg-[#1A2130] border border-gray-700/50 rounded-lg text-xs text-white hover:bg-gray-800 transition shadow-sm h-10 min-w-[80px] justify-center"
            >
              <span className="material-icons-round text-[16px]">add</span>
              <span className="font-medium tracking-wide">Marcar</span>
            </button>
            
            {/* A button - w-10 h-10, text-xs font-bold */}
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
            
            {/* B button - w-10 h-10, text-xs font-bold */}
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
            
            {/* Loop button - h-10 min-w-[70px], icon text-[16px] */}
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
            
            {/* Play button - w-12 h-12, icon text-3xl ml-1 */}
            <button 
              onClick={togglePlayPause}
              className="w-12 h-12 rounded-full bg-[#00C853] flex items-center justify-center shadow-lg hover:bg-[#009624] active:scale-95 transition"
            >
              <span className="material-icons-round text-black text-3xl ml-1">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>
            
            {/* Library button - w-10 h-10, icon text-2xl */}
            <button 
              onClick={() => navigate('/dashboard/bases')}
              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white transition rounded-full hover:bg-gray-800/50"
            >
              <span className="material-icons-round text-2xl">library_music</span>
            </button>
          </div>
        </div>
      </div>

      {/* Custom CSS for range slider and no-scrollbar */}
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

export default MobileComposerPanel;
