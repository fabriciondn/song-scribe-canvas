import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Music, Lightbulb, MessageSquare, Settings } from 'lucide-react';

export type ToolType = 'bases' | 'themes' | 'rhymes' | null;

interface ToolSelectorProps {
  selectedTool: ToolType;
  onToolSelect: (tool: ToolType) => void;
}

const tools = [
  {
    id: 'bases' as ToolType,
    name: 'Bases Musicais',
    icon: Music,
    description: 'Escolha bases musicais para sua composição'
  },
  {
    id: 'themes' as ToolType,
    name: 'Gerador de Temas',
    icon: Lightbulb,
    description: 'Gere ideias e temas para suas músicas'
  },
  {
    id: 'rhymes' as ToolType,
    name: 'Assistente de Rimas',
    icon: MessageSquare,
    description: 'Encontre rimas perfeitas para seus versos'
  }
];

export const ToolSelector: React.FC<ToolSelectorProps> = ({
  selectedTool,
  onToolSelect
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
        >
          <Settings size={18} />
          Ferramentas
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground mb-3">
            Selecione uma ferramenta de composição
          </div>
          
          {selectedTool && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToolSelect(null)}
              className="w-full justify-start text-destructive hover:text-destructive"
            >
              Fechar ferramenta atual
            </Button>
          )}
          
          <div className="border-t pt-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const isSelected = selectedTool === tool.id;
              
              return (
                <Button
                  key={tool.id}
                  variant={isSelected ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => onToolSelect(tool.id)}
                  className="w-full justify-start h-auto p-3"
                  disabled={isSelected}
                >
                  <div className="flex items-start gap-3 text-left">
                    <Icon size={18} className="mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{tool.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {tool.description}
                      </div>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};