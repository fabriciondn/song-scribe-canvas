import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAdminDashboardStats, getRevenueTransactions, getUsersByPlan } from '@/services/adminService';
import { RevenueDetailsModal } from './RevenueDetailsModal';
import { UsersByPlanModal } from './UsersByPlanModal';
import { UserOriginReport } from './UserOriginReport';
import { MobileAdminOverview } from './MobileAdminOverview';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Users,
  Shield,
  UserCheck,
  Clock,
  UserX,
  CreditCard,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

export const AdminOverview: React.FC = () => {
  const isMobile = useIsMobile();
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'trial' | 'free' | 'inactive' | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: getAdminDashboardStats,
    refetchInterval: 5000,
  });

  const { data: revenueTransactions = [], isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-transactions'],
    queryFn: getRevenueTransactions,
    enabled: showRevenueModal,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const { data: usersByPlan = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users-by-plan', selectedPlan],
    queryFn: () => selectedPlan ? getUsersByPlan(selectedPlan) : Promise.resolve([]),
    enabled: !!selectedPlan,
  });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t border-white/40" />
      </div>
    );
  }

  if (isMobile) return <MobileAdminOverview />;

  const fmtBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <>
      <div className="space-y-4">
        {/* Hero asymmetric row */}
        <section className="grid grid-cols-12 gap-3">
          {/* Revenue — dominant */}
          <button
            onClick={() => setShowRevenueModal(true)}
            className="group relative col-span-12 lg:col-span-7 text-left p-5 rounded-2xl overflow-hidden
                       bg-gradient-to-br from-white/[0.04] to-white/[0.01]
                       shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_20px_40px_-25px_rgba(0,0,0,0.6)]
                       hover:shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_28px_55px_-25px_rgba(0,0,0,0.8)]
                       transition-all duration-200 ease-out"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_55%)] opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-4 right-4 h-7 w-7 rounded-full flex items-center justify-center bg-white/[0.04] text-white/40 group-hover:text-white group-hover:bg-white/[0.08] transition-colors">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>

            <div className="relative flex flex-col justify-between min-h-[120px]">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">Receita acumulada</span>
              </div>

              <div className="mt-4">
                <p className="text-[40px] leading-none font-light tracking-tight text-white tabular-nums">
                  {fmtBRL(stats?.totalRevenue || 0)}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300/90">
                    <TrendingUp className="h-3 w-3" />
                    Via Mercado Pago
                  </span>
                  <span className="text-white/20">·</span>
                  <span className="text-[11px] text-white/40">Toque para ver transações</span>
                </div>
              </div>
            </div>
          </button>

          {/* Stacked secondary metrics */}
          <div className="col-span-12 lg:col-span-5 grid grid-rows-2 gap-3">
            <SurfaceMetric
              label="Compositores"
              value={stats?.totalComposers || 0}
              hint="Cadastrados na plataforma"
              icon={<Users className="h-3.5 w-3.5" />}
            />
            <SurfaceMetric
              label="Obras Protegidas"
              value={stats?.totalProtectedWorks || 0}
              hint="Registradas com autoria"
              icon={<Shield className="h-3.5 w-3.5" />}
              accent="emerald"
            />
          </div>
        </section>

        {/* Plan distribution + Origin report on same row to fit viewport */}
        <section className="grid grid-cols-12 gap-3">
          <div className="col-span-12 xl:col-span-7 grid grid-cols-12 gap-3">
            <PlanTile
              span="col-span-6 md:col-span-4"
              tone="pro"
              label="Plano Pro"
              value={stats?.proUsers || 0}
              hint="Assinaturas ativas"
              icon={<CreditCard className="h-3.5 w-3.5" />}
              onClick={() => setSelectedPlan('pro')}
            />
            <PlanTile
              span="col-span-6 md:col-span-4"
              tone="trial"
              label="Trial"
              value={stats?.trialUsers || 0}
              hint="Em teste"
              icon={<Clock className="h-3.5 w-3.5" />}
              onClick={() => setSelectedPlan('trial')}
            />
            <PlanTile
              span="col-span-6 md:col-span-4"
              tone="free"
              label="Grátis"
              value={stats?.freeUsers || 0}
              hint="Usuários gratuitos"
              icon={<UserCheck className="h-3.5 w-3.5" />}
              onClick={() => setSelectedPlan('free')}
            />
            <PlanTile
              span="col-span-6 md:col-span-8"
              tone="inactive"
              label="Inativos +30d"
              value={stats?.inactiveUsers || 0}
              hint="Reengajamento"
              icon={<UserX className="h-3.5 w-3.5" />}
              onClick={() => setSelectedPlan('inactive')}
              horizontal
            />
            <PlanTile
              span="col-span-6 md:col-span-4"
              tone="neutral"
              label="Total ativos"
              value={(stats?.proUsers || 0) + (stats?.trialUsers || 0) + (stats?.freeUsers || 0)}
              hint="Soma dos planos"
              icon={<Users className="h-3.5 w-3.5" />}
            />
          </div>

          <div className="col-span-12 xl:col-span-5">
            <UserOriginReport />
          </div>
        </section>
      </div>

      <RevenueDetailsModal
        open={showRevenueModal}
        onOpenChange={setShowRevenueModal}
        transactions={revenueTransactions}
        isLoading={revenueLoading}
      />

      {selectedPlan && (
        <UsersByPlanModal
          open={!!selectedPlan}
          onOpenChange={(open) => !open && setSelectedPlan(null)}
          users={usersByPlan}
          isLoading={usersLoading}
          planType={selectedPlan}
        />
      )}
    </>
  );
};

