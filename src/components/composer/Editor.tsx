
import React, { useState, useEffect, useRef } from 'react';
import { SectionButtons } from './SectionButtons';
import { DAModal } from './DAModal';
import { SaveModal } from './SaveModal';
import { MusicBases } from './MusicBases';
import { ThemeGenerator } from './ThemeGenerator';
import { RhymeAssistant } from './RhymeAssistant';
import { CollaborativeEditor } from './CollaborativeEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText, Loader2, Plus, Users } from 'lucide-react';
import { createBackup } from '@/services/draftService';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useMobileDetection } from '@/hooks/use-mobile';
import { useSearchParams } from 'react-router-dom';

export const Editor: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isDAModalOpen, setIsDAModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const isMobile = useMobileDetection();
  const [searchParams] = useSearchParams();
  const partnershipId = searchParams.get('partnership');
  
  // Load saved content from localStorage (only for non-collaborative mode)
  useEffect(() => {
    if (partnershipId) return;
    
    try {
      const savedTitle = localStorage.getItem('songscribe_current_title');
      const savedContent = localStorage.getItem('songscribe_current_content');
      if (savedTitle) setTitle(savedTitle);
      if (savedContent) setContent(savedContent);
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }, [partnershipId]);

  // Save content to localStorage (only for non-collaborative mode)
  useEffect(() => {
    if (partnershipId) return;
    
    try {
      localStorage.setItem('songscribe_current_title', title);
      localStorage.setItem('songscribe_current_content', content);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [title, content, partnershipId]);

  const handleSectionClick = (sectionText: string) => {
    // Insert the section at cursor position or at the end
    setContent(prev => prev + sectionText);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const openDAModal = () => {
    setIsDAModalOpen(true);
  };

  const closeDAModal = () => {
    setIsDAModalOpen(false);
  };

  const openSaveModal = () => {
    setIsSaveModalOpen(true);
  };

  const closeSaveModal = () => {
    setIsSaveModalOpen(false);
  };

  // This function is now a no-op but kept for compatibility
  const handleBackup = async () => {
    if (!title.trim()) {
      toast({
        title: 'Título necessário',
        description: 'Por favor, adicione um título antes de criar um backup.',
        variant: 'destructive',
      });
      return;
    }

    setProcessing('backup');
    try {
      // The createBackup function is now a no-op
      console.log('Backup creation skipped (feature disabled)');
      toast({
        title: 'Recurso de backup desativado',
        description: 'A função de backup automático foi desativada.',
      });
    } catch (error) {
      console.error('Error with backup feature:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleSaveComplete = () => {
    // Clear the form fields after saving
    setTitle('');
    setContent('');
    // Also clear localStorage for current song
    localStorage.removeItem('songscribe_current_title');
    localStorage.removeItem('songscribe_current_content');
  };

  const handleTextAreaDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const chord = e.dataTransfer.getData('text/plain');
    if (chord) {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursorPosition = textarea.selectionStart;
      const textBeforeCursor = content.substring(0, cursorPosition);
      const textAfterCursor = content.substring(cursorPosition);

      const newContent = `${textBeforeCursor}${chord} ${textAfterCursor}`;
      setContent(newContent);
      
      // Set focus back to textarea
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = cursorPosition + chord.length + 1; // +1 for the space
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const handleInsertBase = (baseInfo: { title: string; genre: string }) => {
    // Inserir informações da base na composição
    const baseInfoText = `\n\n[Base Musical: ${baseInfo.title} - Gênero: ${baseInfo.genre}]\n\n`;
    setContent(prev => prev + baseInfoText);
    
    // Mover o cursor para o final do texto inserido
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = content.length + baseInfoText.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  // Componente do header com o logo e botões de ação
  const EditorHeader = () => (
    <div className="flex justify-between items-center mb-2 bg-white py-2 px-3 rounded-lg shadow-sm sticky top-0">
      <div className="flex items-center">
        <img 
          src="/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png" 
          alt="Logo" 
          className="h-8" 
        />
        <span className="ml-2 font-semibold text-lg">Compuse</span>
        {partnershipId && (
          <div className="ml-3 flex items-center bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs">
            <Users className="h-3 w-3 mr-1" />
            Modo Colaborativo
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="default" 
          className="bg-orange-500 hover:bg-orange-600" 
          onClick={() => {
            setTitle('');
            setContent('');
            localStorage.removeItem('songscribe_current_title');
            localStorage.removeItem('songscribe_current_content');
          }}
          size="sm"
          disabled={!!partnershipId}
        >
          Nova
        </Button>
        
        <Button 
          variant="default"
          className="bg-purple-600 hover:bg-purple-700"
          onClick={openSaveModal}
          size="sm"
          disabled={!!partnershipId}
        >
          Salvar
        </Button>
        
        <Button 
          variant="default"
          className="bg-purple-600 hover:bg-purple-700"
          onClick={openDAModal}
          size="sm"
        >
          Gerar DA
        </Button>
      </div>
    </div>
  );

  // Layout responsivo melhorado
  const desktopLayout = (
    <div className="container-editor">
      {/* Coluna Esquerda: Bases Musicais */}
      <div className="section-box">
        <h3 className="text-lg font-medium mb-3">Bases Musicais</h3>
        <MusicBases onInsertBase={handleInsertBase} />
      </div>
      
      {/* Coluna Central: Editor - agora com mais espaço */}
      <div className="section-box flex flex-col">
        <EditorHeader />
        
        {partnershipId ? (
          <CollaborativeEditor partnershipId={partnershipId} />
        ) : (
          <>
            <div className="mb-3">
              <Label htmlFor="song-title" className="text-sm font-medium">Título da Composição</Label>
              <Input 
                id="song-title" 
                value={title} 
                onChange={handleTitleChange} 
                placeholder="Digite o título da sua música" 
                className="mt-1" 
              />
            </div>
            
            <SectionButtons onSectionClick={handleSectionClick} />
            
            <div className="flex-1 flex flex-col">
              <Label htmlFor="song-content" className="text-sm font-medium mt-2">Letra</Label>
              <Textarea 
                id="song-content" 
                value={content} 
                onChange={handleContentChange} 
                placeholder="Comece a compor sua letra aqui..." 
                className="editor-content flex-1 min-h-[450px] font-mono mt-1"
                ref={textareaRef}
                onDrop={handleTextAreaDrop}
                onDragOver={(e) => e.preventDefault()}
              />
            </div>
          </>
        )}
      </div>
      
      {/* Coluna Direita: Ferramentas de IA */}
      <div className="section-box">
        <ScrollArea className="h-full">
          <div className="flex flex-col space-y-6">
            <ThemeGenerator />
            <RhymeAssistant />
          </div>
        </ScrollArea>
      </div>
    </div>
  );

  // Layout móvel otimizado
  const mobileLayout = (
    <div className="flex flex-col gap-3 p-2">
      <div className="bg-white rounded-lg shadow-sm p-3">
        <EditorHeader />
        
        {partnershipId ? (
          <CollaborativeEditor partnershipId={partnershipId} />
        ) : (
          <>
            <div className="mb-3 mt-3">
              <Label htmlFor="song-title-mobile">Título da Composição</Label>
              <Input id="song-title-mobile" value={title} onChange={handleTitleChange} placeholder="Digite o título da sua música" className="mt-1" />
            </div>
            
            <SectionButtons onSectionClick={handleSectionClick} />
            
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1">
                <Label htmlFor="song-content-mobile">Letra</Label>
                <div className="flex gap-2">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs">
                        <Plus size={14} className="mr-1" /> Bases
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[80vh] sm:max-w-none pt-10">
                      <div className="p-2 max-h-[70vh] overflow-auto">
                        <h3 className="text-lg font-medium mb-3">Bases Musicais</h3>
                        <MusicBases onInsertBase={handleInsertBase} />
                      </div>
                    </SheetContent>
                  </Sheet>

                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs">
                        <Plus size={14} className="mr-1" /> Ferramentas
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[80vh] sm:max-w-none pt-10">
                      <div className="p-2 max-h-[70vh] overflow-auto space-y-6">
                        <ThemeGenerator />
                        <RhymeAssistant />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
              <Textarea 
                id="song-content-mobile" 
                value={content} 
                onChange={handleContentChange} 
                placeholder="Comece a compor sua letra aqui..." 
                className="editor-content min-h-[350px] font-mono mt-1"
                ref={textareaRef}
                onDrop={handleTextAreaDrop}
                onDragOver={(e) => e.preventDefault()}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {isMobile ? mobileLayout : desktopLayout}
      
      <DAModal 
        isOpen={isDAModalOpen} 
        onClose={closeDAModal} 
        songContent={partnershipId ? '' : content} 
        songTitle={partnershipId ? '' : title} 
      />
      <SaveModal 
        isOpen={isSaveModalOpen} 
        onClose={closeSaveModal} 
        songContent={content} 
        songTitle={title}
        onSaveComplete={handleSaveComplete}
      />
    </>
  );
};
