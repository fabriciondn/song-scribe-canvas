import React, { useEffect, useState, useRef } from 'react';
import {
  Users,
  MapPin,
  Globe,
  Monitor,
  User,
  Clock,
  TrendingUp,
  Eye,
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
    channelRef.current = subscribeToOnlineVisitors((allVisitors) => {
      setVisitors(allVisitors);

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
            count: 1,
          });
        }
      });
      setRegionStats(Array.from(statsMap.values()).sort((a, b) => b.count - a.count));
    });

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  const authenticatedCount = visitors.filter((v) => v.isAuthenticated).length;
  const anonymousCount = visitors.filter((v) => !v.isAuthenticated).length;

  const pageStats = visitors.reduce((acc, v) => {
    const page = v.currentPage || '/';
    acc[page] = (acc[page] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedPages = Object.entries(pageStats).sort(([, a], [, b]) => b - a).slice(0, 6);

  return (
    <div className="space-y-3">
      {/* Top metrics */}
      <section className="grid grid-cols-3 gap-3">
        <StatTile
          kicker="Visitantes Online"
          value={visitors.length}
          hint={
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Tempo real
            </span>
          }
          icon={<Eye className="h-3.5 w-3.5" />}
          tint="bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_55%)]"
          dot="bg-emerald-400"
        />
        <StatTile
          kicker="Usuários logados"
          value={authenticatedCount}
          hint="Autenticados no sistema"
          icon={<User className="h-3.5 w-3.5" />}
          tint="bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_55%)]"
          dot="bg-sky-400"
        />
        <StatTile
          kicker="Visitantes anônimos"
          value={anonymousCount}
          hint="Não autenticados"
          icon={<Users className="h-3.5 w-3.5" />}
          tint="bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_55%)]"
          dot="bg-white/60"
        />
      </section>

      {/* Region + Pages */}
      <section className="grid gap-3 md:grid-cols-2">
        <Panel
          icon={<MapPin className="h-3 w-3" />}
          kicker="Distribuição"
          title="Por região"
        >
          {regionStats.length === 0 ? (
            <EmptyRow text="Nenhum visitante no momento" />
          ) : (
            <div className="space-y-1">
              {regionStats.slice(0, 6).map((stat, idx) => (
                <Row
                  key={idx}
                  icon={<Globe className="h-3 w-3 text-white/45" />}
                  primary={stat.city}
                  secondary={stat.region}
                  value={stat.count}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel
          icon={<Monitor className="h-3 w-3" />}
          kicker="Navegação"
          title="Páginas ativas"
        >
          {sortedPages.length === 0 ? (
            <EmptyRow text="Nenhuma página ativa" />
          ) : (
            <div className="space-y-1">
              {sortedPages.map(([page, count], idx) => (
                <Row
                  key={idx}
                  icon={<TrendingUp className="h-3 w-3 text-white/45" />}
                  primary={page === '/' ? 'Página Inicial' : page}
                  value={count}
                  valueHint={count === 1 ? 'visitante' : 'visitantes'}
                />
              ))}
            </div>
          )}
        </Panel>
      </section>

      {/* Live visitor list — compact */}
      <Panel
        icon={<Clock className="h-3 w-3" />}
        kicker="Ao vivo"
        title="Visitantes em tempo real"
        rightSlot={
          <span className="text-[10px] text-white/40 tabular-nums">
            {visitors.length} {visitors.length === 1 ? 'ativo' : 'ativos'}
          </span>
        }
      >
        {visitors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-white/40">
            <Users className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-[12px]">Nenhum visitante online no momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {visitors.map((visitor, idx) => (
              <div
                key={visitor.visitorId || idx}
                className="group relative rounded-lg overflow-hidden px-3 py-2
                           bg-white/[0.025] hover:bg-white/[0.04]
                           transition-colors duration-200"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                        visitor.isAuthenticated ? 'bg-sky-400' : 'bg-emerald-400'
                      } animate-pulse`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-full ring-1 ${
                            visitor.isAuthenticated
                              ? 'bg-sky-400/10 text-sky-300 ring-sky-400/20'
                              : 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20'
                          }`}
                        >
                          {visitor.isAuthenticated ? 'Logado' : 'Visitante'}
                        </span>
                        <span className="text-[11px] text-white/80 truncate">
                          {visitor.currentPage === '/' ? 'Página Inicial' : visitor.currentPage}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-[10px] text-white/40">
                        <MapPin className="h-2.5 w-2.5" />
                        <span className="truncate">
                          {visitor.city && visitor.region
                            ? `${visitor.city}, ${visitor.region}`
                            : 'Localização desconhecida'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {visitor.enteredAt && (
                    <span className="text-[10px] text-white/40 shrink-0 tabular-nums">
                      há {formatDistanceToNow(new Date(visitor.enteredAt), { locale: ptBR })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
};

/* ---------- presentation primitives ---------- */

const StatTile: React.FC<{
  kicker: string;
  value: number | string;
  hint: React.ReactNode;
  icon: React.ReactNode;
  tint: string;
  dot: string;
}> = ({ kicker, value, hint, icon, tint, dot }) => (
  <div
    className="relative p-3 rounded-2xl overflow-hidden bg-white/[0.025]
               shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_14px_28px_-22px_rgba(0,0,0,0.55)]"
  >
    <div className={`absolute inset-0 ${tint} opacity-80`} />
    <div className="relative flex items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          <span className="text-[10px] uppercase tracking-[0.16em] text-white/45 truncate">
            {kicker}
          </span>
        </div>
        <p className="text-[26px] leading-none font-light tracking-tight text-white tabular-nums mt-1.5">
          {value}
        </p>
        <p className="text-[10px] text-white/45 mt-1">{hint}</p>
      </div>
      <div className="h-7 w-7 rounded-full flex items-center justify-center bg-white/[0.04] text-white/55 shrink-0">
        {icon}
      </div>
    </div>
  </div>
);

const Panel: React.FC<{
  icon: React.ReactNode;
  kicker: string;
  title: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}> = ({ icon, kicker, title, rightSlot, children }) => (
  <div
    className="relative rounded-2xl overflow-hidden p-3.5 bg-white/[0.025]
               shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_14px_28px_-22px_rgba(0,0,0,0.55)]"
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.04),transparent_60%)]" />
    <div className="relative">
      <div className="flex items-center justify-between mb-2.5">
        <div>
          <div className="flex items-center gap-1.5 text-white/45">
            <span className="h-4 w-4 rounded-full flex items-center justify-center bg-white/[0.04]">
              {icon}
            </span>
            <span className="text-[10px] uppercase tracking-[0.16em]">{kicker}</span>
          </div>
          <h3 className="text-[13px] font-medium text-white tracking-tight mt-0.5">{title}</h3>
        </div>
        {rightSlot}
      </div>
      {children}
    </div>
  </div>
);

const Row: React.FC<{
  icon: React.ReactNode;
  primary: string;
  secondary?: string;
  value: number;
  valueHint?: string;
}> = ({ icon, primary, secondary, value, valueHint }) => (
  <div className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
    <div className="flex items-center gap-2 min-w-0">
      <span className="h-5 w-5 rounded-full flex items-center justify-center bg-white/[0.04] shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] text-white/85 truncate">{primary}</p>
        {secondary && <p className="text-[10px] text-white/40 truncate">{secondary}</p>}
      </div>
    </div>
    <div className="text-right shrink-0">
      <span className="text-[12px] font-light text-white tabular-nums">{value}</span>
      {valueHint && <span className="text-[10px] text-white/40 ml-1">{valueHint}</span>}
    </div>
  </div>
);

const EmptyRow: React.FC<{ text: string }> = ({ text }) => (
  <p className="text-[11px] text-white/40 text-center py-6">{text}</p>
);
