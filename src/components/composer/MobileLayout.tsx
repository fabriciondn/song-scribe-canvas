
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { SectionButtons } from './SectionButtons';
import { EditorHeader } from './EditorHeader';
import { MobileControls } from './MobileControls';
import { CollaborativeEditor } from './CollaborativeEditor';

interface MobileLayoutProps {
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

export const MobileLayout: React.FC<MobileLayoutProps> = ({
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
    <div className="flex flex-col gap-3 p-2">
      <div className="bg-white rounded-lg shadow-sm p-3">
        <EditorHeader 
          partnershipId={partnershipId}
          onNewClick={onNewClick}
          openSaveModal={openSaveModal}
          openDAModal={openDAModal}
        />
        
        {partnershipId ? (
          <CollaborativeEditor partnershipId={partnershipId} />
        ) : (
          <>
            <div className="mb-3 mt-3">
              <Label htmlFor="song-title-mobile">Título da Composição</Label>
              <Input 
                id="song-title-mobile" 
                value={title} 
                onChange={onTitleChange} 
                placeholder="Digite o título da sua música" 
                className="mt-1" 
              />
            </div>
            
            <SectionButtons onSectionClick={onSectionClick} />
            
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1">
                <Label htmlFor="song-content-mobile">Letra</Label>
                <MobileControls onInsertBase={onInsertBase} />
              </div>
              <Textarea 
                id="song-content-mobile" 
                value={content} 
                onChange={onContentChange} 
                placeholder="Comece a compor sua letra aqui..." 
                className="editor-content min-h-[350px] font-mono mt-1"
                ref={textareaRef}
                onDrop={onTextAreaDrop}
                onDragOver={(e) => e.preventDefault()}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
