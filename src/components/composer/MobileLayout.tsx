
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
    <div className="flex flex-col min-h-screen bg-background">
      {partnershipId ? (
        <div className="flex-1 p-4">
          <CollaborativeEditor partnershipId={partnershipId} />
        </div>
      ) : (
        <>
          {/* Main content area */}
          <div className="flex-1 p-4 pb-4 overflow-y-auto">
            {/* Title input */}
            <div className="mb-4">
              <Input 
                value={title} 
                onChange={onTitleChange} 
                placeholder="Digite o título da sua música" 
                className="text-base font-medium border-0 px-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-muted-foreground"
              />
            </div>
            
            {/* Section buttons in 3x2 grid */}
            <SectionButtons onSectionClick={onSectionClick} />
            
            {/* Textarea */}
            <div className="mt-4">
              <Textarea 
                value={content} 
                onChange={onContentChange} 
                placeholder="Comece a compor sua letra aqui..." 
                className="min-h-[40vh] border-0 px-0 bg-transparent resize-none focus:ring-0 focus:outline-none text-base leading-relaxed"
                ref={textareaRef}
                onDrop={onTextAreaDrop}
                onDragOver={(e) => e.preventDefault()}
              />
            </div>
            
            {/* Mobile controls for bases and AI tools */}
            <div className="mt-4 flex justify-center">
              <MobileControls onInsertBase={onInsertBase} />
            </div>
          </div>
          
          {/* Bottom navigation bar with main actions */}
          <div className="bg-background border-t border-border p-4 safe-area-bottom">
            <div className="flex justify-around items-center">
              <button
                onClick={onNewClick}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-xs font-medium">+</span>
                </div>
                <span className="text-xs font-medium text-muted-foreground">Novo</span>
              </button>
              
              <button
                onClick={openSaveModal}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-xs font-medium">💾</span>
                </div>
                <span className="text-xs font-medium text-muted-foreground">Salvar</span>
              </button>
              
              <button
                onClick={() => handleAddTool('rhyme' as any)}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-xs font-medium">🔧</span>
                </div>
                <span className="text-xs font-medium text-muted-foreground">Ferramentas</span>
              </button>
              
              <button
                onClick={openRegisterWorkModal}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-xs font-medium">📝</span>
                </div>
                <span className="text-xs font-medium text-muted-foreground">Registrar</span>
              </button>
            </div>
          </div>
        </>
      )}
      
      {/* Tools panel overlay when active */}
      {activeTools.length > 0 && (
        <div className="fixed inset-0 bg-background z-50">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Ferramentas</h2>
              <button
                onClick={() => setActiveTools([])}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <MultiToolPanel 
                activeTools={activeTools}
                onRemoveTool={handleRemoveTool}
                onReorderTools={handleReorderTools}
                onInsertBase={onInsertBase}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
