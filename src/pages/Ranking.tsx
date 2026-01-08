import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Music, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileBottomNavigation } from '@/components/mobile/MobileBottomNavigation';

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
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      setLoading(true);
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

  const getInitials = (name: string | null, artisticName: string | null) => {
    const displayName = artisticName || name || '';
    return displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getMaxWorks = () => {
    if (rankings.length === 0) return 1;
    return rankings[0]?.total_works || 1;
  };

  const getProgressWidth = (works: number) => {
    const max = getMaxWorks();
    return Math.max(10, (works / max) * 100);
  };

  // Mobile Loading
  if (loading && isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="pt-8 pb-6 px-6 text-center sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
          <Skeleton className="h-8 w-64 mx-auto mb-2" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </header>
        <main className="flex-1 px-4 py-6 space-y-4 pb-24">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="w-8 h-8" />
                <Skeleton className="w-14 h-14 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="w-10 h-8" />
              </div>
            </div>
          ))}
        </main>
        <MobileBottomNavigation />
      </div>
    );
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="pt-8 pb-6 px-6 text-center sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
          <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">
            Ranking dos Compositores
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Os compositores com mais obras registradas na plataforma
          </p>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 py-6 space-y-4 pb-24">
          {rankings.length === 0 ? (
            <div className="rounded-2xl bg-card border border-border p-8 text-center">
              <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum compositor encontrado</h3>
              <p className="text-muted-foreground text-sm">
                Ainda não há compositores com obras registradas.
              </p>
            </div>
          ) : (
            rankings.map((user) => {
              const isTop1 = user.position === 1;
              const isTop2 = user.position === 2;
              const isTop3 = user.position === 3;
              const isTopRanked = user.position <= 3;

              return (
                <div
                  key={user.id}
                  className={`relative overflow-hidden rounded-2xl p-4 transition-transform hover:scale-[1.01] ${
                    isTop1
                      ? 'bg-card border-2 border-primary/50 shadow-lg'
                      : 'bg-card border border-border'
                  }`}
                >
                  {/* Glow effect for Top 1 */}
                  {isTop1 && (
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
                  )}

                  <div className="flex items-center gap-4 relative z-10">
                    {/* Position Icon */}
                    <div className="flex-shrink-0 w-8 flex justify-center">
                      {isTop1 && <Trophy className="w-8 h-8 text-yellow-400 drop-shadow-sm" />}
                      {isTop2 && <Medal className="w-6 h-6 text-muted-foreground" />}
                      {isTop3 && <Medal className="w-6 h-6 text-orange-700" />}
                      {!isTopRanked && (
                        <span className="text-sm font-bold text-muted-foreground">#{user.position}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="relative">
                      <div
                        className={`rounded-full p-0.5 ${
                          isTop1
                            ? 'h-16 w-16 bg-gradient-to-tr from-yellow-400 to-primary'
                            : isTop2
                            ? 'h-14 w-14 bg-muted-foreground'
                            : isTop3
                            ? 'h-14 w-14 bg-orange-800'
                            : 'h-12 w-12'
                        }`}
                      >
                        <Avatar className={`h-full w-full ${isTopRanked ? 'border-2 border-card' : ''}`}>
                          <AvatarImage src={user.avatar_url} alt={user.artistic_name || user.name} />
                          <AvatarFallback className="bg-muted text-muted-foreground text-lg font-bold">
                            {user.avatar_url ? null : getInitials(user.name, user.artistic_name) || (
                              <User className="w-5 h-5" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      {isTopRanked && (
                        <div
                          className={`absolute -bottom-1 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-background ${
                            isTop1
                              ? 'bg-primary text-primary-foreground'
                              : isTop2
                              ? 'bg-muted-foreground text-background'
                              : 'bg-orange-800 text-orange-100'
                          }`}
                        >
                          TOP {user.position}
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-bold text-foreground truncate ${
                          isTop1 ? 'text-lg' : 'text-base'
                        }`}
                      >
                        {user.artistic_name || user.name || 'Compositor'}
                      </h3>
                      {user.name && user.artistic_name && user.name !== user.artistic_name && (
                        <p className="text-xs text-muted-foreground truncate mb-1">
                          {user.name}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-xs">
                        <Music className={`w-3 h-3 ${isTop1 ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={isTop1 ? 'text-primary font-semibold' : 'text-muted-foreground'}>
                          {user.total_works} obras
                        </span>
                      </div>
                    </div>

                    {/* Works Count */}
                    <div className="text-center pl-2">
                      {isTopRanked ? (
                        <span className={`block font-bold ${isTop1 ? 'text-2xl text-primary' : 'text-xl text-foreground'}`}>
                          {user.total_works}
                        </span>
                      ) : (
                        <div className="text-right">
                          <span className="block text-lg font-bold text-muted-foreground">{user.total_works}</span>
                          <span className="text-[10px] text-muted-foreground">obras</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className={`relative z-10 ${isTop1 ? 'mt-4' : 'mt-3'}`}>
                    {isTop1 && (
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>Progresso de Registro</span>
                        <span>Top 1%</span>
                      </div>
                    )}
                    <div
                      className={`w-full bg-muted rounded-full overflow-hidden ${
                        isTop1 ? 'h-2' : isTopRanked ? 'h-1.5' : 'h-1 w-24'
                      }`}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isTop1
                            ? 'bg-gradient-to-r from-primary to-green-300 shadow-[0_0_10px_hsl(var(--primary)/0.5)]'
                            : isTop2
                            ? 'bg-primary/80'
                            : isTop3
                            ? 'bg-primary/60'
                            : 'bg-primary/40'
                        }`}
                        style={{ width: `${getProgressWidth(user.total_works)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </main>

        <MobileBottomNavigation />
      </div>
    );
  }

  // Desktop Layout (fallback)
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Ranking dos Compositores</h1>
        <p className="text-muted-foreground">Os compositores com mais obras registradas na plataforma</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          [...Array(10)].map((_, index) => (
            <div key={index} className="rounded-xl bg-card border border-border p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="w-6 h-6" />
                <Skeleton className="w-16 h-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="w-20 h-8" />
              </div>
            </div>
          ))
        ) : rankings.length === 0 ? (
          <div className="rounded-xl bg-card border border-border p-8 text-center">
            <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum compositor encontrado</h3>
            <p className="text-muted-foreground">
              Ainda não há compositores com obras registradas na plataforma.
            </p>
          </div>
        ) : (
          rankings.map((user) => (
            <div
              key={user.id}
              className={`rounded-xl p-6 transition-all hover:shadow-lg ${
                user.position === 1
                  ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-200 dark:border-yellow-500/30'
                  : user.position === 2
                  ? 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/20 dark:to-slate-800/20 border border-gray-200 dark:border-gray-500/30'
                  : user.position === 3
                  ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-500/30'
                  : 'bg-card border border-border'
              }`}
            >
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">
                  {user.position === 1 && <Trophy className="w-6 h-6 text-yellow-500" />}
                  {user.position === 2 && <Medal className="w-6 h-6 text-gray-400" />}
                  {user.position === 3 && <Medal className="w-6 h-6 text-amber-600" />}
                  {user.position > 3 && (
                    <span className="w-6 h-6 flex items-center justify-center font-bold text-muted-foreground">
                      #{user.position}
                    </span>
                  )}
                </div>

                <Avatar className="w-16 h-16">
                  <AvatarImage src={user.avatar_url} alt={user.name || user.artistic_name} />
                  <AvatarFallback>
                    <User className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold truncate">
                      {user.artistic_name || user.name || 'Compositor'}
                    </h3>
                    {user.position <= 3 && (
                      <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                        Top {user.position}
                      </span>
                    )}
                  </div>
                  {user.name && user.artistic_name && user.name !== user.artistic_name && (
                    <p className="text-sm text-muted-foreground mb-2">{user.name}</p>
                  )}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Music className="w-4 h-4" />
                    <span>{user.total_works} obra{user.total_works !== 1 ? 's' : ''} registrada{user.total_works !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <span className="text-lg font-bold px-3 py-1 border border-border rounded-md">
                    {user.total_works}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

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
