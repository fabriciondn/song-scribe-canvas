import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { getAdminDashboardStats } from '@/services/adminService';
import { supabase } from '@/integrations/supabase/client';
import {
  TrendingUp,
  Music,
  Users,
  Activity,
  FileText,
  Handshake,
  Award,
  FolderOpen,
} from 'lucide-react';

/* Premium palette for charts */
const CHART_COLORS = ['#34d399', '#60a5fa', '#f59e0b', '#a78bfa', '#f472b6', '#22d3ee'];

/* ---------- Premium primitives ---------- */

const Panel: React.FC<{
  children: React.ReactNode;
  className?: string;
  tint?: string;
}> = ({ children, className = '', tint }) => (
  <div
    className={`relative overflow-hidden rounded-2xl bg-white/[0.025] border border-white/[0.05]
                shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_18px_36px_-25px_rgba(0,0,0,0.6)]
                ${className}`}
  >
    {tint && <div className={`absolute inset-0 pointer-events-none ${tint}`} />}
    <div className="relative">{children}</div>
  </div>
);

const PanelHeader: React.FC<{
  kicker: string;
  title: string;
  description?: string;
  dot: string;
  icon: React.ElementType;
}> = ({ kicker, title, description, dot, icon: Icon }) => (
  <div className="px-5 pt-4 pb-3 border-b border-white/[0.05]">
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">{kicker}</span>
        </div>
        <h3 className="mt-1 text-white text-[15px] font-light tracking-tight">{title}</h3>
        {description && <p className="mt-0.5 text-[11px] text-white/40">{description}</p>}
      </div>
      <Icon className="h-4 w-4 text-white/35" strokeWidth={1.5} />
    </div>
  </div>
);

const StatTile: React.FC<{
  kicker: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ElementType;
  tint: string;
  dot: string;
}> = ({ kicker, value, hint, icon: Icon, tint, dot }) => (
  <div
    className="relative overflow-hidden rounded-2xl p-4 bg-white/[0.025]
               shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_14px_28px_-22px_rgba(0,0,0,0.55)]"
  >
    <div className={`absolute inset-0 pointer-events-none ${tint}`} />
    <div className="relative flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">{kicker}</span>
        </div>
        <p className="mt-2 text-[26px] leading-none font-light tracking-tight text-white tabular-nums">
          {value}
        </p>
        {hint && <p className="mt-1.5 text-[11px] text-white/45">{hint}</p>}
      </div>
      <Icon className="h-7 w-7 text-white/40" strokeWidth={1.4} />
    </div>
  </div>
);

const chartTooltipStyle = {
  contentStyle: {
    background: '#0c0c0e',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    fontSize: 12,
    color: '#fff',
    boxShadow: '0 18px 36px -18px rgba(0,0,0,0.7)',
  },
  labelStyle: { color: 'rgba(255,255,255,0.55)', fontSize: 11 },
  itemStyle: { color: '#fff' },
} as const;

