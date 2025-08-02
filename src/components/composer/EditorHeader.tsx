
import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, FileText, Save, Award } from 'lucide-react';
import { ToolSelector, ToolType } from './ToolSelector';

interface EditorHeaderProps {
  partnershipId: string | null;
  onNewClick: () => void;
  openSaveModal: () => void;
  openRegisterWorkModal: () => void;
  activeTools?: ToolType[];
  onAddTool?: (tool: ToolType) => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  partnershipId,
  onNewClick,
  openSaveModal,
  openRegisterWorkModal,
  activeTools = [],
  onAddTool
}) => {
  return (
    <div className="flex justify-between items-center mb-2 bg-card py-2 px-3 rounded-lg shadow-sm sticky top-0 border border-border">
      <div className="flex items-center">
        {partnershipId && (
          <div className="flex items-center bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full text-xs">
            <Users className="h-3 w-3 mr-1" />
            Modo Colaborativo
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="secondary"
          onClick={onNewClick}
          size="sm"
          disabled={!!partnershipId}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Nova letra
        </Button>
        
        <Button 
          variant="default"
          onClick={openSaveModal}
          size="sm"
          disabled={!!partnershipId}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          Salvar
        </Button>
        
        <Button 
          variant="outline"
          onClick={openRegisterWorkModal}
          size="sm"
          className="gap-2 text-primary border-primary hover:bg-primary hover:text-primary-foreground"
        >
          <Award className="h-4 w-4" />
          Registrar obra
        </Button>
        
        {onAddTool && (
          <ToolSelector 
            activeTools={activeTools}
            onAddTool={onAddTool}
          />
        )}
      </div>
    </div>
  );
};
