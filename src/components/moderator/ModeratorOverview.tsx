import { useQuery } from '@tanstack/react-query';
import { Users, Award, Coins, RefreshCw, DollarSign, ArrowUpDown, TrendingUp, ArrowUpRight } from 'lucide-react';
import { getModeratorDashboardStatsForUser } from '@/services/moderatorService';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useImpersonation } from '@/context/ImpersonationContext';
import { useAuth } from '@/hooks/useAuth';

const PRICE_PER_CREDIT = 30;
const PRICE_PER_REGISTRATION = 30;

type PeriodFilter = 'day' | 'week' | 'month' | 'year';

export const ModeratorOverview = () => {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  const { isImpersonating, impersonatedUser } = useImpersonation();
  const { user } = useAuth();

  const moderatorId = isImpersonating && impersonatedUser ? impersonatedUser.id : user?.id;

  const { data: stats, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['moderator-dashboard-stats', moderatorId],
    queryFn: () => getModeratorDashboardStatsForUser(moderatorId),
    enabled: !!moderatorId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  const { data: transactions } = useQuery({
    queryKey: ['moderator-transactions-overview', moderatorId],
    queryFn: async () => {
      if (!moderatorId) return [];
      const { data, error } = await supabase
        .from('moderator_transactions')
        .select('*')
        .eq('moderator_id', moderatorId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!moderatorId,
  });

  const { data: registrations } = useQuery({
    queryKey: ['moderator-registrations-overview', moderatorId],
    queryFn: async () => {
      if (!moderatorId) return [];
      const { data: managedUsers } = await supabase
        .from('moderator_users')
        .select('user_id')
        .eq('moderator_id', moderatorId);
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
    enabled: !!moderatorId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t border-white/40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Header onRefresh={() => refetch()} isFetching={isFetching} />
        <div className="rounded-2xl p-6 bg-white/[0.025] text-center">
          <div className="text-red-300/90 mb-1 text-sm">Não foi possível carregar os dados</div>
          <div className="text-xs text-white/45">
            {error instanceof Error ? error.message : 'Verifique sua conexão e tente novamente'}
          </div>
        </div>
      </div>
    );
  }

  const safeStats = {
    total_managed_users: stats?.total_managed_users || 0,
    total_managed_songs: stats?.total_managed_songs || 0,
    total_managed_drafts: stats?.total_managed_drafts || 0,
    total_managed_registered_works: stats?.total_managed_registered_works || 0,
    total_credits_distributed: stats?.total_credits_distributed || 0,
    total_current_credits: stats?.total_current_credits || 0,
  };

  const transactionCount = transactions?.length || 0;
  const totalCreditsDistributed = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const registrationCount = registrations?.length || 0;

  const revenueFromCredits = totalCreditsDistributed * PRICE_PER_CREDIT;
  const revenueFromRegistrations = registrationCount * PRICE_PER_REGISTRATION;
  const totalRevenue = revenueFromCredits + revenueFromRegistrations;

  const generateChartData = () => {
    const now = new Date();
    const data: { name: string; valor: number; }[] = [];
    const allEvents = [
      ...(transactions || []).map(t => ({ date: new Date(t.created_at), value: Number(t.amount) * PRICE_PER_CREDIT })),
      ...(registrations || []).map(r => ({ date: new Date(r.created_at), value: PRICE_PER_REGISTRATION }))
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    if (periodFilter === 'day') {
      for (let i = 23; i >= 0; i--) {
        const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hourEnd = new Date(now.getTime() - (i - 1) * 60 * 60 * 1000);
        const value = allEvents.filter(e => e.date >= hourStart && e.date < hourEnd).reduce((sum, e) => sum + e.value, 0);
        data.push({ name: `${hourStart.getHours()}h`, valor: value });
      }
    } else if (periodFilter === 'week') {
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date(now);
        dayStart.setDate(dayStart.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const value = allEvents.filter(e => e.date >= dayStart && e.date < dayEnd).reduce((sum, e) => sum + e.value, 0);
        data.push({ name: days[dayStart.getDay()], valor: value });
      }
    } else if (periodFilter === 'month') {
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - i * 7);
        const value = allEvents.filter(e => e.date >= weekStart && e.date < weekEnd).reduce((sum, e) => sum + e.value, 0);
        data.push({ name: `Sem ${4 - i}`, valor: value });
      }
    } else {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const value = allEvents.filter(e => e.date >= monthStart && e.date < monthEnd).reduce((sum, e) => sum + e.value, 0);
        data.push({ name: months[monthStart.getMonth()], valor: value });
      }
    }
    return data;
  };

  const chartData = generateChartData();
  const fmtBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const periodLabels: Record<PeriodFilter, string> = {
    day: 'Hoje', week: 'Semana', month: 'Mês', year: 'Ano',
  };

  const contentTotal = safeStats.total_managed_songs + safeStats.total_managed_drafts;
  const avgPerUser = safeStats.total_managed_users > 0
    ? Math.round(safeStats.total_current_credits / safeStats.total_managed_users)
    : 0;

  return (
    <div className="space-y-2">
      <Header onRefresh={() => refetch()} isFetching={isFetching} />

      {/* Hero asymmetric row */}
      <section className="grid grid-cols-12 gap-2">
        {/* Revenue dominant */}
        <div className="group relative col-span-12 lg:col-span-7 p-3.5 rounded-xl overflow-hidden
                        bg-gradient-to-br from-white/[0.04] to-white/[0.01]
                        shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_20px_40px_-25px_rgba(0,0,0,0.6)]
                        transition-all duration-200">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_55%)] opacity-80" />
          <div className="absolute top-3 right-3 h-6 w-6 rounded-full flex items-center justify-center bg-white/[0.04] text-white/45">
            <DollarSign className="h-3 w-3" />
          </div>
          <div className="relative flex flex-col justify-between min-h-[80px]">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">Total faturado</span>
            </div>
            <div className="mt-2">
              <p className="text-[28px] leading-none font-light tracking-tight text-white tabular-nums">
                {fmtBRL(totalRevenue)}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300/90">
                  <TrendingUp className="h-3 w-3" />
                  Créditos + registros
                </span>
                <span className="text-white/20">·</span>
                <span className="text-[11px] text-white/40">{transactionCount} transações</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stacked secondary metrics */}
        <div className="col-span-12 lg:col-span-5 grid grid-rows-2 gap-2">
          <SurfaceMetric
            label="Usuários gerenciados"
            value={safeStats.total_managed_users}
            hint="Criados por você"
            icon={<Users className="h-3.5 w-3.5" />}
          />
          <SurfaceMetric
            label="Obras registradas"
            value={safeStats.total_managed_registered_works}
            hint="Autorias concluídas"
            icon={<Award className="h-3.5 w-3.5" />}
            accent="emerald"
          />
        </div>
      </section>


      {/* Secondary metrics row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SurfaceMetric
          label="Transações"
          value={transactionCount}
          hint="Operações realizadas"
          icon={<ArrowUpDown className="h-3.5 w-3.5" />}
        />
        <SurfaceMetric
          label="Créditos atuais"
          value={safeStats.total_current_credits}
          hint="Soma dos usuários"
          icon={<Coins className="h-3.5 w-3.5" />}
        />
        <SurfaceMetric
          label="Conteúdo total"
          value={contentTotal}
          hint="Músicas + rascunhos"
          icon={<Award className="h-3.5 w-3.5" />}
        />
        <SurfaceMetric
          label="Média por usuário"
          value={avgPerUser}
          hint="Créditos / usuário"
          icon={<Users className="h-3.5 w-3.5" />}
          accent="emerald"
        />
      </section>

      {/* Activity + Credits panels */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <PanelStat
          title="Resumo da atividade"
          rows={[
            { label: 'Usuários ativos', value: safeStats.total_managed_users },
            { label: 'Conteúdo total', value: contentTotal },
            { label: 'Obras registradas', value: safeStats.total_managed_registered_works },
          ]}
        />
        <PanelStat
          title="Status dos créditos"
          rows={[
            { label: 'Distribuídos (histórico)', value: totalCreditsDistributed },
            { label: 'Atuais dos usuários', value: safeStats.total_current_credits },
            { label: 'Média por usuário', value: avgPerUser },
          ]}
        />
      </section>

      {/* Chart */}
      <section className="group relative rounded-2xl overflow-hidden p-5
                          bg-gradient-to-br from-white/[0.035] to-white/[0.01]
                          shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_20px_40px_-25px_rgba(0,0,0,0.6)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.06),transparent_60%)]" />
        <div className="relative flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">Desempenho de faturamento</span>
            </div>
            <p className="text-base font-light text-white/85 mt-1">Evolução no período</p>
          </div>
          <div className="flex gap-1 p-1 rounded-full bg-white/[0.03]">
            {(['day', 'week', 'month', 'year'] as PeriodFilter[]).map((period) => (
              <button
                key={period}
                onClick={() => setPeriodFilter(period)}
                className={`px-3 py-1 text-[11px] rounded-full transition-all duration-150
                            ${periodFilter === period
                              ? 'bg-white/[0.08] text-white shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]'
                              : 'text-white/50 hover:text-white/80'}`}
              >
                {periodLabels[period]}
              </button>
            ))}
          </div>
        </div>
        <div className="relative h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="moderatorRevenueArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(16,185,129)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="rgb(16,185,129)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
              <Tooltip
                cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }}
                contentStyle={{
                  backgroundColor: 'rgba(15,15,17,0.95)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '12px',
                  boxShadow: '0 20px 40px -20px rgba(0,0,0,0.8)',
                }}
                labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                formatter={(value: number) => [fmtBRL(value), 'Faturamento']}
              />
              <Area
                type="monotone"
                dataKey="valor"
                stroke="rgb(52,211,153)"
                strokeWidth={1.75}
                fill="url(#moderatorRevenueArea)"
                activeDot={{ r: 4, fill: 'rgb(52,211,153)', stroke: 'rgba(15,15,17,1)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
};

/* ---------- presentation primitives (mirror AdminOverview) ---------- */

const Header: React.FC<{ onRefresh: () => void; isFetching: boolean }> = ({ onRefresh, isFetching }) => (
  <div className="flex items-end justify-between">
    <div>
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">Painel do Moderador</span>
      </div>
      <h2 className="text-2xl font-light tracking-tight text-white mt-1">Visão geral</h2>
      <p className="text-xs text-white/40 mt-0.5">Usuários e atividades que você gerencia</p>
    </div>
    <button
      onClick={onRefresh}
      disabled={isFetching}
      className="group relative inline-flex items-center gap-2 px-3.5 py-2 rounded-full
                 bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white
                 text-[11px] uppercase tracking-[0.14em]
                 shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset]
                 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
      {isFetching ? 'Atualizando' : 'Atualizar'}
    </button>
  </div>
);

