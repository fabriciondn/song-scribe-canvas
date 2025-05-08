import React, { useState, useEffect, useRef } from 'react';
import { SectionButtons } from './SectionButtons';
import { DAModal } from './DAModal';
import { SaveModal } from './SaveModal';
import { ChordPalette } from './ChordPalette';
import { ChordPreview } from './ChordPreview';
import { MusicBases } from './MusicBases';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText, Loader2 } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { createBackup } from '@/services/draftService';
import { useToast } from '@/components/ui/use-toast';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useMobileDetection } from '@/hooks/use-mobile';

export const Editor: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isDAModalOpen, setIsDAModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const isMobile = useMobileDetection();

  // Load saved content from localStorage
  useEffect(() => {
    try {
      const savedTitle = localStorage.getItem('songscribe_current_title');
      const savedContent = localStorage.getItem('songscribe_current_content');
      if (savedTitle) setTitle(savedTitle);
      if (savedContent) setContent(savedContent);
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }, []);

  // Save content to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('songscribe_current_title', title);
      localStorage.setItem('songscribe_current_content', content);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [title, content]);

  const handleSectionClick = (sectionText: string) => {
    // Insert the section at cursor position or at the end
    setContent(prev => prev + sectionText);
  };

  const handleChordClick = (chord: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = content.substring(0, cursorPosition);
    const textAfterCursor = content.substring(cursorPosition);

    // Insert the chord at the cursor position
    const newContent = `${textBeforeCursor}[${chord}] ${textAfterCursor}`;
    setContent(newContent);

    // Set focus back to textarea and place cursor after inserted chord
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = cursorPosition + chord.length + 3; // +3 for the [, ], and space
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
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
      await createBackup(title, content);
      toast({
        title: 'Backup criado',
        description: 'Sua composição foi salva automaticamente na pasta de Backup.',
      });
    } catch (error) {
      console.error('Error creating backup:', error);
      toast({
        title: 'Erro ao criar backup',
        description: 'Não foi possível criar o backup da sua composição.',
        variant: 'destructive',
      });
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

  // Conteúdo do editor para dispositivos desktop
  const editorContent = (
    <div className="container-editor">
      {/* Coluna Esquerda: Chord preview and palette */}
      <div className="section-box">
        <Tabs defaultValue="preview">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
            <TabsTrigger value="chords">Acordes</TabsTrigger>
          </TabsList>
          <TabsContent value="preview" className="mt-2">
            <ChordPreview content={content} />
          </TabsContent>
          <TabsContent value="chords" className="mt-2">
            <ChordPalette onChordClick={handleChordClick} />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Coluna Central: Editor container */}
      <div className="section-box">
        <div className="mb-4">
          <Label htmlFor="song-title">Título da Composição</Label>
          <Input id="song-title" value={title} onChange={handleTitleChange} placeholder="Digite o título da sua música" className="mt-1" />
        </div>
        
        <SectionButtons onSectionClick={handleSectionClick} />
        
        <div>
          <Label htmlFor="song-content">Letra</Label>
          <Textarea 
            id="song-content" 
            value={content} 
            onChange={handleContentChange} 
            placeholder="Comece a compor sua letra aqui... Use [C] para adicionar o acorde C" 
            className="editor-content min-h-[400px] font-mono mt-1"
            ref={textareaRef}
            onDrop={handleTextAreaDrop}
            onDragOver={(e) => e.preventDefault()}
          />
          <p className="text-xs mt-1 text-muted-foreground">
            Dica: Use colchetes para cifrar, exemplo: [C] Quando eu [G] canto
          </p>
        </div>
      </div>
      
      {/* Coluna Direita: Music Bases */}
      <div className="section-box h-full overflow-auto">
        <MusicBases onInsertBase={handleInsertBase} />
      </div>
    </div>
  );

  // Versão mobile com drawer para as bases musicais
  const mobileEditorContent = (
    <div className="flex flex-col gap-4">
      <div className="section-box">
        <Tabs defaultValue="preview">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
            <TabsTrigger value="chords">Acordes</TabsTrigger>
          </TabsList>
          <TabsContent value="preview" className="mt-2">
            <ChordPreview content={content} />
          </TabsContent>
          <TabsContent value="chords" className="mt-2">
            <ChordPalette onChordClick={handleChordClick} />
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="section-box">
        <div className="mb-4">
          <Label htmlFor="song-title-mobile">Título da Composição</Label>
          <Input id="song-title-mobile" value={title} onChange={handleTitleChange} placeholder="Digite o título da sua música" className="mt-1" />
        </div>
        
        <SectionButtons onSectionClick={handleSectionClick} />
        
        <div>
          <div className="flex justify-between items-center">
            <Label htmlFor="song-content-mobile">Letra</Label>
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm" className="mb-2">
                  Bases Musicais
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="p-4 max-h-[80vh] overflow-auto">
                  <MusicBases onInsertBase={handleInsertBase} />
                </div>
              </DrawerContent>
            </Drawer>
          </div>
          <Textarea 
            id="song-content-mobile" 
            value={content} 
            onChange={handleContentChange} 
            placeholder="Comece a compor sua letra aqui... Use [C] para adicionar o acorde C" 
            className="editor-content min-h-[300px] font-mono mt-1"
            ref={textareaRef}
            onDrop={handleTextAreaDrop}
            onDragOver={(e) => e.preventDefault()}
          />
          <p className="text-xs mt-1 text-muted-foreground">
            Dica: Use colchetes para cifrar, exemplo: [C] Quando eu [G] canto
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <img 
          src="/lovable-uploads/913b0b45-af0f-4a18-9433-06da553e8273.png" 
          alt="Compuse Logo" 
          className="h-12" 
        />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Finalizar'
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={openDAModal}
              disabled={!!processing}
            >
              <FileText className="mr-2 h-4 w-4" />
              Gerar e enviar DA
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={openSaveModal}
              disabled={!!processing}
            >
              <FileText className="mr-2 h-4 w-4" />
              Guardar em pasta
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleBackup}
              disabled={!!processing}
            >
              <FileText className="mr-2 h-4 w-4" />
              Criar backup
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {isMobile ? mobileEditorContent : editorContent}
      
      <DAModal 
        isOpen={isDAModalOpen} 
        onClose={closeDAModal} 
        songContent={content} 
        songTitle={title} 
      />
      <SaveModal 
        isOpen={isSaveModalOpen} 
        onClose={closeSaveModal} 
        songContent={content} 
        songTitle={title}
        onSaveComplete={handleSaveComplete}
      />
    </div>
  );
};
