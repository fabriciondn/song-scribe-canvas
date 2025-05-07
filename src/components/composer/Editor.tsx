
import React, { useState, useEffect } from 'react';
import { SectionButtons } from './SectionButtons';
import { DAModal } from './DAModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { SaveModal } from './SaveModal';

export const Editor: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isDAModalOpen, setIsDAModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // Load saved content from localStorage
  useEffect(() => {
    const savedTitle = localStorage.getItem('songscribe_current_title');
    const savedContent = localStorage.getItem('songscribe_current_content');
    if (savedTitle) setTitle(savedTitle);
    if (savedContent) setContent(savedContent);
  }, []);

  // Save content to localStorage
  useEffect(() => {
    localStorage.setItem('songscribe_current_title', title);
    localStorage.setItem('songscribe_current_content', content);
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <img 
          src="/lovable-uploads/913b0b45-af0f-4a18-9433-06da553e8273.png" 
          alt="Compuse Logo" 
          className="h-12" 
        />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              Finalizar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={openDAModal}>
              <FileText className="mr-2 h-4 w-4" />
              Gerar e enviar DA
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openSaveModal}>
              <FileText className="mr-2 h-4 w-4" />
              Guardar em pasta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="editor-container">
        <div className="mb-4">
          <Label htmlFor="song-title">Título da Composição</Label>
          <Input id="song-title" value={title} onChange={handleTitleChange} placeholder="Digite o título da sua música" className="mt-1" />
        </div>
        
        <SectionButtons onSectionClick={handleSectionClick} />
        
        <div>
          <Label htmlFor="song-content">Letra</Label>
          <Textarea id="song-content" value={content} onChange={handleContentChange} placeholder="Comece a compor sua letra aqui..." className="editor-content min-h-[400px] font-mono mt-1" />
        </div>
      </div>
      
      <DAModal isOpen={isDAModalOpen} onClose={closeDAModal} songContent={content} songTitle={title} />
      <SaveModal isOpen={isSaveModalOpen} onClose={closeSaveModal} songContent={content} songTitle={title} />
    </div>
  );
};
