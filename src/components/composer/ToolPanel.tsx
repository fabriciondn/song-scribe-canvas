import React from 'react';
import { MusicBases } from './MusicBases';
import { ThemeGenerator } from './ThemeGenerator';
import { RhymeAssistant } from './RhymeAssistant';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToolType } from './ToolSelector';

interface ToolPanelProps {
  selectedTool: ToolType;
  onInsertBase: (baseInfo: { title: string; genre: string }) => void;
}

export const ToolPanel: React.FC<ToolPanelProps> = ({
  selectedTool,
  onInsertBase
}) => {
  if (!selectedTool) return null;

  const renderTool = () => {
    switch (selectedTool) {
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

  const getToolTitle = () => {
    switch (selectedTool) {
      case 'bases':
        return 'Bases Musicais';
      case 'themes':
        return 'Gerador de Temas';
      case 'rhymes':
        return 'Assistente de Rimas';
      default:
        return '';
    }
  };

  return (
    <div className="section-box">
      <h3 className="text-lg font-medium mb-3">{getToolTitle()}</h3>
      <ScrollArea className="h-full">
        {renderTool()}
      </ScrollArea>
    </div>
  );
};