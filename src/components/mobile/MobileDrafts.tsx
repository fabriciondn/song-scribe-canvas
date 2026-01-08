import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import * as draftService from '@/services/draftService';
import { Draft, AudioFile } from '@/services/drafts/types';
import { BaseMusical } from '@/services/basesMusicais/basesService';
import { getFolders, Folder } from '@/services/folderService';
import { AudioRecorder } from '@/components/drafts/AudioRecorder';
import { BasesSelector } from '@/components/drafts/BasesSelector';
import { MobileNewDraftSetup } from './MobileNewDraftSetup';
import { MobileComposerEditor } from './MobileComposerEditor';
import { toast as sonnerToast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Componente para Material Symbols
const MaterialIcon: React.FC<{ name: string; filled?: boolean; className?: string }> = ({ 
  name, 
  filled = false, 
  className = '' 
}) => (
  <span 
    className={`material-symbols-rounded ${className}`}
    style={{ 
      fontVariationSettings: filled ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"
    }}
  >
    {name}
  </span>
);

type ViewMode = 'list' | 'setup' | 'editor';

// Keys for localStorage auto-save
const AUTOSAVE_KEY = 'mobile_composer_autosave';

interface AutoSaveData {
  activeId: string | null;
  title: string;
  content: string;
  selectedFolderId: string | null;
  selectedBaseId: string | null;
  audioFiles: AudioFile[];
  timestamp: number;
}

export const MobileDrafts: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftIdFromUrl = searchParams.get('draft');
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>('setup');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Editor state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedBase, setSelectedBase] = useState<BaseMusical | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [audioBlobs, setAudioBlobs] = useState<Map<string, Blob>>(new Map());
  const [basePlayTrigger, setBasePlayTrigger] = useState(0);

  // Auto-save to localStorage when in editor mode
  useEffect(() => {
    if (viewMode === 'editor' && (title.trim() || content.trim())) {
      const autoSaveData: AutoSaveData = {
        activeId,
        title,
        content,
        selectedFolderId,
        selectedBaseId: selectedBase?.id || null,
        audioFiles: audioFiles.filter(f => !f.url.startsWith('blob:')), // Only save uploaded files
        timestamp: Date.now()
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(autoSaveData));
    }
  }, [viewMode, title, content, activeId, selectedFolderId, selectedBase, audioFiles]);

  // Restore from auto-save on mount
  useEffect(() => {
    const savedData = localStorage.getItem(AUTOSAVE_KEY);
    if (savedData) {
      try {
        const data: AutoSaveData = JSON.parse(savedData);
        // Only restore if less than 24 hours old
        const isRecent = Date.now() - data.timestamp < 24 * 60 * 60 * 1000;
        if (isRecent && (data.title.trim() || data.content.trim())) {
          setActiveId(data.activeId);
          setTitle(data.title);
          setContent(data.content);
          setSelectedFolderId(data.selectedFolderId);
          setAudioFiles(data.audioFiles || []);
          
          // Load the selected base if there was one
          if (data.selectedBaseId) {
            import('@/services/basesMusicais/basesService').then(({ getBaseById }) => {
              getBaseById(data.selectedBaseId!).then(base => {
                if (base) setSelectedBase(base);
              }).catch(() => {});
            });
          }
          
          setViewMode('editor');
        }
      } catch (e) {
        console.error('Error restoring auto-save:', e);
        localStorage.removeItem(AUTOSAVE_KEY);
      }
    }
  }, []);

  // Auto-save when page is hidden (minimized, tab switch, etc.)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden' && viewMode === 'editor') {
        // Trigger auto-save when app is minimized/hidden
        if (title.trim() || content.trim()) {
          await performAutoSave();
        }
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (viewMode === 'editor' && (title.trim() || content.trim())) {
        // Trigger sync save before unload
        performAutoSave();
        e.preventDefault();
        e.returnValue = '';
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [viewMode, title, content, activeId, selectedFolderId, selectedBase, audioFiles]);

  // Perform auto-save to database
  const performAutoSave = async () => {
    if (!title.trim() && !content.trim()) return;
    
    try {
      // Only save files that are already uploaded (not blob URLs)
      const uploadedFiles = audioFiles.filter(f => !f.url.startsWith('blob:'));
      
      if (activeId) {
        await draftService.updateDraft(activeId, {
          title: title || 'Rascunho sem título',
          content,
          audioFiles: uploadedFiles,
          selectedBaseId: selectedBase?.id || null,
          folderId: selectedFolderId
        });
      } else if (title.trim() || content.trim()) {
        // Create new draft if there's content
        const newDraft = await draftService.createDraft({
          title: title || 'Rascunho sem título',
          content,
          audioFiles: uploadedFiles,
          selectedBaseId: selectedBase?.id || null,
          folderId: selectedFolderId
        });
        setActiveId(newDraft.id);
        setDrafts(prev => [newDraft, ...prev]);
      }
      
      console.log('Auto-save completed');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/');
    } else if (isAuthenticated && !authLoading) {
      loadData();
    }
  }, [isAuthenticated, authLoading, navigate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedDrafts, fetchedFolders] = await Promise.all([
        draftService.getDrafts(),
        getFolders()
      ]);
      setDrafts(fetchedDrafts);
      setFolders(fetchedFolders);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar seus rascunhos.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load draft from URL parameter if present
  useEffect(() => {
    if (draftIdFromUrl && !isLoading && drafts.length > 0 && viewMode !== 'editor') {
      const draftFromUrl = drafts.find(d => d.id === draftIdFromUrl);
      if (draftFromUrl) {
        handleEditDraft(draftFromUrl);
      }
    }
  }, [draftIdFromUrl, isLoading, drafts, viewMode]);

  const handleNewDraft = () => {
    // Clear auto-save when starting fresh
    localStorage.removeItem(AUTOSAVE_KEY);
    setViewMode('setup');
  };

  const handleSetupContinue = (config: {
    title: string;
    folderId: string | null;
    selectedBase: BaseMusical | null;
  }) => {
    setTitle(config.title);
    setSelectedFolderId(config.folderId);
    setSelectedBase(config.selectedBase);
    setContent('');
    setAudioFiles([]);
    setAudioBlobs(new Map());
    setActiveId(null);
    setViewMode('editor');
  };

  const handleEditDraft = async (draft: Draft) => {
    setTitle(draft.title);
    setContent(draft.content);
    setSelectedFolderId(draft.folder_id || null);
    
    if (draft.audio_files && draft.audio_files.length > 0) {
      setAudioFiles(draft.audio_files);
    } else if (draft.audio_url) {
      setAudioFiles([{
        id: 'legacy_audio',
        name: 'Áudio 1',
        url: draft.audio_url,
        created_at: draft.created_at
      }]);
    } else {
      setAudioFiles([]);
    }
    
    if (draft.selected_base_id) {
      try {
        const { getBaseById } = await import('@/services/basesMusicais/basesService');
        const base = await getBaseById(draft.selected_base_id);
        setSelectedBase(base);
      } catch (error) {
        setSelectedBase(null);
      }
    } else {
      setSelectedBase(null);
    }
    
    setAudioBlobs(new Map());
    setActiveId(draft.id);
    setViewMode('editor');
  };

  const handleSaveRecordings = (newAudioFiles: AudioFile[]) => {
    const newBlobs = new Map<string, Blob>(audioBlobs);
    
    newAudioFiles.forEach(file => {
      if (file.url.startsWith('blob:') && !audioBlobs.has(file.url)) {
        fetch(file.url)
          .then(response => response.blob())
          .then(blob => {
            newBlobs.set(file.url, blob);
            setAudioBlobs(newBlobs);
          })
          .catch(error => console.error('Error fetching blob:', error));
      }
    });
    
    setAudioFiles(newAudioFiles);
  };

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      sonnerToast.error('Digite um título para o rascunho');
      return;
    }
    
    setIsSaving(true);
    
    try {
      let uploadedFiles: AudioFile[] = [];
      
      for (const file of audioFiles) {
        if (file.url.startsWith('blob:') && audioBlobs.has(file.url)) {
          const blob = audioBlobs.get(file.url);
          if (blob) {
            const safeFileName = `${file.id || 'audio'}_${Date.now()}.wav`.replace(/[^a-zA-Z0-9_.-]/g, '_');
            const uploadedUrl = await draftService.uploadAudio(blob, safeFileName);
            uploadedFiles.push({ ...file, url: uploadedUrl });
          }
        } else {
          uploadedFiles.push(file);
        }
      }
      
      if (activeId) {
        const updatedDraft = await draftService.updateDraft(activeId, {
          title,
          content,
          audioFiles: uploadedFiles,
          selectedBaseId: selectedBase?.id || null,
          folderId: selectedFolderId
        });
        
        setDrafts(drafts.map(d => d.id === activeId ? updatedDraft : d));
        sonnerToast.success('Rascunho atualizado!');
      } else {
        const newDraft = await draftService.createDraft({
          title,
          content,
          audioFiles: uploadedFiles,
          selectedBaseId: selectedBase?.id || null,
          folderId: selectedFolderId
        });
        
        setDrafts([newDraft, ...drafts]);
        setActiveId(newDraft.id);
        sonnerToast.success('Rascunho criado!');
      }
      
      // Clear auto-save after successful save
      localStorage.removeItem(AUTOSAVE_KEY);
      setViewMode('list');
    } catch (error) {
      console.error('Error saving draft:', error);
      sonnerToast.error('Erro ao salvar rascunho');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDraft = async (id: string) => {
    try {
      await draftService.deleteDraft(id);
      setDrafts(drafts.filter(d => d.id !== id));
      sonnerToast.success('Rascunho excluído');
    } catch (error) {
      sonnerToast.error('Erro ao excluir rascunho');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  };

  const getFolderName = (folderId: string | null) => {
    if (!folderId) return 'Sem pasta';
    const folder = folders.find(f => f.id === folderId);
    return folder?.name || 'Sem pasta';
  };

  // Render Setup Screen
  if (viewMode === 'setup') {
    return (
      <MobileNewDraftSetup
        onContinue={handleSetupContinue}
        onBack={() => setViewMode('list')}
      />
    );
  }

  // Render Editor Screen - using new MobileComposerEditor
  // Handle back from editor - auto-save before leaving
  const handleEditorBack = async () => {
    // Save before going back
    if (title.trim() || content.trim()) {
      await performAutoSave();
    }
    // Clear auto-save data since we're leaving intentionally
    localStorage.removeItem(AUTOSAVE_KEY);
    setViewMode('list');
  };

  if (viewMode === 'editor') {
    return (
      <MobileComposerEditor
        title={title}
        content={content}
        selectedBase={selectedBase}
        folderName={getFolderName(selectedFolderId)}
        audioFiles={audioFiles}
        isSaving={isSaving}
        onTitleChange={setTitle}
        onContentChange={setContent}
        onSave={handleSaveDraft}
        onBack={handleEditorBack}
        onRecordingChange={handleSaveRecordings}
        onBaseChange={setSelectedBase}
      />
    );
  }

  // Render List Screen
  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-['Outfit',sans-serif]">
      {/* Header */}
      <header className="px-6 pt-6 pb-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 -ml-2 rounded-full hover:bg-slate-800 transition-colors"
          >
            <MaterialIcon name="arrow_back" className="text-2xl text-slate-300" />
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleNewDraft}
              className="p-2 rounded-full bg-[#00C853] hover:bg-[#00B848] transition-colors"
            >
              <MaterialIcon name="add" className="text-xl text-white" />
            </button>
          </div>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-white">Compor</h1>
          <p className="text-slate-400 mt-1 text-sm">Seus rascunhos e ideias musicais</p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-6 pb-24 overflow-y-auto space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#00C853]" />
          </div>
        ) : drafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#1C1C1E] flex items-center justify-center mb-4">
              <MaterialIcon name="edit_note" className="text-4xl text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Nenhum rascunho</h3>
            <p className="text-slate-400 text-sm mb-6">
              Comece a compor sua primeira música!
            </p>
            <button
              onClick={handleNewDraft}
              className="px-6 py-3 rounded-xl bg-[#00C853] text-white font-semibold flex items-center gap-2"
            >
              <MaterialIcon name="add" />
              Novo Rascunho
            </button>
          </div>
        ) : (
          drafts.map((draft, index) => (
            <div 
              key={draft.id}
              className="bg-[#1C1C1E] rounded-2xl p-5 border border-slate-700/50"
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                  index % 4 === 0 ? 'bg-gradient-to-br from-[#8B5CF6] to-[#6366f1]' :
                  index % 4 === 1 ? 'bg-gradient-to-br from-[#EC4899] to-[#F43F5E]' :
                  index % 4 === 2 ? 'bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4]' :
                  'bg-gradient-to-br from-[#10B981] to-[#059669]'
                }`}>
                  <MaterialIcon name="music_note" filled className="text-white text-2xl" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white truncate">{draft.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatDate(draft.created_at || '')} • {getFolderName(draft.folder_id)}
                  </p>
                  {draft.content && (
                    <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                      {draft.content}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditDraft(draft)}
                    className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <MaterialIcon name="edit" className="text-slate-400 text-lg" />
                  </button>
                  <button
                    onClick={() => handleDeleteDraft(draft.id)}
                    className="p-2 rounded-lg hover:bg-red-900/30 transition-colors"
                  >
                    <MaterialIcon name="delete" className="text-red-400 text-lg" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};
