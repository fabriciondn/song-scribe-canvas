
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
    <div className="flex justify-center items-center mb-2 bg-card py-2 px-4 rounded-lg shadow-sm sticky top-0 border border-border">
      {partnershipId && (
        <div className="flex items-center bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full text-xs absolute left-4">
          <Users className="h-3 w-3 mr-1" />
          Modo Colaborativo
        </div>
      )}
      
      <div className="flex gap-2">
        <Button 
          variant="outline"
          onClick={onNewClick}
          size="sm"
          disabled={!!partnershipId}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Nova letra
        </Button>
        
        {onAddTool && (
          <ToolSelector 
            activeTools={activeTools}
            onAddTool={onAddTool}
          />
        )}
        
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
          variant="default"
          onClick={openRegisterWorkModal}
          size="sm"
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Award className="h-4 w-4" />
          Registrar obra
        </Button>
      </div>
    </div>
  );
};
