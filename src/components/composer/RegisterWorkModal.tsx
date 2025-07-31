import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface RegisterWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReview: () => void;
  onProceed: () => void;
}

export const RegisterWorkModal: React.FC<RegisterWorkModalProps> = ({
  isOpen,
  onClose,
  onReview,
  onProceed
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Atenção - Registro de Obra
          </DialogTitle>
          <DialogDescription className="text-left">
            Antes de prosseguir com o registro da obra, é importante revisar com atenção a letra para verificar:
            <br /><br />
            • Erros de ortografia
            <br />
            • Erros de digitação
            <br />
            • Estrutura e formatação
            <br /><br />
            Uma vez registrada, a obra não poderá ser facilmente alterada.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={onReview}
            className="w-full sm:w-auto"
          >
            Revisar
          </Button>
          <Button 
            onClick={onProceed}
            className="w-full sm:w-auto"
          >
            Prosseguir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};