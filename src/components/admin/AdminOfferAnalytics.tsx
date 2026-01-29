import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getOfferPageStats } from '@/services/offerAnalyticsService';
import { Eye, Play, Clock, CalendarIcon, Users, CheckCircle, MessageCircle, UserPlus } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#22c55e', '#8b5cf6', '#f59e0b', '#ef4444'];

interface OfferStats {
  total_views: number;
  unique_sessions: number;
  total_video_plays: number;
  total_video_completes: number;
  avg_watch_time_seconds: number;
  video_completion_rate: number;
  whatsapp_clicks: number;
  register_clicks: number;
  hourly_data: Array<{ hour: number; views: number }>;
  period_start: string;
  period_end: string;
}

export const AdminOfferAnalytics: React.FC = () => {
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: subDays(new Date(), 30),
    end: new Date()
  });

  const { data: rawStats, isLoading, refetch } = useQuery({
    queryKey: ['offer-analytics', dateRange.start, dateRange.end],
    queryFn: () => getOfferPageStats(dateRange.start, dateRange.end),
    refetchInterval: 60000,
  });

  // Type cast para evitar erros de tipo
  const stats = rawStats as unknown as OfferStats | null;

  // Preparar dados para o gráfico de horários de pico
  const hourlyChartData = React.useMemo(() => {
    if (!stats?.hourly_data) return [];
    
    const allHours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${i.toString().padStart(2, '0')}h`,
      views: 0
    }));

    stats.hourly_data.forEach((item) => {
      if (item.hour >= 0 && item.hour < 24) {
        allHours[item.hour].views = item.views;
      }
    });

    return allHours;
  }, [stats?.hourly_data]);

  // Dados para o gráfico de pizza
  const actionDistribution = React.useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'WhatsApp', value: stats.whatsapp_clicks || 0 },
      { name: 'Registrar', value: stats.register_clicks || 0 },
    ].filter(item => item.value > 0);
  }, [stats]);

  const formatWatchTime = (seconds: number) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalViews = stats?.total_views || 0;
  const uniqueSessions = stats?.unique_sessions || 0;
  const videoPlays = stats?.total_video_plays || 0;
  const avgWatchTime = stats?.avg_watch_time_seconds || 0;
  const completionRate = stats?.video_completion_rate || 0;
  const whatsappClicks = stats?.whatsapp_clicks || 0;
  const registerClicks = stats?.register_clicks || 0;
  const totalClicks = whatsappClicks + registerClicks;

  return (
    <div className="space-y-6">
      {/* Header com filtro de data */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics - Página de Oferta</h2>
          <p className="text-muted-foreground">Métricas de desempenho da página /oferta</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.start, 'dd/MM/yyyy', { locale: ptBR })} - {format(dateRange.end, 'dd/MM/yyyy', { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{ from: dateRange.start, to: dateRange.end }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ start: range.from, end: range.to });
                  }
                }}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          <Button onClick={() => refetch()} variant="outline" size="icon">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Cards de métricas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalViews}</p>
                <p className="text-sm text-muted-foreground">Visualizações</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{uniqueSessions}</p>
                <p className="text-sm text-muted-foreground">Visitantes Únicos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Play className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{videoPlays}</p>
                <p className="text-sm text-muted-foreground">Reproduções de Vídeo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatWatchTime(avgWatchTime)}</p>
                <p className="text-sm text-muted-foreground">Tempo Médio de Vídeo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segunda linha de métricas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completionRate}%</p>
                <p className="text-sm text-muted-foreground">Taxa de Conclusão do Vídeo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{whatsappClicks}</p>
                <p className="text-sm text-muted-foreground">Cliques no WhatsApp</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{registerClicks}</p>
                <p className="text-sm text-muted-foreground">Cliques em Registrar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de horários de pico */}
        <Card>
          <CardHeader>
            <CardTitle>Horários de Pico</CardTitle>
            <CardDescription>Visualizações por hora do dia (últimos 7 dias)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [value, 'Visualizações']}
                  labelFormatter={(label) => `Hora: ${label}`}
                />
                <Bar dataKey="views" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de distribuição de cliques */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Cliques</CardTitle>
            <CardDescription>Cliques por tipo de ação</CardDescription>
          </CardHeader>
          <CardContent>
            {actionDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={actionDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {actionDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nenhum clique registrado no período
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Taxa de conversão */}
      <Card>
        <CardHeader>
          <CardTitle>Funil de Conversão</CardTitle>
          <CardDescription>Da visualização à ação</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Visualizações</span>
                  <span className="text-sm text-muted-foreground">{totalViews}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Reproduções de Vídeo</span>
                  <span className="text-sm text-muted-foreground">
                    {videoPlays} ({totalViews ? Math.round((videoPlays / totalViews) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${totalViews ? (videoPlays / totalViews) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Cliques em CTAs</span>
                  <span className="text-sm text-muted-foreground">
                    {totalClicks} ({totalViews ? Math.round((totalClicks / totalViews) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${totalViews ? (totalClicks / totalViews) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
