import React, { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { AdminOverview } from '@/components/admin/AdminOverview';
import { AdminUsers } from '@/components/admin/AdminUsers';
import { AdminRoles } from '@/components/admin/AdminRoles';
import { AdminAffiliates } from '@/components/admin/AdminAffiliates';
import { AdminContent } from '@/components/admin/AdminContent';
import { AdminTutorials } from '@/components/admin/AdminTutorials';
import { AdminBanners } from '@/components/admin/AdminBanners';
import { AdminCertificates } from '@/components/admin/AdminCertificates';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { AdminOfferAnalytics } from '@/components/admin/AdminOfferAnalytics';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { AdminLogs } from '@/components/admin/AdminLogs';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminModerators } from '@/components/admin/AdminModerators';
import { AdminMenuFunctions } from '@/components/admin/AdminMenuFunctions';
import { AdminForms } from '@/components/admin/AdminForms';
import { AdminAffiliateWithdrawals } from '@/components/admin/AdminAffiliateWithdrawals';
import { AdminCoupons } from '@/components/admin/AdminCoupons';
import { AdminGamification } from '@/components/admin/AdminGamification';
import { AdminRaffle } from '@/components/admin/AdminRaffle';
import { OnlineVisitorsPanel } from '@/components/admin/OnlineVisitorsPanel';
import { AdminRegistrations } from '@/components/admin/AdminRegistrations';
import { AdminApiSettings } from '@/components/admin/AdminApiSettings';
import { MarketingDashboard } from '@/components/admin/marketing/MarketingDashboard';
import { AdminMusicPreviews } from '@/components/admin/AdminMusicPreviews';
import { AdminPortfolio } from '@/components/admin/AdminPortfolio';
import { MobileAdminDashboard } from '@/components/admin/MobileAdminDashboard';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProfile } from '@/hooks/useProfile';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { Search, Bell, Command } from 'lucide-react';
import { buildPreviewSafePath } from '@/utils/previewToken';
import { subscribeToOnlineVisitors } from '@/services/realtimePresenceService';

