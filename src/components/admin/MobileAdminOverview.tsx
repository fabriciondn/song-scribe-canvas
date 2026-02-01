import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAdminDashboardStats, getRevenueTransactions, getUsersByPlan } from '@/services/adminService';
import { RevenueDetailsModal } from './RevenueDetailsModal';
import { UsersByPlanModal } from './UsersByPlanModal';
import { Users, FileText, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const MobileAdminOverview: React.FC = () => {
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

  // Dados de origem dos usuários
  const { data: originData } = useQuery({
    queryKey: ['admin-user-origin-data'],
    queryFn: async () => {
      const { data: affiliateUsers } = await supabase
        .from('profiles')
        .select('id')
        .not('referred_by', 'is', null);

      const { data: moderatorUsers } = await supabase
        .from('moderator_users')
        .select('user_id');

      const totalUsers = stats?.totalComposers || 0;
      const byAffiliate = affiliateUsers?.length || 0;
      const byModerator = moderatorUsers?.length || 0;
      const direct = Math.max(0, totalUsers - byAffiliate - byModerator);

      return {
        total: totalUsers,
        byAffiliate,
        byModerator,
        direct,
        affiliatePercent: totalUsers > 0 ? Math.round((byAffiliate / totalUsers) * 100) : 0,
        moderatorPercent: totalUsers > 0 ? Math.round((byModerator / totalUsers) * 100) : 0,
        directPercent: totalUsers > 0 ? Math.round((direct / totalUsers) * 100) : 0,
      };
    },
    enabled: !!stats?.totalComposers,
  });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <main className="px-4 mt-6 space-y-8 pb-28">
        {/* Stats Cards - Horizontal Scroll */}
        <section>
          <div className="flex overflow-x-auto gap-4 py-2 hide-scrollbar">
            {/* Total Compositores */}
            <div className="min-w-[280px] bg-[#0A0A0A] rounded-xl p-6 border border-white/10 relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">+12%</span>
              </div>
              <h3 className="text-4xl font-bold mb-1 text-white">{stats?.totalComposers || 0}</h3>
              <p className="text-white/50 text-sm font-medium">Total de Compositores</p>
            </div>

            {/* Obras Protegidas */}
            <div className="min-w-[280px] bg-[#0A0A0A] rounded-xl p-6 border border-white/10 relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">+5.4%</span>
              </div>
              <h3 className="text-4xl font-bold mb-1 text-white">{stats?.totalProtectedWorks || 0}</h3>
              <p className="text-white/50 text-sm font-medium">Obras Protegidas</p>
            </div>

            {/* Total Faturado */}
            <div 
              className="min-w-[280px] bg-[#0A0A0A] rounded-xl p-6 border border-white/10 relative overflow-hidden cursor-pointer active:opacity-80"
              onClick={() => setShowRevenueModal(true)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">Meta 85%</span>
              </div>
              <h3 className="text-4xl font-bold mb-1 text-white">
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(stats?.totalRevenue || 0)}
              </h3>
              <p className="text-white/50 text-sm font-medium">Total Faturado</p>
            </div>
          </div>
        </section>

        {/* Status dos Planos */}
        <section>
          <div className="flex justify-between items-center mb-4 px-1">
            <h2 className="text-lg font-bold tracking-tight text-white">Status dos Planos</h2>
            <button className="text-primary text-sm font-bold">Ver todos</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Premium */}
            <div 
              className="bg-[#0A0A0A] border border-white/10 p-5 rounded-xl flex flex-col gap-3 cursor-pointer active:opacity-80"
              onClick={() => setSelectedPlan('pro')}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-primary">Premium</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.proUsers || 0}</p>
                <p className="text-white/40 text-[11px] font-medium">Plano Pro</p>
              </div>
            </div>

            {/* Trial */}
            <div 
              className="bg-[#0A0A0A] border border-white/10 p-5 rounded-xl flex flex-col gap-3 cursor-pointer active:opacity-80"
              onClick={() => setSelectedPlan('trial')}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white/40"></div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Trial</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.trialUsers || 0}</p>
                <p className="text-white/40 text-[11px] font-medium">Em teste</p>
              </div>
            </div>

            {/* Free */}
            <div 
              className="bg-[#0A0A0A] border border-white/10 p-5 rounded-xl flex flex-col gap-3 cursor-pointer active:opacity-80"
              onClick={() => setSelectedPlan('free')}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white/20"></div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/20">Free</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.freeUsers || 0}</p>
                <p className="text-white/40 text-[11px] font-medium">Plano Grátis</p>
              </div>
            </div>

            {/* Inativos */}
            <div 
              className="bg-[#0A0A0A] border border-white/10 p-5 rounded-xl flex flex-col gap-3 cursor-pointer active:opacity-80"
              onClick={() => setSelectedPlan('inactive')}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white/10"></div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Inativos</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.inactiveUsers || 0}</p>
                <p className="text-white/40 text-[11px] font-medium">Mais de 30d</p>
              </div>
            </div>
          </div>
        </section>

        {/* Origem dos Usuários */}
        <section className="bg-[#0A0A0A] rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-white">Origem dos Usuários</h3>
              <p className="text-white/40 text-xs mt-1">Base total: {originData?.total || stats?.totalComposers || 0} usuários</p>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-white/5 border-t-primary flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary">100%</span>
            </div>
          </div>
          <div className="space-y-6">
            {/* Por Afiliado */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                <span className="text-white/60">Por Afiliado</span>
                <span className="text-primary">{originData?.byAffiliate || 0} ({originData?.affiliatePercent || 0}%)</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500" 
                  style={{ width: `${originData?.affiliatePercent || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Por Moderador */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                <span className="text-white/60">Por Moderador</span>
                <span className="text-white">{originData?.byModerator || 0} ({originData?.moderatorPercent || 0}%)</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white/40 rounded-full transition-all duration-500" 
                  style={{ width: `${originData?.moderatorPercent || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Cadastro Direto */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                <span className="text-white/60">Cadastro Direto</span>
                <span className="text-primary">{originData?.direct || 0} ({originData?.directPercent || 0}%)</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary/60 rounded-full transition-all duration-500" 
                  style={{ width: `${originData?.directPercent || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </section>
      </main>

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

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};
