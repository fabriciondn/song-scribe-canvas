import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Save, Loader2, Folder, FolderOpen, ChevronDown, ChevronRight, FolderInput, Users } from 'lucide-react';
import { AudioRecorder } from '../components/drafts/AudioRecorder';
import { BasesSelector } from '../components/drafts/BasesSelector';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import * as draftService from '../services/draftService';
import { Skeleton } from '@/components/ui/skeleton';
import { Draft, AudioFile } from '../services/drafts/types';
import { prepareAudioFilesForStorage } from '../services/drafts/audioService';
import { ProOnlyWrapper } from '@/components/layout/ProOnlyWrapper';
import { BaseMusical } from '@/services/basesMusicais/basesService';
import { getFolders, createFolder, Folder as FolderType } from '@/services/folderService';
import { CollaborativeSessionModal } from '@/components/collaborative/CollaborativeSessionModal';
import { CollaborativeHeader } from '@/components/collaborative/CollaborativeHeader';
import { useCollaborativeSession } from '@/hooks/useCollaborativeSession';
import { 
  CollaborativeSession, 
  getActiveSessionForDraft,
  endSession as endCollaborativeSession,
  leaveSession as leaveCollaborativeSession,
  getUserActiveSessions
} from '@/services/collaborativeSessionService';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileDraftsPage } from '@/components/mobile/MobileDraftsPage';

const Drafts: React.FC = () => {
  const isMobile = useIsMobile();
  
  // No mobile, usar o MobileDraftsPage que tem o design correto com pastas + rascunhos
  if (isMobile) {
    return <MobileDraftsPage />;
  }

  return <DesktopDrafts />;
};

