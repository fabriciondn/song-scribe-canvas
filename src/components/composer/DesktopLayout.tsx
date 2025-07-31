
import React, { useState } from 'react';
import { EditorHeader } from './EditorHeader';
import { SoloEditor } from './SoloEditor';
import { CollaborativeEditor } from './CollaborativeEditor';
import { ToolPanel } from './ToolPanel';
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
  const [selectedTool, setSelectedTool] = useState<ToolType>(null);

  return (
    <div className={selectedTool ? "container-editor" : "container-editor-centered"}>
      {/* Coluna Central: Editor */}
      <div className="section-box flex flex-col">
        <EditorHeader 
          partnershipId={partnershipId}
          onNewClick={onNewClick}
          openSaveModal={openSaveModal}
          openDAModal={openDAModal}
          selectedTool={selectedTool}
          onToolSelect={setSelectedTool}
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
      
      {/* Painel de Ferramentas - só aparece quando uma ferramenta está selecionada */}
      <ToolPanel 
        selectedTool={selectedTool}
        onInsertBase={onInsertBase}
      />
    </div>
  );
};
