
import React from 'react';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

interface EditorHeaderProps {
  partnershipId: string | null;
  onNewClick: () => void;
  openSaveModal: () => void;
  openDAModal: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  partnershipId,
  onNewClick,
  openSaveModal,
  openDAModal
}) => {
  return (
    <div className="flex justify-between items-center mb-2 bg-white py-2 px-3 rounded-lg shadow-sm sticky top-0">
      <div className="flex items-center">
        <img 
          src="/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png" 
          alt="Logo" 
          className="h-8" 
        />
        <span className="ml-2 font-semibold text-lg">Compuse</span>
        {partnershipId && (
          <div className="ml-3 flex items-center bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs">
            <Users className="h-3 w-3 mr-1" />
            Modo Colaborativo
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="default" 
          className="bg-orange-500 hover:bg-orange-600" 
          onClick={onNewClick}
          size="sm"
          disabled={!!partnershipId}
        >
          Nova
        </Button>
        
        <Button 
          variant="default"
          className="bg-purple-600 hover:bg-purple-700"
          onClick={openSaveModal}
          size="sm"
          disabled={!!partnershipId}
        >
          Salvar
        </Button>
        
        <Button 
          variant="default"
          className="bg-purple-600 hover:bg-purple-700"
          onClick={openDAModal}
          size="sm"
        >
          Gerar DA
        </Button>
      </div>
    </div>
  );
};
