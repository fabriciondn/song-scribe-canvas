import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Music, Lightbulb, MessageSquare, Settings, Plus, Check } from 'lucide-react';

export type ToolType = 'bases' | 'themes' | 'rhymes' | null;

interface ToolSelectorProps {
  activeTools: ToolType[];
  onAddTool: (tool: ToolType) => void;
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

export const ToolSelector: React.FC<ToolSelectorProps> = ({ activeTools, onAddTool }) => {
  const isToolActive = (toolId: ToolType) => activeTools.includes(toolId);
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2 bg-card hover:bg-accent"
        >
          <Settings className="h-4 w-4" />
          Ferramentas
          {activeTools.length > 0 && (
            <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {activeTools.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 bg-popover border-border" align="end">
        <div className="p-2">
          <div className="space-y-1">
            {tools.map((tool) => {
              const isActive = isToolActive(tool.id);
              const Icon = tool.icon;
              return (
                <Button
                  key={tool.id}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-3 h-auto p-3 text-left hover:bg-accent"
                  onClick={() => !isActive && onAddTool(tool.id)}
                  disabled={isActive}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Icon className="h-4 w-4 flex-shrink-0 text-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{tool.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{tool.description}</div>
                    </div>
                    {isActive ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    )}
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