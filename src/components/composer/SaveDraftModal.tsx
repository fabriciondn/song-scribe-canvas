import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Folder } from '@/services/folderService';
import * as folderService from '@/services/folderService';

interface SaveDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, folderId: string) => Promise<void>;
  currentTitle: string;
  currentContent: string;
}

export const SaveDraftModal: React.FC<SaveDraftModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentTitle,
  currentContent
}) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [draftTitle, setDraftTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setDraftTitle(currentTitle || 'Rascunho sem título');
      loadFolders();
    }
  }, [isOpen, currentTitle]);

  const loadFolders = async () => {
    setIsLoading(true);
    try {
      const fetchedFolders = await folderService.getFolders();
      setFolders(fetchedFolders);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as pastas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedFolder || !draftTitle.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione uma pasta e informe um título.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(draftTitle.trim(), selectedFolder);
      onClose();
      setSelectedFolder('');
      setDraftTitle('');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o rascunho.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Salvar como Rascunho</DialogTitle>
          <DialogDescription>
            Escolha uma pasta e defina um título para salvar a letra atual como rascunho.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="draft-title">Título do Rascunho</Label>
            <Input
              id="draft-title"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="Digite o título do rascunho"
            />
          </div>
          
          <div>
            <Label htmlFor="folder-select">Pasta de Destino</Label>
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Carregando pastas...</span>
              </div>
            ) : (
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma pasta" />
                </SelectTrigger>
                <SelectContent>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};