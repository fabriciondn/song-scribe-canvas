import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  MapPin, 
  Globe, 
  Monitor,
  User,
  Clock,
  TrendingUp,
  Eye
} from 'lucide-react';
import { subscribeToOnlineVisitors, VisitorPresence } from '@/services/realtimePresenceService';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RegionStats {
  region: string;
  city: string;
  count: number;
}

export const OnlineVisitorsPanel: React.FC = () => {
  const [visitors, setVisitors] = useState<VisitorPresence[]>([]);
  const [regionStats, setRegionStats] = useState<RegionStats[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    channelRef.current = subscribeToOnlineVisitors(
      (allVisitors) => {
        setVisitors(allVisitors);
        
        // Calculate region stats
        const statsMap = new Map<string, RegionStats>();
        allVisitors.forEach((visitor) => {
          const key = `${visitor.city || 'Desconhecida'}-${visitor.region || 'Desconhecido'}`;
          const existing = statsMap.get(key);
          if (existing) {
            existing.count++;
          } else {
            statsMap.set(key, {
              city: visitor.city || 'Desconhecida',
              region: visitor.region || 'Desconhecido',
              count: 1
            });
          }
        });
        
        const stats = Array.from(statsMap.values()).sort((a, b) => b.count - a.count);
        setRegionStats(stats);
      }
    );

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const authenticatedCount = visitors.filter(v => v.isAuthenticated).length;
  const anonymousCount = visitors.filter(v => !v.isAuthenticated).length;

  // Group by page
  const pageStats = visitors.reduce((acc, v) => {
    const page = v.currentPage || '/';
    acc[page] = (acc[page] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedPages = Object.entries(pageStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Visitantes Online
                </p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                  {visitors.length}
                </p>
                <p className="text-xs text-green-600/80 mt-1">
                  <span className="inline-flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></span>
                    Tempo real
                  </span>
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Eye className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Usuários Logados
                </p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {authenticatedCount}
                </p>
                <p className="text-xs text-blue-600/80 mt-1">
                  Autenticados no sistema
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  Visitantes Anônimos
                </p>
                <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                  {anonymousCount}
                </p>
                <p className="text-xs text-purple-600/80 mt-1">
                  Não autenticados
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Region Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Distribuição por Região
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px]">
              {regionStats.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum visitante no momento
                </p>
              ) : (
                <div className="space-y-2">
                  {regionStats.map((stat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{stat.city}</p>
                          <p className="text-xs text-muted-foreground">{stat.region}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="font-mono">
                        {stat.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Pages Being Viewed */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              Páginas Sendo Visualizadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px]">
              {sortedPages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma página ativa
                </p>
              ) : (
                <div className="space-y-2">
                  {sortedPages.map(([page, count], idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium truncate max-w-[200px]">
                          {page === '/' ? 'Página Inicial' : page}
                        </span>
                      </div>
                      <Badge variant="outline" className="font-mono">
                        {count} {count === 1 ? 'visitante' : 'visitantes'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Live Visitor List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Visitantes em Tempo Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {visitors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mb-2 opacity-50" />
                <p className="text-sm">Nenhum visitante online no momento</p>
              </div>
            ) : (
              <div className="space-y-2">
                {visitors.map((visitor, idx) => (
                  <div
                    key={visitor.visitorId || idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${visitor.isAuthenticated ? 'bg-blue-500' : 'bg-green-500'} animate-pulse`} />
                      <div>
                        <div className="flex items-center gap-2">
                          {visitor.isAuthenticated ? (
                            <Badge variant="default" className="text-xs">Logado</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Visitante</Badge>
                          )}
                          <span className="text-sm font-medium">
                            {visitor.currentPage === '/' ? 'Página Inicial' : visitor.currentPage}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {visitor.city && visitor.region 
                              ? `${visitor.city}, ${visitor.region}`
                              : 'Localização desconhecida'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {visitor.enteredAt && (
                        <span>
                          há {formatDistanceToNow(new Date(visitor.enteredAt), { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
