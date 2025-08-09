
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
    <div className="mb-2 bg-card py-1.5 px-2 sm:py-2 sm:px-4 rounded-lg shadow-sm sticky top-0 border border-border">
      {partnershipId && (
        <div className="flex items-center bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full text-xs mb-2 sm:mb-0 sm:absolute sm:left-4">
          <Users className="h-3 w-3 mr-1" />
          <span className="hidden sm:inline">Modo Colaborativo</span>
          <span className="sm:hidden">Colaborativo</span>
        </div>
      )}
      
      {/* Mobile Layout - Stack buttons vertically */}
      <div className="sm:hidden space-y-2 pt-1">
        <div className="flex gap-1 justify-center">
          <Button 
            variant="outline"
            onClick={onNewClick}
            size="sm"
            disabled={!!partnershipId}
            className="text-xs px-2 py-1 h-8"
          >
            <FileText className="h-3 w-3 mr-1" />
            Nova
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
            className="text-xs px-2 py-1 h-8"
          >
            <Save className="h-3 w-3 mr-1" />
            Salvar
          </Button>
        </div>
        
        <div className="flex justify-center">
          <Button 
            variant="default"
            onClick={openRegisterWorkModal}
            size="sm"
            className="text-xs px-3 py-1 h-8 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Award className="h-3 w-3 mr-1" />
            Registrar obra
          </Button>
        </div>
      </div>
      
      {/* Desktop Layout - Horizontal */}
      <div className="hidden sm:flex justify-center items-center">
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
    </div>
  );
};
