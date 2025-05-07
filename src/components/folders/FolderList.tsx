
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Folder, File, Trash2 } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

// Initial folder data
const INITIAL_FOLDERS = [
  { id: '1', name: 'Ideias', songs: ['Ideia para balada', 'Conceito de música pop'] },
  { id: '2', name: 'Rascunhos', songs: ['Primeiro rascunho - Rock'] },
  { id: '3', name: 'Finalizadas', songs: ['Canção do Verão', 'Balada de Inverno'] },
];

export const FolderList: React.FC = () => {
  const [folders, setFolders] = useState(INITIAL_FOLDERS);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  
  const { toast } = useToast();
  
  // Load folders from localStorage on initial render
  useEffect(() => {
    const savedFolders = localStorage.getItem('folders');
    if (savedFolders) {
      setFolders(JSON.parse(savedFolders));
    } else {
      // Initialize localStorage with default folders
      localStorage.setItem('folders', JSON.stringify(INITIAL_FOLDERS));
    }
  }, []);
  
  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    
    const newFolder = {
      id: Date.now().toString(),
      name: newFolderName,
      songs: [],
    };
    
    const updatedFolders = [...folders, newFolder];
    setFolders(updatedFolders);
    localStorage.setItem('folders', JSON.stringify(updatedFolders));
    
    setNewFolderName('');
    setIsNewFolderModalOpen(false);
    
    toast({
      title: 'Pasta criada',
      description: `A pasta "${newFolderName}" foi criada com sucesso.`,
    });
  };
  
  const handleDeleteFolder = (folderId: string) => {
    const updatedFolders = folders.filter(folder => folder.id !== folderId);
    setFolders(updatedFolders);
    localStorage.setItem('folders', JSON.stringify(updatedFolders));
    
    // Remove songs saved in this folder
    localStorage.removeItem(`folder_${folderId}`);
    
    toast({
      title: 'Pasta excluída',
      description: 'A pasta foi excluída com sucesso.',
    });
  };

  // Get songs for each folder from localStorage
  const getFolderSongs = (folderId: string) => {
    const savedSongs = localStorage.getItem(`folder_${folderId}`);
    if (savedSongs) {
      const parsedSongs = JSON.parse(savedSongs);
      return parsedSongs.map((song: any) => song.title || 'Sem título');
    }
    
    // Return default songs if none in localStorage
    const folder = folders.find(f => f.id === folderId);
    return folder?.songs || [];
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Suas Pastas</h2>
        <Button onClick={() => setIsNewFolderModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Pasta
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {folders.map(folder => (
          <div 
            key={folder.id} 
            className="folder-card p-4 border rounded-lg hover:border-primary cursor-pointer transition-all"
            onClick={() => setSelectedFolder(folder.id)}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <Folder className="h-10 w-10 text-primary mr-2" />
                <h3 className="text-lg font-semibold">{folder.name}</h3>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFolder(folder.id);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            
            <div className="mt-4 text-sm text-muted-foreground">
              {getFolderSongs(folder.id).length === 0 ? (
                <p>Pasta vazia</p>
              ) : (
                <ul className="space-y-2">
                  {getFolderSongs(folder.id).map((song: string, idx: number) => (
                    <li key={idx} className="flex items-center">
                      <File className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{song}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs">
                {getFolderSongs(folder.id).length} {getFolderSongs(folder.id).length === 1 ? 'item' : 'itens'}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {/* New Folder Dialog */}
      <Dialog open={isNewFolderModalOpen} onOpenChange={setIsNewFolderModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Pasta</DialogTitle>
            <DialogDescription>
              Crie uma nova pasta para organizar suas composições.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Nome da pasta"
              autoFocus
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewFolderModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddFolder}>
              Criar Pasta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
