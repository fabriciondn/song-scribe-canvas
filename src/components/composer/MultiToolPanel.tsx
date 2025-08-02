import React, { useState } from 'react';
import { X, GripVertical, Music, Lightbulb, Spade } from 'lucide-react';
import { MusicBases } from './MusicBases';
import { ThemeGenerator } from './ThemeGenerator';
import { RhymeAssistant } from './RhymeAssistant';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ToolType } from './ToolSelector';

interface ActiveTool {
  id: string;
  type: ToolType;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MultiToolPanelProps {
  activeTools: ToolType[];
  onRemoveTool: (toolType: ToolType) => void;
  onReorderTools: (newOrder: ToolType[]) => void;
  onInsertBase: (baseInfo: { title: string; genre: string }) => void;
}

const toolConfigs: Record<string, { title: string; icon: React.ComponentType<{ className?: string }> }> = {
  'bases': { title: 'Bases Musicais', icon: Music },
  'themes': { title: 'Gerador de Temas', icon: Lightbulb },
  'rhymes': { title: 'Assistente de Rimas', icon: Spade }
};

export const MultiToolPanel: React.FC<MultiToolPanelProps> = ({
  activeTools,
  onRemoveTool,
  onReorderTools,
  onInsertBase
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    
    const newOrder = [...activeTools];
    const draggedTool = newOrder[draggedIndex];
    
    // Remove o item da posição original
    newOrder.splice(draggedIndex, 1);
    // Insere na nova posição
    newOrder.splice(dropIndex, 0, draggedTool);
    
    onReorderTools(newOrder);
    setDraggedIndex(null);
  };

  const renderTool = (toolType: ToolType) => {
    switch (toolType) {
      case 'bases':
        return <MusicBases onInsertBase={onInsertBase} />;
      case 'themes':
        return <ThemeGenerator />;
      case 'rhymes':
        return <RhymeAssistant />;
      default:
        return null;
    }
  };

  if (activeTools.length === 0) return null;

    return (
      <div className="space-y-4">
        {activeTools.map((toolType, index) => {
        if (!toolType) return null;
        
        const config = toolConfigs[toolType as string];
        const Icon = config.icon;
        
        return (
          <div
            key={`${toolType}-${index}`}
            className={`section-box transition-opacity duration-200 ${
              draggedIndex === index ? 'opacity-50' : 'opacity-100'
            }`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
            {/* Header da ferramenta com controles */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium truncate">{config.title}</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveTool(toolType)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Conteúdo da ferramenta */}
            <ScrollArea className="h-[400px]">
              {renderTool(toolType)}
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
};