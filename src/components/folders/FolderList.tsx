
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
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Folder as FolderType, Song, getFolders, createFolder, deleteFolder, getSongsByFolderId } from '@/services/folderService';
import { Skeleton } from '@/components/ui/skeleton';

export const FolderList: React.FC = () => {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [folderSongs, setFolderSongs] = useState<Record<string, string[]>>({});
  const [newFolderName, setNewFolderName] = useState('');
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Verificar autenticação
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/');
      toast({
        title: 'Acesso negado',
        description: 'Você precisa estar logado para acessar esta página.',
        variant: 'destructive',
      });
    } else if (isAuthenticated && !authLoading) {
      loadFolders();
    }
  }, [isAuthenticated, authLoading, navigate, toast]);
  
  // Carregar pastas do Supabase
  const loadFolders = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const foldersData = await getFolders();
      setFolders(foldersData);
      
      // Carregar músicas de cada pasta
      const songsMap: Record<string, string[]> = {};
      for (const folder of foldersData) {
        const songs = await getSongsByFolderId(folder.id);
        songsMap[folder.id] = songs.map(song => song.title);
      }
      setFolderSongs(songsMap);
    } catch (error) {
      console.error('Erro ao carregar pastas:', error);
      toast({
        title: 'Erro ao carregar pastas',
        description: 'Não foi possível carregar suas pastas.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: 'Nome inválido',
        description: 'Por favor, insira um nome para a pasta.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const newFolder = await createFolder(newFolderName);
      setFolders(prev => [newFolder, ...prev]);
      setFolderSongs(prev => ({...prev, [newFolder.id]: []}));
      setNewFolderName('');
      setIsNewFolderModalOpen(false);
      
      toast({
        title: 'Pasta criada',
        description: `A pasta "${newFolderName}" foi criada com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao criar pasta:', error);
      toast({
        title: 'Erro ao criar pasta',
        description: 'Não foi possível criar a pasta.',
        variant: 'destructive',
      });
    }
  };
  
  const handleDeleteFolder = async (folderId: string) => {
    try {
      await deleteFolder(folderId);
      setFolders(prev => prev.filter(folder => folder.id !== folderId));
      
      toast({
        title: 'Pasta excluída',
        description: 'A pasta foi excluída com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao excluir pasta:', error);
      toast({
        title: 'Erro ao excluir pasta',
        description: 'Não foi possível excluir a pasta.',
        variant: 'destructive',
      });
    }
  };
  
  const handleFolderClick = (folderId: string) => {
    navigate(`/folders/${folderId}`);
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-52 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Suas Pastas</h2>
        <Button onClick={() => setIsNewFolderModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Pasta
        </Button>
      </div>
      
      {folders.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/10">
          <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium mb-2">Nenhuma pasta encontrada</h3>
          <p className="text-muted-foreground mb-6">Crie uma pasta para começar a organizar suas composições.</p>
          <Button onClick={() => setIsNewFolderModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Pasta
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {folders.map(folder => (
            <div 
              key={folder.id} 
              className="folder-card p-4 border rounded-lg hover:border-primary cursor-pointer transition-all"
              onClick={() => handleFolderClick(folder.id)}
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
                {(!folderSongs[folder.id] || folderSongs[folder.id].length === 0) ? (
                  <p>Pasta vazia</p>
                ) : (
                  <ul className="space-y-2">
                    {folderSongs[folder.id].slice(0, 3).map((songTitle, idx) => (
                      <li key={idx} className="flex items-center">
                        <File className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{songTitle}</span>
                      </li>
                    ))}
                    {folderSongs[folder.id].length > 3 && (
                      <li className="text-xs text-muted-foreground">
                        +{folderSongs[folder.id].length - 3} mais...
                      </li>
                    )}
                  </ul>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs">
                  {folderSongs[folder.id]?.length || 0} {(folderSongs[folder.id]?.length || 0) === 1 ? 'item' : 'itens'}
                </p>
                {folder.created_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Criado em {new Date(folder.created_at).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
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
