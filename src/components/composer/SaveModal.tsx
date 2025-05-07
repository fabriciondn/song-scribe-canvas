
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Folder } from '@/services/folderService';
import * as folderService from '@/services/folderService';
import { Loader2 } from 'lucide-react';

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  songTitle: string;
  songContent: string;
  onSaveComplete: () => void;
}

export const SaveModal: React.FC<SaveModalProps> = ({
  isOpen,
  onClose,
  songTitle,
  songContent,
  onSaveComplete
}) => {
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load folders from Supabase when modal opens
  useEffect(() => {
    const loadFolders = async () => {
      if (isOpen) {
        setIsLoading(true);
        try {
          // Ensure Backup folder exists
          await folderService.ensureBackupFolderExists();
          
          const fetchedFolders = await folderService.getFolders();
          setFolders(fetchedFolders);
        } catch (error) {
          console.error('Error fetching folders:', error);
          toast({
            title: 'Erro ao carregar pastas',
            description: 'Não foi possível carregar suas pastas.',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
          setSelectedFolder(''); // Reset selection when modal opens
        }
      }
    };
    
    loadFolders();
  }, [isOpen, toast]);

  const handleSave = async () => {
    if (!selectedFolder) {
      toast({
        title: 'Selecione uma pasta',
        description: 'Por favor, selecione uma pasta para guardar sua composição.',
        variant: 'destructive',
      });
      return;
    }

    if (!songTitle.trim()) {
      toast({
        title: 'Título necessário',
        description: 'Por favor, adicione um título à sua composição antes de salvar.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Save the song to the selected folder
      await folderService.createSong({
        title: songTitle.trim(),
        content: songContent,
        folder_id: selectedFolder
      });
      
      toast({
        title: 'Composição guardada',
        description: `"${songTitle || 'Sem título'}" foi guardada na pasta selecionada.`,
      });

      // Call onSaveComplete to clear the form
      onSaveComplete();
      onClose();
    } catch (error) {
      console.error('Error saving song:', error);
      toast({
        title: 'Erro ao guardar',
        description: 'Ocorreu um erro ao guardar sua composição.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Guardar Composição</DialogTitle>
          <DialogDescription>
            Escolha uma pasta para guardar sua composição
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="folder-select">Pasta</Label>
              <Select value={selectedFolder} onValueChange={setSelectedFolder} disabled={isLoading}>
                <SelectTrigger id="folder-select">
                  <SelectValue placeholder="Selecione uma pasta" />
                </SelectTrigger>
                <SelectContent>
                  {folders.length === 0 ? (
                    <SelectItem value="no-folders" disabled>
                      Nenhuma pasta encontrada
                    </SelectItem>
                  ) : (
                    folders.map(folder => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name} {folder.is_system ? '(Sistema)' : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {folders.length === 0 && !isLoading && (
                <p className="text-xs text-muted-foreground mt-1">
                  Você precisa criar pastas na aba "Pastas" antes de salvar.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading || folders.length === 0}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Guardar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
