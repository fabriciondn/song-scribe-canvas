import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { UsbIcon, Search, Download, Music, Filter, FolderOpen, Calendar, Play, Pause, Volume2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const Pendrive = () => {
  const user = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Buscar todas as músicas registradas do usuário
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

  // Extrair gêneros únicos
  const genres = React.useMemo(() => {
    if (!registrations) return [];
    const uniqueGenres = [...new Set(registrations.map(r => r.genre))];
    return uniqueGenres.sort();
  }, [registrations]);

  // Filtrar músicas
  const filteredRegistrations = React.useMemo(() => {
    if (!registrations) return [];
    
    return registrations.filter(reg => {
      const matchesSearch = searchTerm === '' || 
        reg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.author.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesGenre = selectedGenre === 'all' || reg.genre === selectedGenre;
      
      return matchesSearch && matchesGenre;
    });
  }, [registrations, searchTerm, selectedGenre]);

  // Agrupar por gênero
  const groupedByGenre = React.useMemo(() => {
    const groups: Record<string, typeof filteredRegistrations> = {};
    
    filteredRegistrations.forEach(reg => {
      if (!groups[reg.genre]) {
        groups[reg.genre] = [];
      }
      groups[reg.genre].push(reg);
    });
    
    return groups;
  }, [filteredRegistrations]);

  const handleDownload = async (registration: any) => {
    try {
      if (registration.pdf_provisorio) {
        // Criar um link temporário para download
        const link = document.createElement('a');
        link.href = registration.pdf_provisorio;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.download = `${registration.title}_certificado.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Download iniciado!');
      } else {
        toast.error('Certificado não disponível para download ainda');
      }
    } catch (error) {
      console.error('Erro ao baixar:', error);
      toast.error('Erro ao baixar o certificado');
    }
  };

  const handlePlayAudio = async (registration: any) => {
    if (!registration.audio_file_path) {
      toast.info('Esta música não possui áudio disponível');
      return;
    }

    // Se já está tocando esta música, pause
    if (playingId === registration.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    // Parar áudio anterior
    if (audioRef.current) {
      audioRef.current.pause();
    }

    try {
      // Obter URL pública do áudio
      const { data } = supabase.storage
        .from('audio_files')
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'registered':
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Registrado</Badge>;
      case 'em análise':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Em Análise</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
      {/* Header compacto */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <UsbIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Meu Pendrive</h1>
            <p className="text-muted-foreground text-xs">
              Todas as suas músicas registradas
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Music className="h-3.5 w-3.5" />
          <span>{registrations?.length || 0} músicas</span>
        </div>
      </div>

      {/* Filtros compactos */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou autor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-9 text-sm bg-background/50"
          />
        </div>
        
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={selectedGenre} onValueChange={setSelectedGenre}>
            <SelectTrigger className="w-[160px] h-9 text-sm bg-background/50">
              <SelectValue placeholder="Gênero" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os gêneros</SelectItem>
              {genres.map(genre => (
                <SelectItem key={genre} value={genre}>{genre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de músicas */}
      <ScrollArea className="h-[calc(100vh-240px)]">
        {filteredRegistrations.length === 0 ? (
          <Card className="border-border/50 bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <h3 className="text-sm font-medium text-foreground">Nenhuma música encontrada</h3>
              <p className="text-muted-foreground text-xs mt-1">
                {searchTerm || selectedGenre !== 'all' 
                  ? 'Tente ajustar os filtros'
                  : 'Suas músicas registradas aparecerão aqui'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedByGenre).map(([genre, songs]) => (
              <Card key={genre} className="border-border/50 bg-card/50 overflow-hidden">
                <CardHeader className="py-2 px-3 bg-muted/30 border-b border-border/50">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <Music className="h-3.5 w-3.5 text-primary" />
                    {genre}
                    <Badge variant="secondary" className="ml-1.5 text-xs">{songs.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {songs.map((song) => (
                      <div 
                        key={song.id} 
                        className="flex items-center justify-between p-3 hover:bg-muted/20 transition-colors gap-2"
                      >
                        {/* Play button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 shrink-0"
                          onClick={() => handlePlayAudio(song)}
                        >
                          {playingId === song.id ? (
                            <Pause className="h-4 w-4 text-primary" />
                          ) : song.audio_file_path ? (
                            <Play className="h-4 w-4" />
                          ) : (
                            <Volume2 className="h-4 w-4 text-muted-foreground/50" />
                          )}
                        </Button>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground truncate">{song.title}</h4>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="truncate">{song.author}</span>
                            <span className="text-border">•</span>
                            <span className="flex items-center gap-0.5 shrink-0">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(song.created_at), "dd/MM/yy", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {getStatusBadge(song.status)}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(song)}
                            disabled={!song.pdf_provisorio && song.status !== 'registered' && song.status !== 'completed'}
                            className="h-8 gap-1.5 text-xs"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Baixar</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default Pendrive;
