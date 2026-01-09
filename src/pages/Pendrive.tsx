import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUserRole } from '@/hooks/useUserRole';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Download, 
  Music, 
  FolderOpen, 
  Play, 
  Pause, 
  SlidersHorizontal,
  Star,
  Mic,
  ChevronRight,
  ChevronDown,
  Check
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { ProUpgradeModal } from '@/components/ui/pro-upgrade-modal';
import { MobileBottomNavigation } from '@/components/mobile/MobileBottomNavigation';

// Genre categories for filter with colors
const GENRES = [
  { value: 'Tudo', color: 'bg-muted text-foreground border-border', activeColor: 'bg-primary text-primary-foreground' },
  { value: 'Hip-Hop', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20', activeColor: 'bg-orange-500 text-white' },
  { value: 'Pop', color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20', activeColor: 'bg-pink-500 text-white' },
  { value: 'MPB', color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20', activeColor: 'bg-green-500 text-white' },
  { value: 'Trap', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', activeColor: 'bg-red-500 text-white' },
  { value: 'Rock', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', activeColor: 'bg-blue-500 text-white' },
  { value: 'Eletrônico', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20', activeColor: 'bg-cyan-500 text-white' },
  { value: 'Sertanejo', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', activeColor: 'bg-amber-500 text-white' },
];

// Genre badge colors for list items
const getGenreBadgeStyle = (genre: string) => {
  const genreData = GENRES.find(g => g.value === genre);
  return genreData?.color || 'bg-primary/10 text-primary border-primary/20';
};

const Pendrive = () => {
  const user = useCurrentUser();
  const { isPro } = useUserRole();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Tudo');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch user's registered music
  const { data: registrations, isLoading } = useQuery({
    queryKey: ['user-registrations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('author_registrations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Filter music
  const filteredRegistrations = React.useMemo(() => {
    if (!registrations) return [];
    
    return registrations.filter(reg => {
      const matchesSearch = searchTerm === '' || 
        reg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.author.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesGenre = selectedGenre === 'Tudo' || reg.genre === selectedGenre;
      
      return matchesSearch && matchesGenre;
    });
  }, [registrations, searchTerm, selectedGenre]);

  // Recent registrations (last 5)
  const recentRegistrations = filteredRegistrations.slice(0, 5);

  const handleDownload = async (registration: any) => {
    if (!isPro) {
      setShowUpgradeModal(true);
      return;
    }

    if (!registration.audio_file_path) {
      toast.error('Esta música não possui áudio disponível para download');
      return;
    }

    try {
      const { data } = supabase.storage
        .from('author-registrations')
        .getPublicUrl(registration.audio_file_path);

      if (data?.publicUrl) {
        const link = document.createElement('a');
        link.href = data.publicUrl;
        link.download = `${registration.title} - ${registration.author}.mp3`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Download iniciado!');
      } else {
        toast.error('Erro ao gerar link de download');
      }
    } catch (error) {
      console.error('Erro ao baixar:', error);
      toast.error('Erro ao baixar a música');
    }
  };

  const handlePlayAudio = async (registration: any) => {
    if (!registration.audio_file_path) {
      toast.info('Esta música não possui áudio disponível');
      return;
    }

    if (playingId === registration.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    try {
      const { data } = supabase.storage
        .from('author-registrations')
        .getPublicUrl(registration.audio_file_path);

      if (data?.publicUrl) {
        const audio = new Audio(data.publicUrl);
        audioRef.current = audio;
        
        audio.onended = () => setPlayingId(null);
        audio.onerror = () => {
          toast.error('Erro ao reproduzir áudio');
          setPlayingId(null);
        };
        
        await audio.play();
        setPlayingId(registration.id);
      }
    } catch (error) {
      console.error('Erro ao reproduzir:', error);
      toast.error('Erro ao reproduzir áudio');
    }
  };

  // Fake file size for display
  const getFileSize = (id: string) => {
    const sizes = ['2.4MB', '3.1MB', '4.2MB', '2.8MB', '5.2MB', '3.4MB'];
    const index = id.charCodeAt(0) % sizes.length;
    return sizes[index];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="px-6 pt-8 pb-4">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="px-6 space-y-4">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <div className="flex gap-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-10 w-20 rounded-full" />
            ))}
          </div>
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="px-6 pt-8 pb-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Pendrive</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie suas bases e criações</p>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nome ou autor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 w-full rounded-2xl border-border/50 bg-muted pl-12 pr-12 text-base placeholder-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2">
              <SlidersHorizontal className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
            </button>
          </div>
        </div>

        {/* Genre Filter Dropdown */}
        <div className="px-6 pb-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 rounded-xl">
                <SlidersHorizontal className="h-4 w-4" />
                {selectedGenre === 'Tudo' ? 'Gênero' : selectedGenre}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {GENRES.map(genre => (
                <DropdownMenuItem
                  key={genre.value}
                  onClick={() => setSelectedGenre(genre.value)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span>{genre.value}</span>
                  {selectedGenre === genre.value && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Recent Section */}
        <div className="px-6 mb-6">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-lg font-bold text-foreground">Recentes</h2>
            <button className="text-xs text-primary font-semibold hover:underline">Ver todos</button>
          </div>

          {recentRegistrations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-muted rounded-2xl">
              <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <h3 className="text-sm font-medium text-foreground">Nenhuma música encontrada</h3>
              <p className="text-muted-foreground text-xs mt-1">
                {searchTerm || selectedGenre !== 'Tudo' 
                  ? 'Tente ajustar os filtros'
                  : 'Suas músicas registradas aparecerão aqui'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentRegistrations.map((registration) => (
                <div
                  key={registration.id}
                  className="flex items-center p-3 bg-muted rounded-2xl border border-border/50 hover:border-primary/50 transition-colors group"
                >
                  {/* Thumbnail/Cover */}
                  <div 
                    className="relative h-16 w-16 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center cursor-pointer"
                    onClick={() => handlePlayAudio(registration)}
                  >
                    <Music className="h-6 w-6 text-primary/60" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {playingId === registration.id ? (
                        <Pause className="h-6 w-6 text-white" />
                      ) : (
                        <Play className="h-6 w-6 text-white" />
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="ml-4 flex-1 min-w-0">
                    <h3 className="text-sm font-bold truncate text-foreground">{registration.title}</h3>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {registration.author} • {registration.rhythm || 'Instrumental'}
                    </p>
                    <div className="flex items-center mt-1.5 gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getGenreBadgeStyle(registration.genre)}`}>
                        {registration.genre}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{getFileSize(registration.id)}</span>
                    </div>
                  </div>

                  {/* Download Button */}
                  <button 
                    onClick={() => handleDownload(registration)}
                    className="h-10 w-10 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted-foreground/10 hover:text-primary transition"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Favorites Section */}
        <div className="px-6 mb-6">
          <h2 className="text-lg font-bold mb-4 text-foreground">Favoritos</h2>
          <div className="bg-muted rounded-2xl p-4 border border-border/50">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Star className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Projetos 2023</p>
                  <p className="text-xs text-muted-foreground">12 Arquivos</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Mic className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Vocais Raw</p>
                  <p className="text-xs text-muted-foreground">8 Arquivos</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <MobileBottomNavigation />

        {/* Pro Upgrade Modal */}
        <ProUpgradeModal 
          open={showUpgradeModal} 
          onOpenChange={setShowUpgradeModal}
          featureName="Pendrive Inteligente"
        />

        {/* Hide scrollbar */}
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
  }

  // Desktop version (keep existing)
  return (
    <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pendrive</h1>
          <p className="text-muted-foreground text-sm">Gerencie suas bases e criações</p>
        </div>
        <Badge className="w-fit">{registrations?.length || 0} músicas</Badge>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou autor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="shrink-0 gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              {selectedGenre === 'Tudo' ? 'Gênero' : selectedGenre}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {GENRES.map(genre => (
              <DropdownMenuItem
                key={genre.value}
                onClick={() => setSelectedGenre(genre.value)}
                className="flex items-center justify-between cursor-pointer"
              >
                <span>{genre.value}</span>
                {selectedGenre === genre.value && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Music List */}
      {filteredRegistrations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-muted/50 rounded-xl">
          <FolderOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground">Nenhuma música encontrada</h3>
          <p className="text-muted-foreground text-sm mt-1">
            {searchTerm || selectedGenre !== 'Tudo' 
              ? 'Tente ajustar os filtros'
              : 'Suas músicas registradas aparecerão aqui'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRegistrations.map((registration) => (
            <div
              key={registration.id}
              className="flex items-center p-4 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors group"
            >
              <div 
                className="relative h-14 w-14 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center cursor-pointer"
                onClick={() => handlePlayAudio(registration)}
              >
                <Music className="h-5 w-5 text-primary/60" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {playingId === registration.id ? (
                    <Pause className="h-5 w-5 text-white" />
                  ) : (
                    <Play className="h-5 w-5 text-white" />
                  )}
                </div>
              </div>

              <div className="ml-4 flex-1 min-w-0">
                <h3 className="font-semibold truncate text-foreground">{registration.title}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {registration.author} • {registration.rhythm || 'Instrumental'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="outline" className={getGenreBadgeStyle(registration.genre)}>
                  {registration.genre}
                </Badge>
                <span className="text-xs text-muted-foreground">{getFileSize(registration.id)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDownload(registration)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProUpgradeModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal}
        featureName="Pendrive Inteligente"
      />
    </div>
  );
};

export default Pendrive;
