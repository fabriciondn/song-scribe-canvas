
import React, { useState, useEffect, useRef } from 'react';
import { SectionButtons } from './SectionButtons';
import { DAModal } from './DAModal';
import { SaveModal } from './SaveModal';
import { MusicBases } from './MusicBases';
import { ThemeGenerator } from './ThemeGenerator';
import { RhymeAssistant } from './RhymeAssistant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText, Loader2, Plus } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { createBackup } from '@/services/draftService';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
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

  // Header component with action buttons
  const EditorHeader = () => (
    <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
      <div className="flex items-center">
        <img 
          src="/lovable-uploads/913b0b45-af0f-4a18-9433-06da553e8273.png" 
          alt="Compuse Logo" 
          className="h-10" 
        />
        <span className="ml-4 font-semibold text-lg">Compuse</span>
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
        >
          Nova
        </Button>
        
        <Button 
          variant="default"
          className="bg-purple-600 hover:bg-purple-700"
          onClick={openSaveModal}
        >
          Salvar
        </Button>
        
        <Button 
          variant="default"
          className="bg-purple-600 hover:bg-purple-700"
          onClick={openDAModal}
        >
          Gerar DA
        </Button>
      </div>
    </div>
  );

  // New 3-column layout for desktop with smaller side margins
  const desktopLayout = (
    <>
      <EditorHeader />
      <div className="container-editor">
        {/* Left Column: Music Bases */}
        <div className="section-box">
          <ScrollArea className="h-[calc(100vh-180px)]">
            <MusicBases onInsertBase={handleInsertBase} />
          </ScrollArea>
        </div>
        
        {/* Center Column: Editor */}
        <div className="section-box flex flex-col">
          <div className="mb-4">
            <Label htmlFor="song-title">Título da Composição</Label>
            <Input id="song-title" value={title} onChange={handleTitleChange} placeholder="Digite o título da sua música" className="mt-1" />
          </div>
          
          <SectionButtons onSectionClick={handleSectionClick} />
          
          <div className="flex-1 flex flex-col">
            <Label htmlFor="song-content">Letra</Label>
            <Textarea 
              id="song-content" 
              value={content} 
              onChange={handleContentChange} 
              placeholder="Comece a compor sua letra aqui..." 
              className="editor-content flex-1 min-h-[400px] font-mono mt-1"
              ref={textareaRef}
              onDrop={handleTextAreaDrop}
              onDragOver={(e) => e.preventDefault()}
            />
            <p className="text-xs mt-1 text-muted-foreground">
              Digite sua letra e use os botões de seção para organizar a estrutura da música
            </p>
          </div>
        </div>
        
        {/* Right Column: AI Tools */}
        <div className="section-box">
          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="flex flex-col space-y-6">
              <ThemeGenerator />
              <RhymeAssistant />
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );

  // Mobile layout with drawer for sidebar elements
  const mobileLayout = (
    <>
      <EditorHeader />
      <div className="flex flex-col gap-4">
        <div className="section-box">
          <div className="mb-4">
            <Label htmlFor="song-title-mobile">Título da Composição</Label>
            <Input id="song-title-mobile" value={title} onChange={handleTitleChange} placeholder="Digite o título da sua música" className="mt-1" />
          </div>
          
          <SectionButtons onSectionClick={handleSectionClick} />
          
          <div>
            <div className="flex justify-between items-center">
              <Label htmlFor="song-content-mobile">Letra</Label>
              <div className="flex gap-2">
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Plus size={14} className="mr-1" /> Bases
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <div className="p-4 max-h-[80vh] overflow-auto">
                      <MusicBases onInsertBase={handleInsertBase} />
                    </div>
                  </DrawerContent>
                </Drawer>

                <Drawer>
                  <DrawerTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Plus size={14} className="mr-1" /> Ferramentas
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <div className="p-4 max-h-[80vh] overflow-auto space-y-6">
                      <ThemeGenerator />
                      <RhymeAssistant />
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>
            <Textarea 
              id="song-content-mobile" 
              value={content} 
              onChange={handleContentChange} 
              placeholder="Comece a compor sua letra aqui..." 
              className="editor-content min-h-[300px] font-mono mt-1"
              ref={textareaRef}
              onDrop={handleTextAreaDrop}
              onDragOver={(e) => e.preventDefault()}
            />
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4">
      {isMobile ? mobileLayout : desktopLayout}
      
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
