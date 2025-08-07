import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Construction, TestTube, Info, X } from 'lucide-react';

interface FunctionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'coming_soon' | 'beta' | 'available';
  functionName: string;
  functionDescription?: string;
}

export function FunctionStatusModal({ 
  isOpen, 
  onClose, 
  status, 
  functionName, 
  functionDescription 
}: FunctionStatusModalProps) {
  const getStatusContent = () => {
    switch (status) {
      case 'coming_soon':
        return {
          icon: <Construction className="h-12 w-12 text-amber-500" />,
          title: 'Função em Desenvolvimento',
          description: functionDescription || `A funcionalidade "${functionName}" está sendo desenvolvida e estará disponível em breve. Acompanhe as atualizações!`,
          badge: { variant: 'destructive' as const, text: 'Em Breve' }
        };
      case 'beta':
        return {
          icon: <TestTube className="h-12 w-12 text-blue-500" />,
          title: 'Função em Beta',
          description: functionDescription || `A funcionalidade "${functionName}" está em fase beta. Algumas características podem estar incompletas ou sofrer alterações.`,
          badge: { variant: 'secondary' as const, text: 'Beta' }
        };
      default:
        return null;
    }
  };

  const content = getStatusContent();
  
  if (!content || status === 'available') return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {content.icon}
              <div>
                <DialogTitle className="text-lg font-semibold">
                  {content.title}
                </DialogTitle>
                <Badge variant={content.badge.variant} className="mt-1">
                  {content.badge.text}
                </Badge>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <DialogDescription className="text-muted-foreground leading-relaxed">
          {content.description}
        </DialogDescription>
        <div className="flex justify-end mt-4">
          <Button onClick={onClose} variant="outline">
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}