/* ---------- presentation primitives ---------- */

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
                    transition-colors duration-200">
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

const PlanTile: React.FC<{
  span: string;
  tone: 'pro' | 'trial' | 'free' | 'inactive' | 'neutral';
  label: string;
  value: number;
  hint: string;
  icon: React.ReactNode;
  onClick?: () => void;
  tall?: boolean;
  horizontal?: boolean;
}> = ({ span, tone, label, value, hint, icon, onClick, tall, horizontal }) => {
  const tones: Record<string, string> = {
    pro: 'bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.10),transparent_60%)]',
    trial: 'bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_60%)]',
    free: 'bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.04),transparent_60%)]',
    inactive: 'bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.07),transparent_60%)]',
    neutral: 'bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.04),transparent_60%)]',
  };
  const dot: Record<string, string> = {
    pro: 'bg-emerald-400',
    trial: 'bg-white/60',
    free: 'bg-white/40',
    inactive: 'bg-red-400/80',
    neutral: 'bg-white/40',
  };

  const Tag: any = onClick ? 'button' : 'div';

  return (
    <Tag
      onClick={onClick}
      className={`${span} group relative text-left rounded-2xl overflow-hidden p-6
                  bg-white/[0.025] hover:bg-white/[0.04]
                  shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_20px_40px_-25px_rgba(0,0,0,0.55)]
                  transition-all duration-200 ${tall ? 'min-h-[200px]' : 'min-h-[140px]'}`}
    >
      <div className={`absolute inset-0 ${tones[tone]} opacity-70`} />
      <div className={`relative h-full flex ${horizontal ? 'flex-row items-center justify-between gap-6' : 'flex-col justify-between'}`}>
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${dot[tone]}`} />
          <span className="text-[11px] uppercase tracking-[0.16em] text-white/45">{label}</span>
        </div>
        <div className={horizontal ? 'flex items-baseline gap-4' : ''}>
          <p className={`${tall ? 'text-5xl' : 'text-4xl'} font-light tracking-tight text-white tabular-nums`}>{value}</p>
          <p className="text-xs text-white/35 mt-2">{hint}</p>
        </div>
        {!horizontal && (
          <div className="absolute top-5 right-5 h-7 w-7 rounded-full flex items-center justify-center bg-white/[0.04] text-white/50 group-hover:text-white/80 transition-colors">
            {icon}
          </div>
        )}
        {horizontal && (
          <div className="h-9 w-9 rounded-full flex items-center justify-center bg-white/[0.04] text-white/55">
            {icon}
          </div>
        )}
      </div>
    </Tag>
  );
};
