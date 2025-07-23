
import React, { useState, useEffect, useRef } from 'react';
import { DAModal } from './DAModal';
import { SaveModal } from './SaveModal';
import { useToast } from '@/components/ui/use-toast';
import { useMobileDetection } from '@/hooks/use-mobile';
import { useSearchParams } from 'react-router-dom';
import { DesktopLayout } from './DesktopLayout';
import { MobileLayout } from './MobileLayout';

export const Editor: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isDAModalOpen, setIsDAModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { isMobile } = useMobileDetection();
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

  const handleNewClick = () => {
    setTitle('');
    setContent('');
    localStorage.removeItem('songscribe_current_title');
    localStorage.removeItem('songscribe_current_content');
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

  return (
    <>
      {isMobile ? (
        <MobileLayout
          partnershipId={partnershipId}
          title={title}
          content={content}
          onTitleChange={handleTitleChange}
          onContentChange={handleContentChange}
          onSectionClick={handleSectionClick}
          onTextAreaDrop={handleTextAreaDrop}
          textareaRef={textareaRef}
          onNewClick={handleNewClick}
          openSaveModal={openSaveModal}
          openDAModal={openDAModal}
          onInsertBase={handleInsertBase}
        />
      ) : (
        <DesktopLayout
          partnershipId={partnershipId}
          title={title}
          content={content}
          onTitleChange={handleTitleChange}
          onContentChange={handleContentChange}
          onSectionClick={handleSectionClick}
          onTextAreaDrop={handleTextAreaDrop}
          textareaRef={textareaRef}
          onNewClick={handleNewClick}
          openSaveModal={openSaveModal}
          openDAModal={openDAModal}
          onInsertBase={handleInsertBase}
        />
      )}
      
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
