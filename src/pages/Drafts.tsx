import React, { useState, useEffect } from 'react';
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
import { Plus, Edit, Trash2, Save, Loader2 } from 'lucide-react';
import { AudioRecorder } from '../components/drafts/AudioRecorder';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import * as draftService from '../services/draftService';
import { Skeleton } from '@/components/ui/skeleton';
import { Draft, AudioFile } from '../services/drafts/types';
import { prepareAudioFilesForStorage } from '../services/drafts/audioService';

const Drafts: React.FC = () => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  // Novo estado para gerenciar múltiplos arquivos de áudio
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [audioBlobs, setAudioBlobs] = useState<Map<string, Blob>>(new Map());
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Check authentication and load drafts
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/');
      toast({
        title: 'Acesso negado',
        description: 'Você precisa estar logado para acessar esta página.',
        variant: 'destructive',
      });
    } else if (isAuthenticated && !authLoading) {
      loadDrafts();
    }
  }, [isAuthenticated, authLoading, navigate, toast]);
  
  const loadDrafts = async () => {
    setIsLoading(true);
    try {
      const fetchedDrafts = await draftService.getDrafts();
      setDrafts(fetchedDrafts);
    } catch (error) {
      console.error('Failed to load drafts:', error);
      toast({
        title: 'Erro ao carregar rascunhos',
        description: 'Não foi possível carregar seus rascunhos.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const startNewDraft = () => {
    setTitle('');
    setContent('');
    setAudioFiles([]);
    setAudioBlobs(new Map());
    setActiveId(null);
    setIsEditing(true);
  };
  
  const startEditingDraft = (draft: Draft) => {
    setTitle(draft.title);
    setContent(draft.content);
    
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
          audioFiles: uploadedFiles
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
          audioFiles: uploadedFiles
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
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Seus Rascunhos</h2>
        <Button onClick={startNewDraft}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Rascunho
        </Button>
      </div>
      
      {isEditing ? (
        <div className="bg-card p-6 rounded-lg border animate-fade-in">
          <div className="space-y-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {drafts.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <p>Você ainda não possui rascunhos. Crie um agora!</p>
            </div>
          ) : (
            drafts.map(draft => (
              <Card key={draft.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{draft.title}</CardTitle>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => startEditingDraft(draft)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleDeleteDraft(draft.id)}
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
                      {/* Mostra apenas o primeiro áudio na visualização do card */}
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
                    onClick={() => startEditingDraft(draft)}
                  >
                    Continuar Trabalhando
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Drafts;
