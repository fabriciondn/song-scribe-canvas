import React, { useState, useEffect, useRef } from 'react';
import { SaveModal } from './SaveModal';
import { RegisterWorkModal } from './RegisterWorkModal';
import { SaveDraftModal } from './SaveDraftModal';
import { useToast } from '@/components/ui/use-toast';
import { useMobileDetection } from '@/hooks/use-mobile';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DesktopLayout } from './DesktopLayout';
import { MobileLayout } from './MobileLayout';
import * as folderService from '@/services/folderService';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export const Editor: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isRegisterWorkModalOpen, setIsRegisterWorkModalOpen] = useState(false);
  const [isSaveDraftModalOpen, setIsSaveDraftModalOpen] = useState(false);
  const [isNewLyricConfirmOpen, setIsNewLyricConfirmOpen] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { isMobile } = useMobileDetection();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
    setContent(prev => prev + sectionText);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const openSaveModal = () => {
    setIsSaveModalOpen(true);
  };

  const closeSaveModal = () => {
    setIsSaveModalOpen(false);
  };

  const openRegisterWorkModal = () => {
    setIsRegisterWorkModalOpen(true);
  };

  const closeRegisterWorkModal = () => {
    setIsRegisterWorkModalOpen(false);
  };

  const handleNewClick = () => {
    // Check if there's unsaved content
    if (title.trim() || content.trim()) {
      setIsNewLyricConfirmOpen(true);
    } else {
      // No content, proceed with new composition
      clearEditor();
    }
  };

  const clearEditor = () => {
    setTitle('');
    setContent('');
    localStorage.removeItem('songscribe_current_title');
    localStorage.removeItem('songscribe_current_content');
  };

  const handleSaveComplete = () => {
    clearEditor();
  };

  const handleSaveDraft = async (draftTitle: string, folderId: string) => {
    try {
      await folderService.createSong({
        title: draftTitle,
        content: content,
        folder_id: folderId
      });

      toast({
        title: "Rascunho salvo",
        description: "A letra foi salva como rascunho com sucesso.",
      });

      clearEditor();
    } catch (error) {
      console.error('Error saving draft:', error);
      throw error;
    }
  };

  const handleRegisterWorkReview = () => {
    closeRegisterWorkModal();
    // User wants to review, just close the modal and stay on current page
  };

  const handleRegisterWorkProceed = () => {
    closeRegisterWorkModal();
    // Navigate to author registration page
    navigate('/author-registration');
  };

  const handleNewLyricSaveDraft = () => {
    setIsNewLyricConfirmOpen(false);
    setIsSaveDraftModalOpen(true);
  };

  const handleNewLyricProceed = () => {
    setIsNewLyricConfirmOpen(false);
    clearEditor();
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
      
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = cursorPosition + chord.length + 1;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const handleInsertBase = (baseInfo: { title: string; genre: string }) => {
    const baseInfoText = `\n\n[Base Musical: ${baseInfo.title} - Gênero: ${baseInfo.genre}]\n\n`;
    setContent(prev => prev + baseInfoText);
    
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
          openRegisterWorkModal={openRegisterWorkModal}
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
          openRegisterWorkModal={openRegisterWorkModal}
          onInsertBase={handleInsertBase}
        />
      )}
      
      <SaveModal 
        isOpen={isSaveModalOpen} 
        onClose={closeSaveModal} 
        songContent={content} 
        songTitle={title}
        onSaveComplete={handleSaveComplete}
      />

      <RegisterWorkModal
        isOpen={isRegisterWorkModalOpen}
        onClose={closeRegisterWorkModal}
        onReview={handleRegisterWorkReview}
        onProceed={handleRegisterWorkProceed}
      />

      <SaveDraftModal
        isOpen={isSaveDraftModalOpen}
        onClose={() => setIsSaveDraftModalOpen(false)}
        onSave={handleSaveDraft}
        currentTitle={title}
        currentContent={content}
      />

      {/* New Lyric Confirmation Dialog */}
      <Dialog open={isNewLyricConfirmOpen} onOpenChange={setIsNewLyricConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Letra</DialogTitle>
            <DialogDescription>
              Você tem conteúdo não salvo. Deseja salvar a letra atual como rascunho?
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={handleNewLyricProceed}
              className="w-full sm:w-auto"
            >
              Não
            </Button>
            <Button 
              onClick={handleNewLyricSaveDraft}
              className="w-full sm:w-auto"
            >
              Sim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};