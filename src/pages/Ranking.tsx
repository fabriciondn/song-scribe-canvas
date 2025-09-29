import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Award, Music, Calendar, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RankingUser {
  id: string;
  name: string;
  artistic_name: string;
  avatar_url: string;
  email: string;
  total_works: number;
  created_at: string;
  position: number;
}

export default function Ranking() {
  const [rankings, setRankings] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      
      // Buscar dados dos usuários com contagem de obras registradas
      const { data, error } = await supabase.rpc('get_composers_ranking');
      
      if (error) {
        console.error('Erro ao buscar ranking:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar o ranking dos compositores.",
          variant: "destructive"
        });
        return;
      }

      if (data && Array.isArray(data)) {
        // Adicionar posição no ranking
        const rankingsWithPosition = data.map((user: any, index: number) => ({
          id: user.id,
          name: user.name,
          artistic_name: user.artistic_name,
          avatar_url: user.avatar_url,
          email: user.email,
          total_works: Number(user.total_works),
          created_at: user.created_at,
          position: index + 1
        }));
        
        setRankings(rankingsWithPosition);
      }
    } catch (error) {
      console.error('Erro ao buscar ranking:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado ao carregar o ranking.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center font-bold text-muted-foreground">#{position}</span>;
    }
  };

  const getPositionStyle = (position: number) => {
    switch (position) {
      case 1:
        return "border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50";
      case 2:
        return "border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50";
      case 3:
        return "border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50";
      default:
        return "border-border bg-card";
    }
  };

  const formatMemberSince = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return 'Data não disponível';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Ranking dos Compositores</h1>
          <p className="text-muted-foreground">Os compositores com mais obras registradas na plataforma</p>
        </div>
        
        <div className="space-y-4">
          {[...Array(10)].map((_, index) => (
            <Card key={index} className="border-border bg-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-6 h-6" />
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="w-20 h-8" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Ranking dos Compositores</h1>
        <p className="text-muted-foreground">Os compositores com mais obras registradas na plataforma</p>
      </div>

      {/* Ranking List */}
      <div className="space-y-4">
        {rankings.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="p-8 text-center">
              <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum compositor encontrado</h3>
              <p className="text-muted-foreground">
                Ainda não há compositores com obras registradas na plataforma.
              </p>
            </CardContent>
          </Card>
        ) : (
          rankings.map((user) => (
            <Card key={user.id} className={`${getPositionStyle(user.position)} transition-all hover:shadow-lg`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  {/* Posição */}
                  <div className="flex-shrink-0">
                    {getPositionIcon(user.position)}
                  </div>

                  {/* Avatar */}
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={user.avatar_url} alt={user.name || user.artistic_name} />
                    <AvatarFallback>
                      <User className="w-8 h-8" />
                    </AvatarFallback>
                  </Avatar>

                  {/* Informações do usuário */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold truncate">
                        {user.artistic_name || user.name || 'Compositor'}
                      </h3>
                      {user.position <= 3 && (
                        <Badge variant="secondary" className="text-xs">
                          Top {user.position}
                        </Badge>
                      )}
                    </div>
                    
                    {user.name && user.artistic_name && user.name !== user.artistic_name && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {user.name}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Music className="w-4 h-4" />
                        <span>{user.total_works} obra{user.total_works !== 1 ? 's' : ''} registrada{user.total_works !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Desde {formatMemberSince(user.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Badge de obras */}
                  <div className="flex-shrink-0">
                    <Badge variant="outline" className="text-lg font-bold px-3 py-1">
                      {user.total_works}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Footer */}
      {rankings.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Ranking atualizado com base no número de obras registradas na plataforma
          </p>
        </div>
      )}
    </div>
  );
}