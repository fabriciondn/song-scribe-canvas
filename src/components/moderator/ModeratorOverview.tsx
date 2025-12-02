
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Award, Coins, RefreshCw, DollarSign, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getModeratorDashboardStats } from '@/services/moderatorService';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const PRICE_PER_CREDIT = 30;
const PRICE_PER_REGISTRATION = 30;

type PeriodFilter = 'day' | 'week' | 'month' | 'year';

export const ModeratorOverview = () => {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');

  const { data: stats, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['moderator-dashboard-stats'],
    queryFn: getModeratorDashboardStats,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  // Buscar transações para contagem e gráfico
  const { data: transactions } = useQuery({
    queryKey: ['moderator-transactions-overview'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('moderator_transactions')
        .select('*')
        .eq('moderator_id', user.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Buscar registros dos usuários gerenciados
  const { data: registrations } = useQuery({
    queryKey: ['moderator-registrations-overview'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data: managedUsers } = await supabase
        .from('moderator_users')
        .select('user_id')
        .eq('moderator_id', user.id);
      
      if (!managedUsers || managedUsers.length === 0) return [];
      
      const userIds = managedUsers.map(u => u.user_id);
      
      const { data, error } = await supabase
        .from('author_registrations')
        .select('*')
        .in('user_id', userIds)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  console.log('📊 ModeratorOverview - Stats:', { stats, isLoading, error });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Painel do Moderador</h2>
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Carregando...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    console.error('❌ Erro ao carregar estatísticas:', error);
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Painel do Moderador</h2>
            <p className="text-muted-foreground text-destructive">
              Erro ao carregar estatísticas: {error instanceof Error ? error.message : 'Erro desconhecido'}
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-destructive mb-2">Não foi possível carregar os dados</div>
              <div className="text-sm text-muted-foreground">
                Verifique sua conexão e tente novamente
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Garantir que temos dados válidos ou usar zeros
  const safeStats = {
    total_managed_users: stats?.total_managed_users || 0,
    total_managed_songs: stats?.total_managed_songs || 0,
    total_managed_drafts: stats?.total_managed_drafts || 0,
    total_managed_registered_works: stats?.total_managed_registered_works || 0,
    total_credits_distributed: stats?.total_credits_distributed || 0,
    total_current_credits: stats?.total_current_credits || 0,
  };

  // Calcular totais
  const transactionCount = transactions?.length || 0;
  const totalCreditsDistributed = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const registrationCount = registrations?.length || 0;
  
  const revenueFromCredits = totalCreditsDistributed * PRICE_PER_CREDIT;
  const revenueFromRegistrations = registrationCount * PRICE_PER_REGISTRATION;
  const totalRevenue = revenueFromCredits + revenueFromRegistrations;

  // Gerar dados para o gráfico
  const generateChartData = () => {
    const now = new Date();
    const data: { name: string; valor: number; }[] = [];
    
    const allEvents = [
      ...(transactions || []).map(t => ({ date: new Date(t.created_at), value: Number(t.amount) * PRICE_PER_CREDIT })),
      ...(registrations || []).map(r => ({ date: new Date(r.created_at), value: PRICE_PER_REGISTRATION }))
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    if (periodFilter === 'day') {
      // Últimas 24 horas por hora
      for (let i = 23; i >= 0; i--) {
        const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hourEnd = new Date(now.getTime() - (i - 1) * 60 * 60 * 1000);
        const value = allEvents
          .filter(e => e.date >= hourStart && e.date < hourEnd)
          .reduce((sum, e) => sum + e.value, 0);
        data.push({ name: `${hourStart.getHours()}h`, valor: value });
      }
    } else if (periodFilter === 'week') {
      // Últimos 7 dias
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date(now);
        dayStart.setDate(dayStart.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const value = allEvents
          .filter(e => e.date >= dayStart && e.date < dayEnd)
          .reduce((sum, e) => sum + e.value, 0);
        data.push({ name: days[dayStart.getDay()], valor: value });
      }
    } else if (periodFilter === 'month') {
      // Últimos 30 dias (agrupados por semana)
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - i * 7);
        const value = allEvents
          .filter(e => e.date >= weekStart && e.date < weekEnd)
          .reduce((sum, e) => sum + e.value, 0);
        data.push({ name: `Sem ${4 - i}`, valor: value });
      }
    } else {
      // Últimos 12 meses
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const value = allEvents
          .filter(e => e.date >= monthStart && e.date < monthEnd)
          .reduce((sum, e) => sum + e.value, 0);
        data.push({ name: months[monthStart.getMonth()], valor: value });
      }
    }
    
    return data;
  };

  const chartData = generateChartData();

  const metricCards = [
    {
      title: 'Total Faturado',
      value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      description: 'Receita total (créditos + registros)'
    },
    {
      title: 'Transações',
      value: transactionCount,
      icon: ArrowUpDown,
      description: 'Total de transações realizadas'
    },
    {
      title: 'Usuários Gerenciados',
      value: safeStats.total_managed_users,
      icon: Users,
      description: 'Total de usuários criados por você'
    },
    {
      title: 'Obras Registradas',
      value: safeStats.total_managed_registered_works,
      icon: Award,
      description: 'Registros de autoria concluídos'
    },
    {
      title: 'Créditos Atuais',
      value: safeStats.total_current_credits,
      icon: Coins,
      description: 'Soma dos créditos atuais dos usuários'
    }
  ];

  const periodLabels: Record<PeriodFilter, string> = {
    day: 'Hoje',
    week: 'Semana',
    month: 'Mês',
    year: 'Ano'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Painel do Moderador</h2>
          <p className="text-muted-foreground">
            Visão geral dos usuários e atividades que você gerencia
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm" disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          {isFetching ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {metricCards.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Informações Adicionais */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resumo da Atividade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Usuários Ativos:</span>
                <span className="text-sm font-medium">{safeStats.total_managed_users}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Conteúdo Total:</span>
                <span className="text-sm font-medium">
                  {safeStats.total_managed_songs + safeStats.total_managed_drafts}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Obras Registradas:</span>
                <span className="text-sm font-medium">{safeStats.total_managed_registered_works}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status dos Créditos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Créditos Distribuídos (histórico):</span>
                <span className="text-sm font-medium">{totalCreditsDistributed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Créditos Atuais dos Usuários:</span>
                <span className="text-sm font-medium">{safeStats.total_current_credits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Média por Usuário:</span>
                <span className="text-sm font-medium">
                  {safeStats.total_managed_users > 0 
                    ? Math.round(safeStats.total_current_credits / safeStats.total_managed_users)
                    : 0
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Desempenho */}
      <Card className="bg-black/50 border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground">Desempenho de Faturamento</CardTitle>
            <div className="flex gap-2">
              {(['day', 'week', 'month', 'year'] as PeriodFilter[]).map((period) => (
                <Button
                  key={period}
                  size="sm"
                  variant={periodFilter === period ? 'default' : 'outline'}
                  onClick={() => setPeriodFilter(period)}
                  className={periodFilter === period ? 'bg-primary text-primary-foreground' : 'bg-transparent'}
                >
                  {periodLabels[period]}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Faturamento']}
                />
                <Area
                  type="monotone"
                  dataKey="valor"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValor)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
