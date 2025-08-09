
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { SectionButtons } from './SectionButtons';
import { EditorHeader } from './EditorHeader';
import { MobileControls } from './MobileControls';
import { CollaborativeEditor } from './CollaborativeEditor';
import { MultiToolPanel } from './MultiToolPanel';
import { ToolType } from './ToolSelector';

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
  openRegisterWorkModal: () => void;
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
  openRegisterWorkModal,
  onInsertBase
}) => {
  const [activeTools, setActiveTools] = useState<ToolType[]>([]);

  const handleAddTool = (tool: ToolType) => {
    if (tool && !activeTools.includes(tool)) {
      setActiveTools(prev => [...prev, tool]);
    }
  };

  const handleRemoveTool = (tool: ToolType) => {
    setActiveTools(prev => prev.filter(t => t !== tool));
  };

  const handleReorderTools = (newOrder: ToolType[]) => {
    setActiveTools(newOrder);
  };
  return (
    <div className="flex flex-col gap-2 p-2 pb-20 sm:pb-2 safe-area-inset">
      <div className="bg-card rounded-lg shadow-sm p-2 sm:p-3 border border-border">
        <EditorHeader 
          partnershipId={partnershipId}
          onNewClick={onNewClick}
          openSaveModal={openSaveModal}
          openRegisterWorkModal={openRegisterWorkModal}
          activeTools={activeTools}
          onAddTool={handleAddTool}
        />
        
        {partnershipId ? (
          <CollaborativeEditor partnershipId={partnershipId} />
        ) : (
          <>
            <div className="mb-2 sm:mb-3 mt-2 sm:mt-3">
              <Label htmlFor="song-title-mobile" className="text-sm">Título</Label>
              <Input 
                id="song-title-mobile" 
                value={title} 
                onChange={onTitleChange} 
                placeholder="Digite o título da sua música" 
                className="mt-1 text-sm" 
              />
            </div>
            
            <SectionButtons onSectionClick={onSectionClick} />
            
            <div className="mt-2 sm:mt-3">
              <div className="flex justify-between items-center mb-1">
                <Label htmlFor="song-content-mobile" className="text-sm">Letra</Label>
                <MobileControls onInsertBase={onInsertBase} />
              </div>
              <Textarea 
                id="song-content-mobile" 
                value={content} 
                onChange={onContentChange} 
                placeholder="Comece a compor sua letra aqui..." 
                className="editor-content min-h-[250px] sm:min-h-[300px] font-mono mt-1 text-xs sm:text-sm"
                ref={textareaRef}
                onDrop={onTextAreaDrop}
                onDragOver={(e) => e.preventDefault()}
              />
            </div>
          </>
        )}
      </div>
      
      {/* Painel de ferramentas móvel */}
      {activeTools.length > 0 && (
        <div className="safe-area-inset px-1 sm:px-2 mb-16 sm:mb-0">
          <MultiToolPanel 
            activeTools={activeTools}
            onRemoveTool={handleRemoveTool}
            onReorderTools={handleReorderTools}
            onInsertBase={onInsertBase}
          />
        </div>
      )}
    </div>
  );
};
