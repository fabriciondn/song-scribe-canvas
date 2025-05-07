
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

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  songTitle: string;
  songContent: string;
  onSaveComplete: () => void;
}

interface Folder {
  id: string;
  name: string;
  songs: string[];
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
  const { toast } = useToast();

  // Load folders from localStorage
  useEffect(() => {
    if (isOpen) {
      const savedFolders = localStorage.getItem('folders');
      if (savedFolders) {
        setFolders(JSON.parse(savedFolders));
      }
      setSelectedFolder(''); // Reset selection when modal opens
    }
  }, [isOpen]);

  const handleSave = () => {
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

    // Get existing songs for the selected folder
    const folderSongs = JSON.parse(localStorage.getItem(`folder_${selectedFolder}`) || '[]');
    
    // Add new song
    const newSong = {
      id: Date.now().toString(),
      title: songTitle.trim(),
      content: songContent,
      createdAt: new Date().toISOString()
    };
    
    folderSongs.push(newSong);
    localStorage.setItem(`folder_${selectedFolder}`, JSON.stringify(folderSongs));

    // Update folder data in localStorage with the new song title
    const updatedFolders = folders.map(folder => {
      if (folder.id === selectedFolder) {
        return {
          ...folder,
          songs: [...(folder.songs || []), songTitle.trim()]
        };
      }
      return folder;
    });
    localStorage.setItem('folders', JSON.stringify(updatedFolders));

    toast({
      title: 'Composição guardada',
      description: `"${songTitle || 'Sem título'}" foi guardada na pasta selecionada.`,
    });

    // Call onSaveComplete to clear the form
    onSaveComplete();
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
                {folders.map(folder => (
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
