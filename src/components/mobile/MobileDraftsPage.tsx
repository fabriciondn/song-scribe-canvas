import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
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
  getSongsInFolder
} from '@/services/folderService';
import { getDrafts } from '@/services/drafts/draftService';
import { Draft } from '@/services/drafts/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Music, 
  Search, 
  Sun,
  Moon,
  Folder, 
  FolderPlus, 
  Mic, 
  FileEdit, 
  AudioLines,
  Play,
  ArrowDownWideNarrow,
  X,
  MoreVertical
} from 'lucide-react';

// Get folder color based on index
const getFolderColor = (index: number) => {
  const colors = ['text-yellow-500', 'text-blue-500', 'text-green-500', 'text-purple-500', 'text-pink-500', 'text-orange-500'];
  return colors[index % colors.length];
};

// Get icon for draft based on type
const getDraftIcon = (draft: Draft) => {
  if (draft.audio_url || (draft.audio_files && draft.audio_files.length > 0)) {
    return { Icon: Mic, gradient: 'from-indigo-500 to-purple-600' };
  }
  if (draft.selected_base_id) {
    return { Icon: AudioLines, gradient: '' };
  }
  return { Icon: FileEdit, gradient: '' };
};

export const MobileDraftsPage: React.FC = () => {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [folderCounts, setFolderCounts] = useState<Record<string, number>>({});
  const [recentDrafts, setRecentDrafts] = useState<Draft[]>([]);
  const [allDrafts, setAllDrafts] = useState<Draft[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'compositions' | 'collaborations'>('compositions');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest' | 'alphabetical'>('recent');

  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/');
      toast({
        title: 'Acesso negado',
        description: 'Você precisa estar logado para acessar esta página.',
        variant: 'destructive',
      });
    } else if (isAuthenticated && !authLoading) {
      loadData();
    }
  }, [isAuthenticated, authLoading, navigate, toast]);

  const loadData = async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      // Load folders
      const foldersData = await getFolders();
      setFolders(foldersData);

      // Load song counts for each folder
      const countsMap: Record<string, number> = {};
      for (const folder of foldersData) {
        const songs = await getSongsInFolder(folder.id);
        countsMap[folder.id] = songs.length;
      }
      setFolderCounts(countsMap);

      // Load recent drafts
      const drafts = await getDrafts();
      setAllDrafts(drafts);
      setRecentDrafts(drafts.slice(0, 10)); // Get latest 10
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro ao carregar dados',
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
      setFolderCounts(prev => ({ ...prev, [newFolder.id]: 0 }));
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

  const handleFolderClick = (folderId: string) => {
    navigate(`/dashboard/folders/${folderId}`);
  };

  const handleDraftClick = (draftId: string) => {
    navigate(`/dashboard/composer?draft=${draftId}`);
  };

  const formatTimeAgo = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: false, locale: ptBR });
  };

  // Sort and filter drafts
  const getSortedDrafts = (drafts: Draft[]) => {
    const sorted = [...drafts];
    switch (sortOrder) {
      case 'oldest':
        return sorted.sort((a, b) => 
          new Date(a.updated_at || a.created_at).getTime() - new Date(b.updated_at || b.created_at).getTime()
        );
      case 'alphabetical':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'recent':
      default:
        return sorted.sort((a, b) => 
          new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
        );
    }
  };

  // Filter drafts based on search query
  const filteredDrafts = searchQuery.trim()
    ? getSortedDrafts(allDrafts.filter(draft => 
        draft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        draft.content?.toLowerCase().includes(searchQuery.toLowerCase())
      ))
    : getSortedDrafts(recentDrafts);

  const getSortLabel = () => {
    switch (sortOrder) {
      case 'oldest': return 'Mais antigo';
      case 'alphabetical': return 'A-Z';
      default: return 'Recente';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black pb-24">
        {/* Header Skeleton */}
        <div className="px-6 pt-14 pb-6 sticky top-0 z-40 bg-black/[0.97]">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-10 w-40 bg-[#1C1C1E]" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-10 rounded-full bg-[#1C1C1E]" />
              <Skeleton className="h-10 w-10 rounded-full bg-[#1C1C1E]" />
            </div>
          </div>
          <Skeleton className="h-12 w-full rounded-xl bg-[#1C1C1E]" />
        </div>

        {/* Content Skeleton */}
        <main className="px-6 space-y-8">
          <section>
            <Skeleton className="h-6 w-20 mb-4 bg-[#1C1C1E]" />
            <div className="flex gap-4 overflow-x-auto">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="flex-shrink-0 w-36 h-32 rounded-2xl bg-[#1C1C1E]" />
              ))}
            </div>
          </section>
          <section>
            <Skeleton className="h-6 w-24 mb-4 bg-[#1C1C1E]" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl bg-[#1C1C1E]" />
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <header className="px-6 pt-14 pb-6 sticky top-0 z-40 bg-black/[0.97]">
        {/* Search Bar (when open) */}
        {isSearchOpen ? (
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar composições..."
                autoFocus
                className="pl-10 bg-[#2C2C2E] border-gray-700 text-white placeholder:text-gray-500 rounded-full"
              />
            </div>
            <button
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery('');
              }}
              className="w-10 h-10 rounded-full bg-[#2C2C2E] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#00C853]/10 rounded-xl flex items-center justify-center text-[#00C853]">
                <Music size={24} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Compuse</h1>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="w-10 h-10 rounded-full bg-[#2C2C2E] flex items-center justify-center text-gray-400 hover:text-[#00C853] transition-colors shadow-sm"
              >
                <Search size={20} />
              </button>
              <button 
                onClick={toggleTheme}
                className="w-10 h-10 rounded-full bg-[#2C2C2E] flex items-center justify-center text-gray-400 hover:text-[#00C853] transition-colors shadow-sm"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        {!isSearchOpen && (
          <div className="flex p-1 bg-[#2C2C2E] rounded-xl shadow-sm">
            <button
              onClick={() => setActiveTab('compositions')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'compositions'
                  ? 'bg-[#00C853] text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Composições
            </button>
            <button
              onClick={() => setActiveTab('collaborations')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'collaborations'
                  ? 'bg-[#00C853] text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Colaborações
            </button>
          </div>
        )}
      </header>

      <main className="px-6 space-y-8">
        {/* Search Results */}
        {isSearchOpen && searchQuery.trim() && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-200">
                Resultados ({filteredDrafts.length})
              </h2>
            </div>
          </section>
        )}

        {/* Folders Section */}
        {!isSearchOpen && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-200">Pastas</h2>
              <button
                onClick={() => navigate('/dashboard/folders')}
                className="text-[#00C853] text-sm font-semibold hover:opacity-80"
              >
                Ver tudo
              </button>
            </div>

            {/* Horizontal Folders Scroll */}
            <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 -mx-6 px-6">
              {folders.map((folder, index) => (
                <div
                  key={folder.id}
                  onClick={() => handleFolderClick(folder.id)}
                  className="flex-shrink-0 w-36 h-32 bg-[#1C1C1E] rounded-2xl p-4 flex flex-col justify-between border border-gray-800 cursor-pointer hover:border-[#00C853]/30 transition-all group shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <Folder 
                      size={28} 
                      className={`${getFolderColor(index)} group-hover:scale-110 transition-transform`}
                      fill="currentColor"
                    />
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="text-gray-600 hover:text-gray-400"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                  <div>
                    <p className="font-semibold text-white leading-tight line-clamp-2">{folder.name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {folderCounts[folder.id] || 0} arquivos
                    </p>
                  </div>
                </div>
              ))}

              {/* New Folder Card - Always at the end */}
              <div
                onClick={() => setIsNewFolderModalOpen(true)}
                className="flex-shrink-0 w-36 h-32 bg-transparent rounded-2xl p-4 flex flex-col justify-center items-center border-2 border-dashed border-gray-700 cursor-pointer hover:border-[#00C853] hover:bg-[#00C853]/5 transition-all"
              >
                <FolderPlus size={28} className="text-gray-500 mb-2" />
                <p className="text-xs font-semibold text-gray-400">Nova Pasta</p>
              </div>
            </div>
          </section>
        )}

        {/* Recent Drafts Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-200">
              {isSearchOpen && searchQuery.trim() ? 'Resultados' : 'Recentes'}
            </h2>
            {!isSearchOpen && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 text-sm">
                    <ArrowDownWideNarrow size={18} />
                    <span className="text-xs">{getSortLabel()}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1C1C1E] border-gray-800">
                  <DropdownMenuItem 
                    onClick={() => setSortOrder('recent')}
                    className={`text-gray-300 hover:text-white ${sortOrder === 'recent' ? 'bg-[#00C853]/20 text-[#00C853]' : ''}`}
                  >
                    Mais recente
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortOrder('oldest')}
                    className={`text-gray-300 hover:text-white ${sortOrder === 'oldest' ? 'bg-[#00C853]/20 text-[#00C853]' : ''}`}
                  >
                    Mais antigo
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortOrder('alphabetical')}
                    className={`text-gray-300 hover:text-white ${sortOrder === 'alphabetical' ? 'bg-[#00C853]/20 text-[#00C853]' : ''}`}
                  >
                    Alfabética (A-Z)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="space-y-4">
            {filteredDrafts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FileEdit size={40} className="mx-auto mb-2 opacity-50" />
                <p>{isSearchOpen ? 'Nenhum resultado encontrado' : 'Nenhuma composição recente'}</p>
              </div>
            ) : (
              filteredDrafts.map((draft) => {
                const { Icon, gradient } = getDraftIcon(draft);
                const isRegistered = false; // This would come from author_registrations table

                return (
                  <div
                    key={draft.id}
                    onClick={() => handleDraftClick(draft.id)}
                    className={`bg-[#1C1C1E] p-4 rounded-2xl flex items-center gap-4 border border-transparent hover:border-[#00C853]/20 transition-all cursor-pointer relative overflow-hidden group shadow-sm`}
                  >
                    {/* Green bar for registered */}
                    {isRegistered && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00C853]" />
                    )}

                    {/* Icon */}
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
                        gradient
                          ? `bg-gradient-to-br ${gradient} text-white`
                          : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      <Icon size={22} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate">{draft.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        {isRegistered && (
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                        )}
                        {isRegistered ? 'Registrado' : 'Rascunho'} • Editado há {formatTimeAgo(draft.updated_at || draft.created_at)}
                      </p>
                    </div>

                    {/* Actions */}
                    {(draft.audio_url || (draft.audio_files && draft.audio_files.length > 0)) && (
                      <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700 text-gray-500 transition-colors">
                        <Play size={18} />
                      </button>
                    )}

                    {!isRegistered && (
                      <div className="px-2 py-1 bg-yellow-900/30 rounded text-[10px] font-bold text-yellow-500 uppercase tracking-wide">
                        Draft
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* New Folder Dialog */}
      <Dialog open={isNewFolderModalOpen} onOpenChange={setIsNewFolderModalOpen}>
        <DialogContent className="bg-[#1C1C1E] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Nova Pasta</DialogTitle>
            <DialogDescription className="text-gray-400">
              Crie uma nova pasta para organizar suas composições.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Nome da pasta"
              autoFocus
              className="bg-[#2C2C2E] border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewFolderModalOpen(false)} className="border-gray-700 text-gray-300 hover:bg-gray-800">
              Cancelar
            </Button>
            <Button onClick={handleAddFolder} className="bg-[#00C853] hover:bg-[#00C853]/90 text-white">
              Criar Pasta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scrollbar hide CSS */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default MobileDraftsPage;
