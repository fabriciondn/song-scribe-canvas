import React, { useState } from 'react';
import { ShieldCheck, Bell, FileText, Package, Users, Menu, X, LayoutDashboard, UserCog, Award, Gift, BarChart3, Settings, Ticket, ScrollText, Image, GraduationCap, FileCheck, TrendingUp, Activity, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useProfile } from '@/hooks/useProfile';
import { Link } from 'react-router-dom';
import { MobileAdminOverview } from './MobileAdminOverview';
import { AdminForms } from './AdminForms';
import { AdminRegistrations } from './AdminRegistrations';
import { AdminUsers } from './AdminUsers';
import { AdminAffiliates } from './AdminAffiliates';
import { AdminAffiliateWithdrawals } from './AdminAffiliateWithdrawals';
import { AdminCoupons } from './AdminCoupons';
import { AdminGamification } from './AdminGamification';
import { AdminRaffle } from './AdminRaffle';
import { AdminContent } from './AdminContent';
import { AdminTutorials } from './AdminTutorials';
import { AdminBanners } from './AdminBanners';
import { AdminCertificates } from './AdminCertificates';
import { AdminAnalytics } from './AdminAnalytics';
import { AdminOfferAnalytics } from './AdminOfferAnalytics';
import { AdminLogs } from './AdminLogs';
import { AdminMenuFunctions } from './AdminMenuFunctions';
import { AdminSettings } from './AdminSettings';
import { AdminModerators } from './AdminModerators';
import { AdminRoles } from './AdminRoles';
import { OnlineVisitorsPanel } from './OnlineVisitorsPanel';

type TabType = 'overview' | 'forms' | 'registrations' | 'users' | 'moderators' | 'roles' | 'affiliates' | 'affiliate-withdrawals' | 'coupons' | 'gamification' | 'raffle' | 'content' | 'tutorials' | 'banners' | 'certificates' | 'analytics' | 'offer-analytics' | 'logs' | 'menu-functions' | 'settings' | 'online-visitors';

const menuItems = [
  { key: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
  { key: 'online-visitors', label: 'Visitantes Online', icon: Activity },
  { key: 'users', label: 'Usuários', icon: Users },
  { key: 'registrations', label: 'Registros', icon: FileCheck },
  { key: 'moderators', label: 'Moderadores', icon: UserCog },
  { key: 'roles', label: 'Papéis', icon: Award },
  { key: 'affiliates', label: 'Afiliados', icon: Users },
  { key: 'affiliate-withdrawals', label: 'Saques Afiliados', icon: TrendingUp },
  { key: 'coupons', label: 'Cupons', icon: Ticket },
  { key: 'gamification', label: 'Gamificação', icon: Gift },
  { key: 'raffle', label: 'Sorteio', icon: Gift },
  { key: 'forms', label: 'Formulários', icon: ScrollText },
  { key: 'content', label: 'Conteúdo', icon: FileText },
  { key: 'tutorials', label: 'Tutoriais', icon: GraduationCap },
  { key: 'banners', label: 'Banners', icon: Image },
  { key: 'certificates', label: 'Certificados', icon: FileCheck },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'offer-analytics', label: 'Analytics Oferta', icon: TrendingUp },
  { key: 'logs', label: 'Logs', icon: Activity },
  { key: 'menu-functions', label: 'Funções Menu', icon: Menu },
  { key: 'settings', label: 'Configurações', icon: Settings },
];