const SurfaceMetric: React.FC<{
  label: string;
  value: number | string;
  hint: string;
  icon: React.ReactNode;
  accent?: 'neutral' | 'emerald';
}> = ({ label, value, hint, icon, accent = 'neutral' }) => {
  const tint =
    accent === 'emerald'
      ? 'bg-[radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.08),transparent_60%)]'
      : 'bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.05),transparent_60%)]';
  return (
    <div className="group relative p-4 rounded-2xl overflow-hidden bg-white/[0.025] hover:bg-white/[0.04]
                    shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_14px_28px_-18px_rgba(0,0,0,0.5)]
                    transition-all duration-200 hover:-translate-y-[1px]">
      <div className={`absolute inset-0 ${tint} opacity-70`} />
      <div className="relative flex items-center justify-between h-full gap-3">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.16em] text-white/45">{label}</span>
          <p className="text-2xl font-light tracking-tight text-white tabular-nums mt-1">{value}</p>
          <p className="text-[10px] text-white/35 mt-0.5">{hint}</p>
        </div>
        <div className="h-7 w-7 rounded-full flex items-center justify-center bg-white/[0.04] text-white/55 shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
};

const PanelStat: React.FC<{ title: string; rows: { label: string; value: number | string }[] }> = ({ title, rows }) => (
  <div className="relative p-5 rounded-2xl overflow-hidden bg-white/[0.025]
                  shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_14px_28px_-18px_rgba(0,0,0,0.5)]">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.04),transparent_60%)]" />
    <div className="relative">
      <div className="flex items-center gap-2 mb-4">
        <span className="h-1.5 w-1.5 rounded-full bg-white/45" />
        <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">{title}</span>
      </div>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between">
            <span className="text-[12px] text-white/55">{r.label}</span>
            <span className="text-[15px] font-light text-white tabular-nums">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);
