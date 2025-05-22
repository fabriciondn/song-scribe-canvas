
import React from 'react';
import { MusicBases } from './MusicBases';
import { ThemeGenerator } from './ThemeGenerator';
import { RhymeAssistant } from './RhymeAssistant';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EditorHeader } from './EditorHeader';
import { SoloEditor } from './SoloEditor';
import { CollaborativeEditor } from './CollaborativeEditor';

interface DesktopLayoutProps {
  partnershipId: string | null;
  title: string;
  content: string;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onContentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSectionClick: (sectionText: string) => void;
  onTextAreaDrop: (e: React.DragEvent<HTMLTextAreaElement>) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onNewClick: () => void;
  openSaveModal: () => void;
  openDAModal: () => void;
  onInsertBase: (baseInfo: { title: string; genre: string }) => void;
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  partnershipId,
  title,
  content,
  onTitleChange,
  onContentChange,
  onSectionClick,
  onTextAreaDrop,
  textareaRef,
  onNewClick,
  openSaveModal,
  openDAModal,
  onInsertBase
}) => {
  return (
    <div className="container-editor">
      {/* Coluna Esquerda: Bases Musicais */}
      <div className="section-box">
        <h3 className="text-lg font-medium mb-3">Bases Musicais</h3>
        <MusicBases onInsertBase={onInsertBase} />
      </div>
      
      {/* Coluna Central: Editor - agora com mais espaço */}
      <div className="section-box flex flex-col">
        <EditorHeader 
          partnershipId={partnershipId}
          onNewClick={onNewClick}
          openSaveModal={openSaveModal}
          openDAModal={openDAModal}
        />
        
        {partnershipId ? (
          <CollaborativeEditor partnershipId={partnershipId} />
        ) : (
          <SoloEditor
            title={title}
            content={content}
            onTitleChange={onTitleChange}
            onContentChange={onContentChange}
            onSectionClick={onSectionClick}
            onTextAreaDrop={onTextAreaDrop}
            textareaRef={textareaRef}
          />
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
};