const DesktopDrafts: React.FC = () => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedBase, setSelectedBase] = useState<BaseMusical | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  
  // Estados para modal de nova pasta
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // Estado para controlar pastas expandidas
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['unorganized']));
  
  // Novo estado para gerenciar múltiplos arquivos de áudio
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [audioBlobs, setAudioBlobs] = useState<Map<string, Blob>>(new Map());

  // Estado para trigger de play da base (auto-play ao gravar)
  const [basePlayTrigger, setBasePlayTrigger] = useState(0);

  // Estados para sessão colaborativa
  const [isCollaborativeModalOpen, setIsCollaborativeModalOpen] = useState(false);
  const [collaborativeSession, setCollaborativeSession] = useState<CollaborativeSession | null>(null);
  const [collaborativeDraftId, setCollaborativeDraftId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Hook de sessão colaborativa
  const handleDraftUpdate = useCallback((updatedDraft: Partial<Draft>) => {
    // Atualizar o conteúdo quando outro participante editar
    if (updatedDraft.title !== undefined && updatedDraft.title !== title) {
      setTitle(updatedDraft.title);
    }
    if (updatedDraft.content !== undefined && updatedDraft.content !== content) {
      setContent(updatedDraft.content);
    }
    // Atualizar lista de drafts
    setDrafts(prev => prev.map(d => 
      d.id === updatedDraft.id ? { ...d, ...updatedDraft } : d
    ));
  }, [title, content]);

  const { 
    participants, 
    isConnected, 
    isHost 
  } = useCollaborativeSession({
    session: collaborativeSession,
    draftId: collaborativeDraftId,
    onDraftUpdate: handleDraftUpdate
  });
  
  // Check authentication and load drafts and folders
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/');
      toast({
        title: 'Acesso negado',
        description: 'Você precisa estar logado para acessar esta página.',
        variant: 'destructive',
      });
    } else if (isAuthenticated && !authLoading) {
      loadData();
      checkAndReconnectActiveSessions();
    }
  }, [isAuthenticated, authLoading, navigate, toast]);

  // Verificar e reconectar a sessões colaborativas ativas automaticamente
  const checkAndReconnectActiveSessions = async () => {
    try {
      const activeSessions = await getUserActiveSessions();
      if (activeSessions.length > 0) {
        const activeSession = activeSessions[0];
        setCollaborativeSession(activeSession);
        setCollaborativeDraftId(activeSession.draft_id);
        
        // Carregar o draft da sessão ativa
        const draft = await draftService.getDraftById(activeSession.draft_id);
        if (draft) {
          startEditingDraft(draft);
          toast({
            title: 'Sessão colaborativa reconectada',
            description: 'Você foi reconectado à sua sessão ativa.',
          });
        }
      }
    } catch (error) {
      console.error('Erro ao verificar sessões ativas:', error);
    }
  };
  
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
        description: 'Não foi possível carregar seus rascunhos e pastas.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };
  
  const handleAddFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: 'Nome inválido',
        description: 'Por favor, insira um nome para a pasta.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const newFolder = await createFolder(newFolderName);
      setFolders(prev => [newFolder, ...prev]);
      setNewFolderName('');
      setIsNewFolderModalOpen(false);
      
      toast({
        title: 'Pasta criada',
        description: `A pasta "${newFolderName}" foi criada com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao criar pasta:', error);
      toast({
        title: 'Erro ao criar pasta',
        description: 'Não foi possível criar a pasta.',
        variant: 'destructive',
      });
    }
  };
  
  // Agrupar rascunhos por pasta
  const getDraftsByFolder = () => {
    const grouped: Record<string, Draft[]> = { unorganized: [] };
    
    folders.forEach(folder => {
      grouped[folder.id] = [];
    });
    
    drafts.forEach(draft => {
      if (draft.folder_id && grouped[draft.folder_id]) {
        grouped[draft.folder_id].push(draft);
      } else {
        grouped.unorganized.push(draft);
      }
    });
    
    return grouped;
  };
  
  const draftsByFolder = getDraftsByFolder();
  
  const startNewDraft = () => {
    setTitle('');
    setContent('');
    setAudioFiles([]);
    setAudioBlobs(new Map());
    setSelectedBase(null);
    setSelectedFolderId(null);
    setActiveId(null);
    setIsEditing(true);
  };
  
  const startEditingDraft = async (draft: Draft) => {
    setTitle(draft.title);
    setContent(draft.content);
    setSelectedFolderId(draft.folder_id || null);
    
    // Inicializar os arquivos de áudio do rascunho
    if (draft.audio_files && draft.audio_files.length > 0) {
      setAudioFiles(draft.audio_files);
    } else if (draft.audio_url) {
      // Para compatibilidade com rascunhos anteriores que só tinham uma URL de áudio
      setAudioFiles([{
        id: 'legacy_audio',
        name: 'Áudio 1',
        url: draft.audio_url,
        created_at: draft.created_at
      }]);
    } else {
      setAudioFiles([]);
    }
    
    // Carregar a base musical associada ao rascunho
    if (draft.selected_base_id) {
      try {
        const { getBaseById } = await import('@/services/basesMusicais/basesService');
        const base = await getBaseById(draft.selected_base_id);
        setSelectedBase(base);
      } catch (error) {
        console.error('Erro ao carregar base associada:', error);
        setSelectedBase(null);
      }
    } else {
      setSelectedBase(null);
    }
    
    setAudioBlobs(new Map());
    setActiveId(draft.id);
    setIsEditing(true);
  };
  
  const handleSaveRecordings = (newAudioFiles: AudioFile[]) => {
    // Extrair os blobs dos novos arquivos (URLs temporárias que começam com blob:)
    const newBlobs = new Map<string, Blob>(audioBlobs);
    
    newAudioFiles.forEach(file => {
      if (file.url.startsWith('blob:') && !audioBlobs.has(file.url)) {
        // Fazer fetch do blob a partir da URL temporária
        fetch(file.url)
          .then(response => response.blob())
          .then(blob => {
            newBlobs.set(file.url, blob);
            setAudioBlobs(newBlobs);
          })
          .catch(error => {
            console.error('Error fetching blob from URL:', error);
          });
      }
    });
    
    setAudioFiles(newAudioFiles);
  };
  
  const handleSaveDraft = async () => {
    if (!title.trim()) {
      toast({
        title: 'Título obrigatório',
        description: 'Por favor, insira um título para o rascunho.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      let uploadedFiles: AudioFile[] = [];
      
      // Processar cada arquivo de áudio com blob
      for (const file of audioFiles) {
        // Se a URL é temporária (blob:), precisamos fazer upload
        if (file.url.startsWith('blob:') && audioBlobs.has(file.url)) {
          const blob = audioBlobs.get(file.url);
          if (blob) {
            const safeFileName = `${file.id || 'audio'}_${Date.now()}.wav`.replace(/[^a-zA-Z0-9_.-]/g, '_');
            const uploadedUrl = await draftService.uploadAudio(blob, safeFileName);
            
            uploadedFiles.push({
              ...file,
              url: uploadedUrl
            });
          }
        } else {
          // URL já é permanente, manter como está
          uploadedFiles.push(file);
        }
      }
      
      if (activeId) {
        // Update existing draft
        const updatedDraft = await draftService.updateDraft(activeId, {
          title,
          content,
          audioFiles: uploadedFiles,
          selectedBaseId: selectedBase?.id || null,
          folderId: selectedFolderId
        });
        
        setDrafts(drafts.map(d => d.id === activeId ? updatedDraft : d));
        
        toast({
          title: 'Rascunho atualizado',
          description: `O rascunho "${title}" foi atualizado com sucesso.`,
        });
      } else {
        // Create new draft
        const newDraft = await draftService.createDraft({
          title,
          content,
          audioFiles: uploadedFiles,
          selectedBaseId: selectedBase?.id || null,
          folderId: selectedFolderId
        });
        
        setDrafts([newDraft, ...drafts]);
        
        toast({
          title: 'Rascunho criado',
          description: `O rascunho "${title}" foi criado com sucesso.`,
        });
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar o rascunho. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteDraft = async (id: string) => {
    try {
      await draftService.deleteDraft(id);
      setDrafts(drafts.filter(d => d.id !== id));
      
      toast({
        title: 'Rascunho excluído',
        description: 'O rascunho foi excluído com sucesso.',
      });
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Ocorreu um erro ao excluir o rascunho. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleMoveDraftToFolder = async (draftId: string, folderId: string | null) => {
    try {
      const updatedDraft = await draftService.updateDraft(draftId, {
        folderId: folderId
      });
      
      setDrafts(drafts.map(d => d.id === draftId ? updatedDraft : d));
      
      const folderName = folderId 
        ? folders.find(f => f.id === folderId)?.name || 'pasta'
        : 'Sem pasta';
      
      toast({
        title: 'Rascunho movido',
        description: `O rascunho foi movido para "${folderName}".`,
      });
    } catch (error) {
      console.error('Error moving draft:', error);
      toast({
        title: 'Erro ao mover',
        description: 'Ocorreu um erro ao mover o rascunho. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  // Handlers para sessão colaborativa
  const handleOpenCollaborativeModal = (draftIdToShare?: string) => {
    if (draftIdToShare) {
      setCollaborativeDraftId(draftIdToShare);
    }
    setIsCollaborativeModalOpen(true);
  };

  const handleSessionCreated = (session: CollaborativeSession) => {
    setCollaborativeSession(session);
    toast({
      title: 'Sessão colaborativa ativa',
      description: 'Seu parceiro pode entrar usando o token.',
    });
  };

  const handleSessionJoined = async (session: CollaborativeSession, draftId: string) => {
    setCollaborativeSession(session);
    setCollaborativeDraftId(draftId);
    
    // Carregar o rascunho da sessão
    try {
      const draft = await draftService.getDraftById(draftId);
      if (draft) {
        startEditingDraft(draft);
      }
    } catch (error) {
      console.error('Erro ao carregar rascunho da sessão:', error);
    }
  };

  const handleEndSession = async () => {
    if (!collaborativeSession) return;
    
    try {
      await endCollaborativeSession(collaborativeSession.id);
      setCollaborativeSession(null);
      setCollaborativeDraftId(null);
      toast({
        title: 'Sessão encerrada',
        description: 'A sessão colaborativa foi encerrada.',
      });
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível encerrar a sessão.',
        variant: 'destructive',
      });
    }
  };

  const handleLeaveSession = async () => {
    if (!collaborativeSession) return;
    
    try {
      await leaveCollaborativeSession(collaborativeSession.id);
      setCollaborativeSession(null);
      setCollaborativeDraftId(null);
      setIsEditing(false);
      toast({
        title: 'Você saiu da sessão',
        description: 'Você não está mais na sessão colaborativa.',
      });
    } catch (error) {
      console.error('Erro ao sair da sessão:', error);
    }
  };
  
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <ProOnlyWrapper featureName="Compor">
      <div className="max-w-4xl mx-auto">
      {/* Mobile-optimized header */}
      <div className="flex flex-col gap-3 mb-4 md:mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold whitespace-nowrap">Seus Rascunhos</h2>
        </div>
        
        {/* Action buttons - horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide md:overflow-visible md:mx-0 md:px-0">
          <Button 
            variant="outline" 
            onClick={() => handleOpenCollaborativeModal()}
            className="flex-shrink-0 text-sm h-10"
            size="sm"
          >
            <Users className="mr-1.5 h-4 w-4" />
            <span className="whitespace-nowrap">Compor em Parceria</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsNewFolderModalOpen(true)}
            className="flex-shrink-0 text-sm h-10"
            size="sm"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            <span className="whitespace-nowrap">Nova Pasta</span>
          </Button>
          <Button 
            onClick={startNewDraft}
            className="flex-shrink-0 text-sm h-10"
            size="sm"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            <span className="whitespace-nowrap">Novo Rascunho</span>
          </Button>
        </div>
      </div>
      
      {/* Seção de Bases Musicais - sempre visível na tela principal */}
      {!isEditing && (
        <div className="mb-6">
          <BasesSelector
            selectedBase={selectedBase}
            onSelectBase={setSelectedBase}
          />
        </div>
      )}
      
      {isEditing ? (
        <div className="bg-card p-6 rounded-lg border animate-fade-in">
          <div className="space-y-4">
            {/* Header colaborativo */}
            {collaborativeSession && (
              <CollaborativeHeader
                session={collaborativeSession}
                participants={participants}
                isHost={isHost}
                isConnected={isConnected}
                currentUserId={user?.id}
                onEndSession={handleEndSession}
                onLeaveSession={handleLeaveSession}
              />
            )}

            {/* Botão para iniciar sessão colaborativa (se editando um rascunho existente) */}
            {activeId && !collaborativeSession && (
              <Button 
                variant="outline" 
                onClick={() => handleOpenCollaborativeModal(activeId)}
                className="w-full"
              >
                <Users className="mr-2 h-4 w-4" />
                Convidar Parceiro para Compor
              </Button>
            )}

            <BasesSelector
              selectedBase={selectedBase}
              onSelectBase={setSelectedBase}
              playTrigger={basePlayTrigger}
            />
            
            {/* Seletor de Pasta */}
            <div>
              <Label htmlFor="draft-folder">Pasta</Label>
              <Select
                value={selectedFolderId || 'none'}
                onValueChange={(value) => setSelectedFolderId(value === 'none' ? null : value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione uma pasta (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      Sem pasta
                    </div>
                  </SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        {folder.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="draft-title">Título</Label>
              <Input
                id="draft-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Digite um título para o rascunho"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="draft-content">Conteúdo</Label>
              <Textarea
                id="draft-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escreva suas ideias, versos, melodias..."
                className="min-h-[200px] mt-1"
              />
            </div>
            
            <AudioRecorder
              onSaveRecordings={handleSaveRecordings} 
              initialAudioFiles={audioFiles}
              isBasePlayingOrSelected={!!selectedBase}
              onPlayBase={() => setBasePlayTrigger(prev => prev + 1)}
            />
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveDraft} 
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Rascunho
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Rascunhos sem pasta */}
          {draftsByFolder.unorganized.length > 0 && (
            <Collapsible
              open={expandedFolders.has('unorganized')}
              onOpenChange={() => toggleFolder('unorganized')}
            >
              <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                {expandedFolders.has('unorganized') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Sem pasta</span>
                <span className="text-sm text-muted-foreground ml-auto">
                  {draftsByFolder.unorganized.length} {draftsByFolder.unorganized.length === 1 ? 'rascunho' : 'rascunhos'}
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {draftsByFolder.unorganized.map(draft => (
                    <DraftCard 
                      key={draft.id} 
                      draft={draft} 
                      onEdit={startEditingDraft}
                      onDelete={handleDeleteDraft}
                      folders={folders}
                      onMoveToFolder={handleMoveDraftToFolder}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
          
          {/* Pastas */}
          {folders.map(folder => (
            <Collapsible
              key={folder.id}
              open={expandedFolders.has(folder.id)}
              onOpenChange={() => toggleFolder(folder.id)}
            >
              <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                {expandedFolders.has(folder.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <Folder className="h-5 w-5 text-primary" />
                <span className="font-medium">{folder.name}</span>
                <span className="text-sm text-muted-foreground ml-auto">
                  {(draftsByFolder[folder.id] || []).length} {(draftsByFolder[folder.id] || []).length === 1 ? 'rascunho' : 'rascunhos'}
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {(draftsByFolder[folder.id] || []).length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground mt-4">
                    <p>Nenhum rascunho nesta pasta</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {(draftsByFolder[folder.id] || []).map(draft => (
                      <DraftCard 
                        key={draft.id} 
                        draft={draft} 
                        onEdit={startEditingDraft}
                        onDelete={handleDeleteDraft}
                        folders={folders}
                        onMoveToFolder={handleMoveDraftToFolder}
                      />
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          ))}
          
          {/* Mensagem se não houver nenhum rascunho */}
          {drafts.length === 0 && folders.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Você ainda não possui rascunhos. Crie um agora!</p>
            </div>
          )}
        </div>
      )}
      
      {/* Modal de Nova Pasta */}
      <Dialog open={isNewFolderModalOpen} onOpenChange={setIsNewFolderModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Pasta</DialogTitle>
            <DialogDescription>
              Crie uma nova pasta para organizar seus rascunhos.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Nome da pasta"
              autoFocus
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewFolderModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddFolder}>
              Criar Pasta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Sessão Colaborativa */}
      <CollaborativeSessionModal
        isOpen={isCollaborativeModalOpen}
        onClose={() => {
          setIsCollaborativeModalOpen(false);
          setCollaborativeDraftId(null);
        }}
        draftId={collaborativeDraftId || activeId || undefined}
        draftTitle={title || undefined}
        onSessionCreated={handleSessionCreated}
        onSessionJoined={handleSessionJoined}
      />
      </div>
    </ProOnlyWrapper>
  );
};

// Componente separado para o card de rascunho
interface DraftCardProps {
  draft: Draft;
  onEdit: (draft: Draft) => void;
  onDelete: (id: string) => void;
  folders?: FolderType[];
  onMoveToFolder?: (draftId: string, folderId: string | null) => void;
}

const DraftCard: React.FC<DraftCardProps> = ({ draft, onEdit, onDelete, folders = [], onMoveToFolder }) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{draft.title}</CardTitle>
          <div className="flex space-x-1">
            {onMoveToFolder && folders.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    title="Mover para pasta"
                  >
                    <FolderInput className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!draft.folder_id && (
                    <DropdownMenuItem disabled className="text-muted-foreground">
                      <Folder className="h-4 w-4 mr-2" />
                      Sem pasta (atual)
                    </DropdownMenuItem>
                  )}
                  {draft.folder_id && (
                    <DropdownMenuItem onClick={() => onMoveToFolder(draft.id, null)}>
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Remover da pasta
                    </DropdownMenuItem>
                  )}
                  {folders
                    .filter(f => f.id !== draft.folder_id)
                    .map(folder => (
                      <DropdownMenuItem 
                        key={folder.id} 
                        onClick={() => onMoveToFolder(draft.id, folder.id)}
                      >
                        <Folder className="h-4 w-4 mr-2" />
                        {folder.name}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => onEdit(draft)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => onDelete(draft.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {new Date(draft.created_at).toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-line line-clamp-4">
          {draft.content || <span className="text-muted-foreground italic">Sem conteúdo</span>}
        </p>
        
        {draft.audio_files && draft.audio_files.length > 0 ? (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-1">
              {draft.audio_files.length} {draft.audio_files.length === 1 ? 'áudio' : 'áudios'} gravados
            </p>
            <audio 
              controls 
              src={draft.audio_files[0].url} 
              className="w-full h-8"
              title={draft.audio_files[0].name} 
            />
          </div>
        ) : draft.audio_url ? (
          <div className="mt-4">
            <audio controls src={draft.audio_url} className="w-full h-8" />
          </div>
        ) : null}
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => onEdit(draft)}
        >
          Continuar Trabalhando
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Drafts;