export const AdminAnalytics: React.FC = () => {
  const { data: stats } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: getAdminDashboardStats,
    refetchInterval: 30000,
  });

  const { data: growthData } = useQuery({
    queryKey: ['admin-growth-data'],
    queryFn: async () => {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const results = await Promise.all(
        last7Days.map(async (date) => {
          const { data: users } = await supabase
            .from('profiles')
            .select('id')
            .lte('created_at', `${date}T23:59:59`);

          const { data: songs } = await supabase
            .from('songs')
            .select('id')
            .lte('created_at', `${date}T23:59:59`)
            .is('deleted_at', null);

          return {
            date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            usuarios: users?.length || 0,
            musicas: songs?.length || 0,
          };
        }),
      );

      return results;
    },
    refetchInterval: 300000,
  });

  const { data: genreData } = useQuery({
    queryKey: ['admin-genre-data'],
    queryFn: async () => {
      const { data: registrations } = await supabase.from('author_registrations').select('genre');
      const genreCounts = (registrations || []).reduce((acc, reg) => {
        const raw = (reg.genre || 'Não informado').trim();
        // Normaliza casing: primeira letra maiúscula
        const genre = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
        acc[genre] = (acc[genre] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const sorted = Object.entries(genreCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // Top 7 + agrega o restante em "Outros"
      const TOP = 7;
      const top = sorted.slice(0, TOP);
      const rest = sorted.slice(TOP);
      if (rest.length > 0) {
        const others = rest.reduce((s, r) => s + r.value, 0);
        top.push({ name: `Outros (${rest.length})`, value: others });
      }
      return top;
    },
    refetchInterval: 300000,
  });

  const { data: activityData } = useQuery({
    queryKey: ['admin-activity-data'],
    queryFn: async () => {
      const { data: activities } = await supabase
        .from('user_activity_logs')
        .select('timestamp')
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const dayCounts = Array(7).fill(0);
      (activities || []).forEach((activity) => {
        const dayOfWeek = new Date(activity.timestamp).getDay();
        dayCounts[dayOfWeek]++;
      });
      return dayNames.map((day, index) => ({ dia: day, atividades: dayCounts[index] }));
    },
    refetchInterval: 60000,
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">Insights</span>
        </div>
        <h2 className="mt-1.5 text-white text-2xl font-light tracking-tight">Analytics</h2>
        <p className="mt-1 text-[12px] text-white/45">
          Evolução da plataforma, distribuição por gêneros e atividade dos usuários.
        </p>
      </div>

      {/* Growth chart */}
      <Panel tint="bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.06),transparent_55%)]">
        <PanelHeader
          kicker="Crescimento"
          title="Crescimento da plataforma"
          description="Usuários e músicas registrados nos últimos 7 dias"
          dot="bg-sky-400"
          icon={TrendingUp}
        />
        <div className="p-4">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={growthData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gSongs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip {...chartTooltipStyle} />
              <Area type="monotone" dataKey="usuarios" stroke="#60a5fa" strokeWidth={1.5} fill="url(#gUsers)" />
              <Area type="monotone" dataKey="musicas" stroke="#34d399" strokeWidth={1.5} fill="url(#gSongs)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Genre pie */}
        <Panel tint="bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.06),transparent_55%)]">
          <PanelHeader
            kicker="Repertório"
            title="Distribuição por gêneros"
            description="Gêneros musicais mais registrados"
            dot="bg-violet-400"
            icon={Music}
          />
          <div className="p-4">
            {(() => {
              const total = (genreData || []).reduce((s, g) => s + g.value, 0);
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="h-[240px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={genreData}
                          cx="50%"
                          cy="50%"
                          innerRadius={62}
                          outerRadius={95}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="rgba(12,12,14,0.9)"
                          strokeWidth={2}
                        >
                          {genreData?.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          {...chartTooltipStyle}
                          formatter={(v: any, n: any) => [`${v} (${((Number(v) / total) * 100).toFixed(1)}%)`, n]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">Total</p>
                      <p className="text-2xl font-light text-white tabular-nums">{total}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
                    {(genreData || []).map((g, i) => {
                      const pct = total > 0 ? (g.value / total) * 100 : 0;
                      const color = CHART_COLORS[i % CHART_COLORS.length];
                      return (
                        <div key={g.name} className="group">
                          <div className="flex items-center justify-between gap-2 text-[12px]">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
                              <span className="text-white/80 truncate">{g.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-white/60 tabular-nums shrink-0">
                              <span className="text-white/45 text-[11px]">{pct.toFixed(1)}%</span>
                              <span className="text-white">{g.value}</span>
                            </div>
                          </div>
                          <div className="mt-1 h-1 rounded-full bg-white/[0.04] overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, background: color, opacity: 0.75 }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {(!genreData || genreData.length === 0) && (
                      <p className="text-[12px] text-white/40 text-center py-6">Sem dados de gêneros</p>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </Panel>

        {/* Weekly activity */}
        <Panel tint="bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.06),transparent_55%)]">
          <PanelHeader
            kicker="Engajamento"
            title="Atividade semanal"
            description="Atividades por dia da semana (últimos 7 dias)"
            dot="bg-amber-400"
            icon={Activity}
          />
          <div className="p-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={activityData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="dia" stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip {...chartTooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="atividades" fill="url(#gBar)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Detailed metrics */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <StatTile
          kicker="Rascunhos"
          value={stats?.totalDrafts || 0}
          hint="Ativos na plataforma"
          icon={FileText}
          tint="bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.08),transparent_55%)]"
          dot="bg-sky-400"
        />
        <StatTile
          kicker="Parcerias"
          value={stats?.totalPartnerships || 0}
          hint="Criadas entre compositores"
          icon={Handshake}
          tint="bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.08),transparent_55%)]"
          dot="bg-emerald-400"
        />
        <StatTile
          kicker="Obras"
          value={stats?.totalRegisteredWorks || 0}
          hint="Registros concluídos"
          icon={Award}
          tint="bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.08),transparent_55%)]"
          dot="bg-violet-400"
        />
        <StatTile
          kicker="Pastas"
          value={stats?.totalFolders || 0}
          hint="Organizadas por usuários"
          icon={FolderOpen}
          tint="bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent_55%)]"
          dot="bg-amber-400"
        />
      </div>
    </div>
  );
};
