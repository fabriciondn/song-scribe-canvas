import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Folder as FolderType,
  getFolders,
  createFolder,
  deleteFolder,
  renameFolder,
  getSongsInFolder
} from '@/services/folderService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowLeft,
  Search, 
  Folder, 
  FolderPlus, 
  Plus,
  MoreVertical,
  SlidersHorizontal,
  Mic,
  FileEdit,
  Music,
  Trash2,
  Edit
} from 'lucide-react';
import { MobileBottomNavigation } from './MobileBottomNavigation';

// Get folder icon colors based on index
const getFolderIconConfig = (index: number) => {
  const configs = [
    { bgClass: 'bg-primary/10', textClass: 'text-primary', Icon: Folder },
    { bgClass: 'bg-purple-500/10', textClass: 'text-purple-400', Icon: FileEdit },
    { bgClass: 'bg-blue-500/10', textClass: 'text-blue-400', Icon: Music },
    { bgClass: 'bg-orange-500/10', textClass: 'text-orange-400', Icon: Mic },
    { bgClass: 'bg-pink-500/10', textClass: 'text-pink-400', Icon: Folder },
    { bgClass: 'bg-cyan-500/10', textClass: 'text-cyan-400', Icon: Folder },
  ];
  return configs[index % configs.length];
};

export const MobileFoldersPage: React.FC = () => {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [folderCounts, setFolderCounts] = useState<Record<string, number>>({});
  const [newFolderName, setNewFolderName] = useState('');
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [deletingFolder, setDeletingFolder] = useState<FolderType | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Load folders on mount
  useEffect(() => {
    if (user) {
      loadFolders();
    }
  }, [user]);

  const loadFolders = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const foldersData = await getFolders();
      // Filter out system folders
      const userFolders = foldersData.filter(f => !f.is_system);
      setFolders(userFolders);
      
      // Load counts for each folder
      const counts: Record<string, number> = {};
      for (const folder of userFolders) {
        try {
          const songs = await getSongsInFolder(folder.id);
          counts[folder.id] = songs.length;
        } catch {
          counts[folder.id] = 0;
        }
      }
      setFolderCounts(counts);
    } catch (error) {
      console.error('Erro ao carregar pastas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar suas pastas.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!user || !newFolderName.trim()) return;
    
    try {
      await createFolder(newFolderName.trim());
      setNewFolderName('');
      setIsNewFolderModalOpen(false);
      loadFolders();
      toast({
        title: 'Pasta criada',
        description: `A pasta "${newFolderName}" foi criada com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao criar pasta:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a pasta.',
        variant: 'destructive',
      });
    }
  };

  const handleRenameFolder = async () => {
    if (!editingFolder || !editFolderName.trim()) return;
    
    try {
      await renameFolder(editingFolder.id, editFolderName.trim());
      setEditingFolder(null);
      setEditFolderName('');
      loadFolders();
      toast({
        title: 'Pasta renomeada',
        description: 'A pasta foi renomeada com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao renomear pasta:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível renomear a pasta.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteFolder = async () => {
    if (!deletingFolder) return;
    
    try {
      await deleteFolder(deletingFolder.id);
      setDeletingFolder(null);
      loadFolders();
      toast({
        title: 'Pasta excluída',
        description: 'A pasta foi excluída com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao excluir pasta:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a pasta.',
        variant: 'destructive',
      });
    }
  };

  const handleFolderClick = (folderId: string) => {
    navigate(`/dashboard/folders/${folderId}`);
  };

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTimeAgo = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: false,
        locale: ptBR,
      });
    } catch {
      return '';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        {/* Header Skeleton */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-12 w-full rounded-xl" />
        </header>
        
        {/* Grid Skeleton */}
        <main className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-2xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition hover:bg-muted"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Minhas Pastas</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition hover:bg-muted">
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="mt-4">
          <div className="relative flex w-full items-center">
            <Search className="absolute left-4 h-5 w-5 text-primary" />
            <Input
              type="text"
              placeholder="Buscar pasta, projeto ou letra..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-xl border-none bg-muted pl-12 pr-4 text-base text-foreground placeholder-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 p-4">
        {/* Grid Header */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Recentes</span>
          <button className="text-sm font-bold text-primary hover:underline">Ver tudo</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Add New Folder Card - Always First */}
          <div
            onClick={() => setIsNewFolderModalOpen(true)}
            className="group relative aspect-square overflow-hidden rounded-2xl border-2 border-dashed border-border/50 hover:border-primary/50 bg-transparent transition cursor-pointer flex flex-col items-center justify-center gap-2"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium text-muted-foreground group-hover:text-primary">Nova Pasta</span>
          </div>

          {filteredFolders.map((folder, index) => {
            const iconConfig = getFolderIconConfig(index);
            const count = folderCounts[folder.id] || 0;
            const timeAgo = getTimeAgo(folder.updated_at);
            
            return (
              <div
                key={folder.id}
                onClick={() => handleFolderClick(folder.id)}
                className="group relative aspect-square overflow-hidden rounded-2xl bg-muted border border-border/50 transition hover:border-primary/50 cursor-pointer"
              >
                <div className="flex h-full flex-col justify-between p-4">
                  <div className="flex justify-between items-start">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${iconConfig.bgClass} ${iconConfig.textClass}`}>
                      <iconConfig.Icon className="h-7 w-7" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="rounded-full p-1 text-muted-foreground hover:text-foreground">
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFolder(folder);
                            setEditFolderName(folder.name);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Renomear
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingFolder(folder);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div>
                    <h3 className="line-clamp-1 text-lg font-bold leading-tight text-foreground group-hover:text-primary transition-colors">
                      {folder.name}
                    </h3>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">
                      {count} {count === 1 ? 'item' : 'itens'}
                      {timeAgo && ` • Editado há ${timeAgo}`}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredFolders.length === 0 && !isLoading && (
          <div className="mt-8 flex flex-col items-center justify-center text-center">
            <Folder className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'Nenhuma pasta encontrada' : 'Você ainda não tem pastas'}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setIsNewFolderModalOpen(true)}
                className="mt-4"
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                Criar primeira pasta
              </Button>
            )}
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <p className="text-xs text-muted-foreground/60">
            Mostrando {filteredFolders.length} de {folders.length} pastas
          </p>
        </div>
      </main>

      {/* Bottom Navigation */}
      <MobileBottomNavigation />

      {/* Create Folder Modal */}
      <Dialog open={isNewFolderModalOpen} onOpenChange={setIsNewFolderModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Pasta</DialogTitle>
            <DialogDescription>
              Digite um nome para sua nova pasta.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Nome da pasta"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewFolderModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Modal */}
      <Dialog open={!!editingFolder} onOpenChange={() => setEditingFolder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Renomear Pasta</DialogTitle>
            <DialogDescription>
              Digite o novo nome para a pasta.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Nome da pasta"
              value={editFolderName}
              onChange={(e) => setEditFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFolder(null)}>
              Cancelar
            </Button>
            <Button onClick={handleRenameFolder} disabled={!editFolderName.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Folder Modal */}
      <Dialog open={!!deletingFolder} onOpenChange={() => setDeletingFolder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir Pasta</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a pasta "{deletingFolder?.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingFolder(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteFolder}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MobileFoldersPage;
