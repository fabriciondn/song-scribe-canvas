import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserPlus, Link as LinkIcon } from 'lucide-react';

interface OriginStats {
  total: number;
  byAffiliate: number;
  byModerator: number;
  direct: number;
  percentages: {
    affiliate: number;
    moderator: number;
    direct: number;
  };
}

async function getUserOriginStats(): Promise<OriginStats> {
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { count: affiliateUsers } = await supabase
    .from('affiliate_conversions')
    .select('*', { count: 'exact', head: true });

  const { count: moderatorUsers } = await supabase
    .from('moderator_users')
    .select('*', { count: 'exact', head: true });

  const total = totalUsers || 0;
  const byAffiliate = affiliateUsers || 0;
  const byModerator = moderatorUsers || 0;
  const direct = total - byAffiliate - byModerator;

  return {
    total,
    byAffiliate,
    byModerator,
    direct,
    percentages: {
      affiliate: total > 0 ? (byAffiliate / total) * 100 : 0,
      moderator: total > 0 ? (byModerator / total) * 100 : 0,
      direct: total > 0 ? (direct / total) * 100 : 0,
    }
  };
}

export const UserOriginReport: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['user-origin-stats'],
    queryFn: getUserOriginStats,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="rounded-3xl p-10 bg-white/[0.025] flex items-center justify-center min-h-[260px]">
        <div className="animate-spin h-7 w-7 rounded-full border-t border-white/40" />
      </div>
    );
  }

  const rows = [
    {
      key: 'moderator',
      label: 'Por Moderador',
      hint: 'Usuários criados manualmente por moderadores',
      value: stats?.byModerator || 0,
      pct: stats?.percentages.moderator || 0,
      icon: <UserPlus className="h-3.5 w-3.5" />,
      bar: 'bg-emerald-400/80',
    },
    {
      key: 'direct',
      label: 'Cadastro Direto',
      hint: 'Registraram-se sozinhos pela plataforma',
      value: stats?.direct || 0,
      pct: stats?.percentages.direct || 0,
      icon: <Users className="h-3.5 w-3.5" />,
      bar: 'bg-white/80',
    },
    {
      key: 'affiliate',
      label: 'Por Afiliado',
      hint: 'Vieram pelo link de um parceiro',
      value: stats?.byAffiliate || 0,
      pct: stats?.percentages.affiliate || 0,
      icon: <LinkIcon className="h-3.5 w-3.5" />,
      bar: 'bg-white/40',
    },
  ];

  return (
    <div className="relative rounded-2xl overflow-hidden p-4 bg-white/[0.025] h-full
                    shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_18px_36px_-25px_rgba(0,0,0,0.6)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.04),transparent_60%)]" />

      <div className="relative flex flex-col gap-3 h-full">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">Origem dos usuários</p>
            <h3 className="text-[13px] font-medium text-white tracking-tight mt-0.5">De onde vem sua base</h3>
          </div>
          <div className="text-right">
            <p className="text-2xl font-light tracking-tight text-white tabular-nums leading-none">
              {stats?.total || 0}
            </p>
            <p className="text-[10px] text-white/40">no total</p>
          </div>
        </div>

        <div className="space-y-2.5 mt-1">
          {rows.map((row) => (
            <div key={row.key} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-white/75 min-w-0">
                  <span className="h-5 w-5 rounded-full flex items-center justify-center bg-white/[0.04] text-white/55 shrink-0">
                    {row.icon}
                  </span>
                  <p className="text-[11px] text-white/85 truncate">{row.label}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[12px] font-light text-white tabular-nums">{row.value}</span>
                  <span className="text-[10px] text-white/40 ml-1.5 tabular-nums">{row.pct.toFixed(1)}%</span>
                </div>
              </div>
              <div className="h-[2px] rounded-full bg-white/[0.05] overflow-hidden">
                <div
                  className={`h-full ${row.bar} transition-all duration-700 ease-out`}
                  style={{ width: `${row.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