const AdminDashboard: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('overview');
  const [adminConfirmed, setAdminConfirmed] = useState<boolean | null>(null);
  const [adminConfirming, setAdminConfirming] = useState(false);

  const [systemHealth, setSystemHealth] = useState<{
    activeUsers: number | null;
    responseTime: number | null;
    mrr: number | null;
    activePro: number | null;
  }>({
    activeUsers: null,
    responseTime: null,
    mrr: null,
    activePro: null,
  });

  const [bizMetrics, setBizMetrics] = useState<{
    revenue30d: number | null;
    newToday: number | null;
    trialConversion: number | null;
    churn30d: number | null;
    avgTicket: number | null;
    worksToday: number | null;
    judgmentQueue: number | null;
  }>({
    revenue30d: null,
    newToday: null,
    trialConversion: null,
    churn30d: null,
    avgTicket: null,
    worksToday: null,
    judgmentQueue: null,
  });



  const { profile } = useProfile();

  useEffect(() => {
    const shouldConfirm =
      !authLoading &&
      !roleLoading &&
      isAuthenticated &&
      !isAdmin &&
      adminConfirmed === null &&
      !adminConfirming;

    if (!shouldConfirm) return;

    let cancelled = false;

    (async () => {
      try {
        setAdminConfirming(true);
        const { data, error } = await supabase.rpc('check_admin_access');
        if (error) throw error;
        if (cancelled) return;
        setAdminConfirmed(!!data);
      } catch (e) {
        console.error('❌ AdminDashboard: Falha ao confirmar acesso admin:', e);
        if (!cancelled) setAdminConfirmed(false);
      } finally {
        if (!cancelled) setAdminConfirming(false);
      }
    })();

    return () => { cancelled = true; };
  }, [authLoading, roleLoading, isAuthenticated, isAdmin, adminConfirmed, adminConfirming]);

  const effectiveIsAdmin = isAdmin || adminConfirmed === true;
  const gateLoading = authLoading || roleLoading || (isAuthenticated && !isAdmin && adminConfirmed === null);

  // Visitantes online — presença em tempo real
  useEffect(() => {
    if (gateLoading || !effectiveIsAdmin) return;
    const channel = subscribeToOnlineVisitors((visitors) => {
      setSystemHealth((prev) => ({ ...prev, activeUsers: visitors.length }));
    });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [effectiveIsAdmin, gateLoading]);

  // Latência real — ping leve ao Supabase a cada 15s
  useEffect(() => {
    if (gateLoading || !effectiveIsAdmin) return;
    let cancelled = false;
    const measure = async () => {
      const start = performance.now();
      try {
        await supabase.from('profiles').select('id', { head: true, count: 'exact' }).limit(1);
        const elapsed = Math.round(performance.now() - start);
        if (!cancelled) setSystemHealth((prev) => ({ ...prev, responseTime: elapsed }));
      } catch {
        if (!cancelled) setSystemHealth((prev) => ({ ...prev, responseTime: null }));
      }
    };
    measure();
    const id = window.setInterval(measure, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [effectiveIsAdmin, gateLoading]);

  // MRR — soma de assinaturas PRO ativas (não vencidas)
  useEffect(() => {
    if (gateLoading || !effectiveIsAdmin) return;
    let cancelled = false;
    const loadMrr = async () => {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('amount')
          .eq('status', 'active')
          .eq('plan_type', 'pro')
          .gt('expires_at', new Date().toISOString());
        if (error) throw error;
        if (cancelled) return;
        const rows = (data || []) as Array<{ amount: number | null }>;
        const total = rows.reduce((s, r) => s + (Number(r.amount) || 29.9), 0);
        setSystemHealth((prev) => ({ ...prev, mrr: total, activePro: rows.length }));
      } catch {
        if (!cancelled) setSystemHealth((prev) => ({ ...prev, mrr: null }));
      }
    };
    loadMrr();
    const id = window.setInterval(loadMrr, 60000);
    return () => { cancelled = true; window.clearInterval(id); };
  }, [effectiveIsAdmin, gateLoading]);

  // Métricas de negócio — receita 30d, novos hoje, churn, conversão, ticket, obras, fila
  useEffect(() => {
    if (gateLoading || !effectiveIsAdmin) return;
    let cancelled = false;
    const loadBiz = async () => {
      const now = new Date();
      const iso30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      const [
        rev30Res,
        newTodayRes,
        trialExpiredRes,
        proFromTrialRes,
        churnRes,
        avgTicketRes,
        worksTodayRes,
        queueRes,
      ] = await Promise.all([
        supabase.from('moderator_transactions').select('amount').gte('created_at', iso30),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
        supabase.from('subscriptions').select('id', { count: 'exact', head: true })
          .eq('plan_type', 'trial').eq('status', 'expired').gte('updated_at', iso30),
        supabase.from('subscriptions').select('id', { count: 'exact', head: true })
          .eq('plan_type', 'pro').gte('created_at', iso30),
        supabase.from('subscriptions').select('id', { count: 'exact', head: true })
          .eq('plan_type', 'pro').eq('status', 'expired').gte('expires_at', iso30),
        supabase.from('moderator_transactions').select('amount').gte('created_at', iso30),
        supabase.from('author_registrations').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
        supabase.from('subscriptions').select('id', { count: 'exact', head: true })
          .eq('plan_type', 'trial').eq('status', 'trial'),
      ]);

      if (cancelled) return;

      const rev30 = (rev30Res.data || []).reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
      const trialExpired = trialExpiredRes.count || 0;
      const proCreated = proFromTrialRes.count || 0;
      const conversion = trialExpired > 0 ? (proCreated / trialExpired) * 100 : null;
      const ticketRows = (avgTicketRes.data || []) as Array<{ amount: number | null }>;
      const avgTicket = ticketRows.length
        ? ticketRows.reduce((s, r) => s + (Number(r.amount) || 0), 0) / ticketRows.length
        : null;

      setBizMetrics({
        revenue30d: rev30,
        newToday: newTodayRes.count ?? 0,
        trialConversion: conversion,
        churn30d: churnRes.count ?? 0,
        avgTicket,
        worksToday: worksTodayRes.count ?? 0,
        judgmentQueue: queueRes.count ?? 0,
      });
    };
    loadBiz();
    const id = window.setInterval(loadBiz, 120000);
    return () => { cancelled = true; window.clearInterval(id); };
  }, [effectiveIsAdmin, gateLoading]);



  if (gateLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="text-center space-y-4">

          <div className="animate-spin rounded-full h-10 w-10 border-t border-white/40 mx-auto" />
          <p className="text-white/50 text-sm tracking-wide">
            {authLoading || roleLoading ? 'Verificando sessão…' : 'Confirmando permissões…'}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to={buildPreviewSafePath('/dashboard')} replace />;
  if (!effectiveIsAdmin) return <Navigate to={buildPreviewSafePath('/dashboard')} replace />;
  if (isMobile) return <MobileAdminDashboard />;

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview': return <AdminOverview bizMetrics={bizMetrics} />;
      case 'online-visitors': return <OnlineVisitorsPanel />;
      case 'users': return <AdminUsers />;
      case 'registrations': return <AdminRegistrations />;
      case 'moderators': return <AdminModerators />;
      case 'roles': return <AdminRoles />;
      case 'affiliates': return <AdminAffiliates />;
      case 'affiliate-withdrawals': return <AdminAffiliateWithdrawals />;
      case 'coupons': return <AdminCoupons />;
      case 'gamification': return <AdminGamification />;
      case 'raffle': return <AdminRaffle />;
      case 'content': return <AdminContent />;
      case 'tutorials': return <AdminTutorials />;
      case 'banners': return <AdminBanners />;
      case 'certificates': return <AdminCertificates />;
      case 'forms': return <AdminForms />;
      case 'analytics': return <AdminAnalytics />;
      case 'offer-analytics': return <AdminOfferAnalytics />;
      case 'marketing': return <MarketingDashboard />;
      case 'music-previews': return <AdminMusicPreviews />;
      case 'portfolio': return <AdminPortfolio />;
      case 'logs': return <AdminLogs />;
      case 'menu-functions': return <AdminMenuFunctions />;
      case 'api-settings': return <AdminApiSettings />;
      case 'settings': return <AdminSettings />;
      default: return <AdminOverview />;
    }
  };

  const now = new Date();
  const greeting = (() => {
    const h = now.getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  })();
  const dateLabel = now.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long'
  });
  const firstName = profile?.name?.split(' ')[0] || 'admin';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#0a0a0b] text-white relative overflow-hidden">
        {/* Ambient background — discreet light */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-emerald-500/[0.06] blur-[120px]" />
          <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-white/[0.025] blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(255,255,255,0.04),transparent_60%)]" />
        </div>

        <div className="fixed z-40 md:static md:z-auto">
          <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <SidebarInset className="flex-1 relative bg-transparent">
          {/* Premium Header */}
          <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#0a0a0b]/70 border-b border-white/[0.06]">
            <div className="flex items-center gap-6 px-6 h-[52px]">
              <div className="flex-1 min-w-0 flex items-center gap-3">
                <h1 className="text-[13px] font-medium text-white tracking-tight whitespace-nowrap">
                  {greeting}, <span className="text-white/60 font-normal">{firstName}</span>
                </h1>
                <span className="text-white/20 text-xs">·</span>
                <span className="text-[11px] text-white/40 capitalize tracking-wide whitespace-nowrap">{dateLabel}</span>
                <span className="text-white/15 text-xs hidden md:inline">·</span>
                <span className="hidden md:inline text-[10px] text-white/30 tracking-[0.14em] uppercase whitespace-nowrap">
                  Compuse — Painel Executivo
                </span>
              </div>

              {/* Global search */}
              <div className="hidden lg:flex items-center gap-2 h-8 px-3 rounded-full bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] transition-colors cursor-pointer w-[220px]">
                <Search className="h-3 w-3 text-white/40" />
                <span className="text-[11px] text-white/40 flex-1">Pesquisar…</span>
                <kbd className="flex items-center gap-0.5 text-[10px] text-white/40 px-1 py-0.5 rounded bg-white/[0.05] border border-white/[0.06]">
                  <Command className="h-2.5 w-2.5" />K
                </kbd>
              </div>

              {/* Status pills — discreet */}
              <div className="hidden xl:flex items-center gap-1.5">
                <StatusPill
                  dot="bg-emerald-400"
                  label="MRR"
                  value={
                    systemHealth.mrr === null
                      ? '—'
                      : systemHealth.mrr.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 2,
                        })
                  }
                />
                <StatusPill
                  dot="bg-emerald-400"
                  label="Online"
                  value={systemHealth.activeUsers === null ? '—' : String(systemHealth.activeUsers)}
                />
                <StatusPill
                  dot={
                    systemHealth.responseTime === null
                      ? 'bg-white/30'
                      : systemHealth.responseTime < 250
                      ? 'bg-emerald-400'
                      : systemHealth.responseTime < 600
                      ? 'bg-amber-400'
                      : 'bg-red-400'
                  }
                  label="Latência"
                  value={systemHealth.responseTime === null ? 'medindo…' : `${systemHealth.responseTime}ms`}
                />
              </div>


              <button className="relative h-8 w-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors">
                <Bell className="h-3.5 w-3.5" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <Avatar className="w-8 h-8 cursor-pointer ring-1 ring-white/10 hover:ring-white/20 transition">
                    <AvatarImage src={profile?.avatar_url} alt={profile?.name} />
                    <AvatarFallback className="bg-white/[0.06] text-white/70 text-[10px]">
                      {profile?.name?.slice(0, 2).toUpperCase() || 'AD'}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#141416] border-white/[0.08] text-white/80">
                  <DropdownMenuItem asChild className="focus:bg-white/[0.06] focus:text-white">
                    <Link to="/dashboard">Painel Usuário</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>


          {/* Main */}
          <main className="relative px-6 py-4">
            <div className="max-w-[1400px] mx-auto">
              {renderActiveTab()}
            </div>
          </main>

        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

const StatusPill: React.FC<{ dot: string; label: string; value: string }> = ({ dot, label, value }) => (
  <div className="flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
    <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
    <span className="text-[10px] text-white/45 tracking-wide">{label}</span>
    <span className="text-[10px] text-white/85 font-medium tabular-nums">{value}</span>
  </div>
);

const MetricChip: React.FC<{ label: string; value: string; accent?: boolean }> = ({ label, value, accent }) => (
  <div className="flex items-center gap-2 h-6 px-2.5 rounded-md bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] transition-colors whitespace-nowrap">
    <span className="text-[10px] uppercase tracking-[0.12em] text-white/40">{label}</span>
    <span className={`text-[11px] font-medium tabular-nums ${accent ? 'text-amber-300/90' : 'text-white/85'}`}>{value}</span>
  </div>
);


export default AdminDashboard;
