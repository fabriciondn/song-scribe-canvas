import React, { useState } from 'react';
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
import { UsbIcon, Search, Download, Music, Filter, FolderOpen, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const Pendrive = () => {
  const user = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');

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
    if (registration.pdf_provisorio) {
      window.open(registration.pdf_provisorio, '_blank');
      toast.success('Download iniciado!');
    } else {
      toast.error('Certificado não disponível para download');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'registered':
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Registrado</Badge>;
      case 'em análise':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Em Análise</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <UsbIcon className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Meu Pendrive</h1>
            <p className="text-muted-foreground text-sm">
              Todas as suas músicas registradas em um só lugar
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Music className="h-4 w-4" />
          <span>{registrations?.length || 0} músicas no total</span>
        </div>
      </div>

      {/* Filtros */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou autor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-[180px] bg-background/50">
                  <SelectValue placeholder="Filtrar por gênero" />
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
        </CardContent>
      </Card>

      {/* Lista de músicas agrupadas por gênero */}
      <ScrollArea className="h-[calc(100vh-320px)]">
        {filteredRegistrations.length === 0 ? (
          <Card className="border-border/50 bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground">Nenhuma música encontrada</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {searchTerm || selectedGenre !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Suas músicas registradas aparecerão aqui'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByGenre).map(([genre, songs]) => (
              <Card key={genre} className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="py-3 px-4 bg-muted/30 border-b border-border/50">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Music className="h-4 w-4 text-primary" />
                    {genre}
                    <Badge variant="secondary" className="ml-2">{songs.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {songs.map((song) => (
                      <div 
                        key={song.id} 
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 hover:bg-muted/20 transition-colors gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground truncate">{song.title}</h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <span>{song.author}</span>
                            <span className="text-border">•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(song.created_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {getStatusBadge(song.status)}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(song)}
                            disabled={!song.pdf_provisorio}
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
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