export const MobileAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const { profile } = useProfile();

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <MobileAdminOverview />;
      case 'forms':
        return <AdminForms />;
      case 'registrations':
        return <AdminRegistrations />;
      case 'users':
        return <AdminUsers />;
      case 'moderators':
        return <AdminModerators />;
      case 'roles':
        return <AdminRoles />;
      case 'affiliates':
        return <AdminAffiliates />;
      case 'affiliate-withdrawals':
        return <AdminAffiliateWithdrawals />;
      case 'coupons':
        return <AdminCoupons />;
      case 'gamification':
        return <AdminGamification />;
      case 'raffle':
        return <AdminRaffle />;
      case 'content':
        return <AdminContent />;
      case 'tutorials':
        return <AdminTutorials />;
      case 'banners':
        return <AdminBanners />;
      case 'certificates':
        return <AdminCertificates />;
      case 'analytics':
        return <AdminAnalytics />;
      case 'offer-analytics':
        return <AdminOfferAnalytics />;
      case 'logs':
        return <AdminLogs />;
      case 'menu-functions':
        return <AdminMenuFunctions />;
      case 'settings':
        return <AdminSettings />;
      case 'online-visitors':
        return <OnlineVisitorsPanel />;
      default:
        return <MobileAdminOverview />;
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header 
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-5 bg-black/80 backdrop-blur-md border-b border-white/5"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}
      >
        <div className="flex items-center gap-3">
          <div className="size-10 bg-primary rounded-lg flex items-center justify-center">
            <ShieldCheck className="size-6 text-black" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none text-white">Compuse</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">Admin Console</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative">
            <Bell className="size-6 text-white/60" />
            <span className="absolute -top-1 -right-1 size-4 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-black">3</span>
          </button>
          <Avatar className="size-9 ring-2 ring-primary ring-offset-2 ring-offset-black">
            <AvatarImage src={profile?.avatar_url} alt={profile?.name} />
            <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
              {profile?.name?.slice(0, 2).toUpperCase() || 'AD'}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Main Content */}
      <main 
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ 
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 24px))',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {renderContent()}
      </main>

      {/* Bottom Navigation - Glass Effect */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 h-20 px-4 flex items-center justify-around"
        style={{
          background: 'rgba(10, 10, 10, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom, 0px))'
        }}
      >
        <button 
          onClick={() => handleTabChange('forms')}
          className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'forms' ? 'text-primary' : 'text-white/40'}`}
        >
          <FileText className="size-6" />
          <span className="text-[10px] font-bold">Formulários</span>
        </button>
        
        <button 
          onClick={() => handleTabChange('registrations')}
          className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'registrations' ? 'text-primary' : 'text-white/40'}`}
        >
          <Package className="size-6" />
          <span className="text-[10px] font-bold">Registros</span>
        </button>
        
        <button 
          onClick={() => handleTabChange('users')}
          className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'users' ? 'text-primary' : 'text-white/40'}`}
        >
          <Users className="size-6" />
          <span className="text-[10px] font-bold">Usuários</span>
        </button>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button 
              className={`flex flex-col items-center gap-1.5 transition-colors ${menuOpen ? 'text-primary' : 'text-white/40'}`}
            >
              <Menu className="size-6" />
              <span className="text-[10px] font-bold">Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent 
            side="right" 
            className="w-[85%] max-w-sm bg-black border-l border-white/10 p-0"
          >
            <SheetHeader className="p-6 border-b border-white/10">
              <SheetTitle className="text-white flex items-center gap-3">
                <div className="size-10 bg-primary rounded-lg flex items-center justify-center">
                  <ShieldCheck className="size-6 text-black" strokeWidth={2.5} />
                </div>
                <div>
                  <span className="block text-lg font-bold">Menu Admin</span>
                  <span className="block text-[10px] uppercase tracking-[0.2em] text-primary font-bold">Todas as opções</span>
                </div>
              </SheetTitle>
            </SheetHeader>
            
            <div className="overflow-y-auto h-[calc(100vh-180px)] py-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleTabChange(item.key as TabType)}
                    className={`w-full flex items-center gap-4 px-6 py-4 transition-colors ${
                      isActive 
                        ? 'bg-primary/10 text-primary border-l-2 border-primary' 
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="size-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/10 bg-black">
              <Link 
                to="/dashboard" 
                className="flex items-center gap-3 text-white/60 hover:text-white transition-colors"
              >
                <LogOut className="size-5" />
                <span className="font-medium">Voltar ao Dashboard</span>
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </nav>

      {/* Home Indicator Line */}
      <div 
        className="fixed left-1/2 -translate-x-1/2 w-36 h-1 bg-white/20 rounded-full z-[60]"
        style={{ bottom: 'max(8px, calc(env(safe-area-inset-bottom, 0px) - 16px))' }}
      />
    </div>
  );
};
