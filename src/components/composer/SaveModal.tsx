
import React, { useState } from 'react';
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

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  songTitle: string;
  songContent: string;
}

// Mock folder data - in a real app this would come from a database or context
const FOLDERS = [
  { id: '1', name: 'Ideias' },
  { id: '2', name: 'Rascunhos' },
  { id: '3', name: 'Finalizadas' },
];

export const SaveModal: React.FC<SaveModalProps> = ({
  isOpen,
  onClose,
  songTitle,
  songContent
}) => {
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const { toast } = useToast();

  const handleSave = () => {
    if (!selectedFolder) {
      toast({
        title: 'Selecione uma pasta',
        description: 'Por favor, selecione uma pasta para guardar sua composição.',
        variant: 'destructive',
      });
      return;
    }

    // In a real app, this would save to a database
    // For now, we'll use localStorage to simulate saving
    const folderSongs = JSON.parse(localStorage.getItem(`folder_${selectedFolder}`) || '[]');
    folderSongs.push({
      id: Date.now().toString(),
      title: songTitle || 'Sem título',
      content: songContent,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem(`folder_${selectedFolder}`, JSON.stringify(folderSongs));

    // Update folder data in localStorage
    const folders = JSON.parse(localStorage.getItem('folders') || JSON.stringify(FOLDERS));
    const updatedFolders = folders.map((folder: any) => {
      if (folder.id === selectedFolder) {
        return {
          ...folder,
          songs: [...(folder.songs || []), songTitle || 'Sem título']
        };
      }
      return folder;
    });
    localStorage.setItem('folders', JSON.stringify(updatedFolders));

    toast({
      title: 'Composição guardada',
      description: `"${songTitle || 'Sem título'}" foi guardada na pasta selecionada.`,
    });

    onClose();
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
          <div className="space-y-2">
            <Label htmlFor="folder-select">Pasta</Label>
            <Select value={selectedFolder} onValueChange={setSelectedFolder}>
              <SelectTrigger id="folder-select">
                <SelectValue placeholder="Selecione uma pasta" />
              </SelectTrigger>
              <SelectContent>
                {FOLDERS.map(folder => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
