import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Folder, Music } from 'lucide-react';

interface FolderLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  currentFolders: number;
  maxFolders: number;
  currentBases?: number;
  maxBasesPerFolder?: number;
  limitType: 'folder' | 'base';
}

export const FolderLimitModal: React.FC<FolderLimitModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  currentFolders,
  maxFolders,
  currentBases = 0,
  maxBasesPerFolder = 3,
  limitType
}) => {
  const isFolder = limitType === 'folder';
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isFolder ? <Folder className="h-5 w-5" /> : <Music className="h-5 w-5" />}
            Limite Atingido
          </DialogTitle>
          <DialogDescription>
            {isFolder 
              ? `Você atingiu o limite de ${maxFolders} pastas gratuitas.`
              : `Você atingiu o limite de ${maxBasesPerFolder} bases por pasta.`
            }
          </DialogDescription>
        </DialogHeader>

        <Card className="border-muted">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Upgrade de Bases Musicais</CardTitle>
            <CardDescription>
              {isFolder 
                ? 'Adicione mais pastas para organizar melhor suas bases'
                : 'Adicione mais bases à sua pasta atual'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Folder className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {isFolder ? 'Nova Pasta' : 'Mais Bases por Pasta'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isFolder ? 'Cada pasta adicional' : 'Aumentar limite para 10 bases'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">R$ 10,00</p>
                <p className="text-xs text-muted-foreground">pagamento único</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Plano Atual:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-muted-foreground" />
                  <span>{currentFolders}/{maxFolders} pastas</span>
                </div>
                {!isFolder && (
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-muted-foreground" />
                    <span>{currentBases}/{maxBasesPerFolder} bases</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onUpgrade} className="gap-2">
            <CreditCard className="h-4 w-4" />
            Fazer Upgrade - R$ 10,00
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};