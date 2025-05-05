
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Folder, File, Edit, Trash2 } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

// Simple mock data
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
  
  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    
    const newFolder = {
      id: Date.now().toString(),
      name: newFolderName,
      songs: [],
    };
    
    setFolders([...folders, newFolder]);
    setNewFolderName('');
    setIsNewFolderModalOpen(false);
    
    toast({
      title: 'Pasta criada',
      description: `A pasta "${newFolderName}" foi criada com sucesso.`,
    });
  };
  
  const handleDeleteFolder = (folderId: string) => {
    setFolders(folders.filter(folder => folder.id !== folderId));
    
    toast({
      title: 'Pasta excluída',
      description: 'A pasta foi excluída com sucesso.',
    });
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
            className="folder-card"
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
              {folder.songs.length === 0 ? (
                <p>Pasta vazia</p>
              ) : (
                <ul className="space-y-2">
                  {folder.songs.map((song, idx) => (
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
                {folder.songs.length} {folder.songs.length === 1 ? 'item' : 'itens'}
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
