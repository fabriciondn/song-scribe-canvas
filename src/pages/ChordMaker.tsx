
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChordPalette } from '../components/composer/ChordPalette';
import { ChordPreview } from '../components/composer/ChordPreview';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Save } from 'lucide-react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

const ChordMaker: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Load saved content from localStorage
  React.useEffect(() => {
    try {
      const savedTitle = localStorage.getItem('chordmaker_current_title');
      const savedContent = localStorage.getItem('chordmaker_current_content');
      if (savedTitle) setTitle(savedTitle);
      if (savedContent) setContent(savedContent);
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }, []);

  // Save content to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('chordmaker_current_title', title);
      localStorage.setItem('chordmaker_current_content', content);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [title, content]);

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

  const handleSaveChords = () => {
    // Save chord sheet functionality
    if (!title.trim()) {
      toast({
        title: "Título necessário",
        description: "Por favor, adicione um título antes de salvar.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Cifras salvas",
      description: "Suas cifras foram salvas com sucesso."
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Editor de Cifras</h1>
        <Button onClick={handleSaveChords}>
          <Save className="mr-2 h-4 w-4" />
          Salvar Cifras
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="section-box">
          <div className="mb-4">
            <Label htmlFor="chord-title">Título da Música</Label>
            <Input 
              id="chord-title" 
              value={title} 
              onChange={handleTitleChange} 
              placeholder="Digite o título da música" 
              className="mt-1" 
            />
          </div>

          <div>
            <Label htmlFor="chord-content">Letra e Cifras</Label>
            <Textarea 
              id="chord-content" 
              value={content} 
              onChange={handleContentChange} 
              placeholder="Digite a letra e adicione as cifras entre colchetes, exemplo: [C] Quando eu [G] canto" 
              className="font-mono min-h-[400px] mt-1"
              ref={textareaRef}
              onDrop={handleTextAreaDrop}
              onDragOver={(e) => e.preventDefault()}
            />
            <p className="text-xs mt-1 text-muted-foreground">
              Dica: Use colchetes para cifrar, exemplo: [C] Quando eu [G] canto
            </p>
          </div>
        </div>

        <div className="section-box">
          <Tabs defaultValue="chords">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chords">Acordes</TabsTrigger>
              <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
            </TabsList>
            <TabsContent value="chords" className="mt-2">
              <ScrollArea className="h-[500px]">
                <ChordPalette onChordClick={handleChordClick} />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="preview" className="mt-2">
              <ScrollArea className="h-[500px]">
                <ChordPreview content={content} />
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ChordMaker;
