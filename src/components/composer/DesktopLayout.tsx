
import React, { useState } from 'react';
import { EditorHeader } from './EditorHeader';
import { SoloEditor } from './SoloEditor';
import { MultiToolPanel } from './MultiToolPanel';
import { ToolType } from './ToolSelector';

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
  openRegisterWorkModal: () => void;
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
    <div className={activeTools.length > 0 ? "container-editor" : "container-editor-centered"}>
      {/* Coluna Central: Editor */}
      <div className="section-box flex flex-col">
        <EditorHeader 
          partnershipId={partnershipId}
          onNewClick={onNewClick}
          openSaveModal={openSaveModal}
          openRegisterWorkModal={openRegisterWorkModal}
          activeTools={activeTools}
          onAddTool={handleAddTool}
        />
        
        <SoloEditor
          title={title}
          content={content}
          onTitleChange={onTitleChange}
          onContentChange={onContentChange}
          onSectionClick={onSectionClick}
          onTextAreaDrop={onTextAreaDrop}
          textareaRef={textareaRef}
        />
      </div>
      
      {/* Painel de Múltiplas Ferramentas */}
      {activeTools.length > 0 && (
        <MultiToolPanel 
          activeTools={activeTools}
          onRemoveTool={handleRemoveTool}
          onReorderTools={handleReorderTools}
          onInsertBase={onInsertBase}
        />
      )}
    </div>
  );
};
