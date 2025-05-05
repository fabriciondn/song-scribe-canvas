
import React, { useState } from 'react';
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
import { Plus, Edit, Trash2, Save } from 'lucide-react';
import { AudioRecorder } from '../components/drafts/AudioRecorder';
import { useToast } from '@/components/ui/use-toast';

interface Draft {
  id: string;
  title: string;
  content: string;
  audioUrl?: string;
  date: string;
}

const INITIAL_DRAFTS: Draft[] = [
  {
    id: '1',
    title: 'Ideia para refrão pop',
    content: 'Algo sobre as estrelas e o caminho para casa',
    date: new Date().toLocaleString(),
  }
];

const Drafts: React.FC = () => {
  const [drafts, setDrafts] = useState<Draft[]>(INITIAL_DRAFTS);
  const [isEditing, setIsEditing] = useState(false);
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
  
  const { toast } = useToast();
  
  const startNewDraft = () => {
    setTitle('');
    setContent('');
    setAudioUrl(undefined);
    setActiveId(null);
    setIsEditing(true);
  };
  
  const startEditingDraft = (draft: Draft) => {
    setTitle(draft.title);
    setContent(draft.content);
    setAudioUrl(draft.audioUrl);
    setActiveId(draft.id);
    setIsEditing(true);
  };
  
  const handleSaveDraft = () => {
    if (!title.trim()) {
      toast({
        title: 'Título obrigatório',
        description: 'Por favor, insira um título para o rascunho.',
        variant: 'destructive',
      });
      return;
    }
    
    const now = new Date().toLocaleString();
    
    if (activeId) {
      // Update existing draft
      setDrafts(drafts.map(d => 
        d.id === activeId 
          ? { ...d, title, content, audioUrl, date: now } 
          : d
      ));
      
      toast({
        title: 'Rascunho atualizado',
        description: `O rascunho "${title}" foi atualizado com sucesso.`,
      });
    } else {
      // Create new draft
      const newDraft: Draft = {
        id: Date.now().toString(),
        title,
        content,
        audioUrl,
        date: now,
      };
      
      setDrafts([newDraft, ...drafts]);
      
      toast({
        title: 'Rascunho criado',
        description: `O rascunho "${title}" foi criado com sucesso.`,
      });
    }
    
    setIsEditing(false);
  };
  
  const handleDeleteDraft = (id: string) => {
    setDrafts(drafts.filter(d => d.id !== id));
    
    toast({
      title: 'Rascunho excluído',
      description: 'O rascunho foi excluído com sucesso.',
    });
  };
  
  const handleSaveRecording = (url: string) => {
    setAudioUrl(url);
  };

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
            
            <AudioRecorder onSaveRecording={handleSaveRecording} />
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveDraft}>
                <Save className="mr-2 h-4 w-4" />
                Salvar Rascunho
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
                  <p className="text-xs text-muted-foreground">{draft.date}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-line line-clamp-4">
                    {draft.content || <span className="text-muted-foreground italic">Sem conteúdo</span>}
                  </p>
                  
                  {draft.audioUrl && (
                    <div className="mt-4">
                      <audio controls src={draft.audioUrl} className="w-full h-8" />
                    </div>
                  )}
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
