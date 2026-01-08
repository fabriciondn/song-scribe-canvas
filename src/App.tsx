import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, LoginMessageProvider } from "./context/AuthContext";
import { ImpersonationProvider } from "./context/ImpersonationContext";
import { useImpersonationSync } from "./hooks/useImpersonationSync";
import { NotificationProvider } from "@/components/ui/notification";
import { ImpersonationBanner } from "@/components/ui/impersonation-banner";
import { RoleRedirect } from "@/components/layout/RoleRedirect";
import { GlobalNotifications } from "@/components/GlobalNotifications";
import { PageFunctionStatusWrapper } from "@/components/layout/FunctionStatusWrapper";
import { MobileSplashScreen } from "@/components/mobile/MobileSplashScreen";
import { useMobileDetection } from "@/hooks/use-mobile";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/DashboardHome";
import MyPurchases from "./pages/MyPurchases";
import Composer from "./pages/Composer";
import Cifrador from "./pages/Cifrador";
import CifradorNeo from "./pages/CifradorNeo";
import Bases from "./pages/Bases";
import Templates from "./pages/Templates";
import Plans from "./pages/Plans";
import Checkout from "./pages/Checkout";
import CreditsCheckout from "./pages/CreditsCheckout";
import SubscriptionCheckout from "./pages/SubscriptionCheckout";
import PendriveCheckout from "./pages/PendriveCheckout";
import Folders from "./pages/Folders";
import Drafts from "./pages/Drafts";
import Partnerships from "./pages/Partnerships";
import AuthorRegistration from "./pages/AuthorRegistration";
import RegisteredWorks from "./pages/RegisteredWorks";
import Trash from "./pages/Trash";
import Settings from "./pages/Settings";
import Tutorials from "./pages/Tutorials";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import ModeratorDashboard from "./pages/ModeratorDashboard";
import AffiliateDashboard from "./pages/AffiliateDashboard";
import AffiliateApplication from "./pages/AffiliateApplication";
import ModeratorAuth from "./pages/ModeratorAuth";
import ModeratorRecharge from "./pages/ModeratorRecharge";
import AffiliateLink from "./pages/AffiliateLink";
import PublicRegistrationForm from "./pages/PublicRegistrationForm";
import Ranking from "./pages/Ranking";
import ResetPassword from "./pages/ResetPassword";
import Pendrive from "./pages/Pendrive";
import Acordes from "./pages/Acordes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

const AppContent = () => {
  useImpersonationSync();
  const [showSplash, setShowSplash] = useState(true);
  const { isMobile } = useMobileDetection();

  const DashboardOutlet = () => <Outlet />;
  
  return (
    <div className={`flex flex-col min-h-screen ${isMobile ? 'bg-[#000000]' : ''}`}>
      {/* Mobile Splash Screen */}
      {showSplash && (
        <MobileSplashScreen onComplete={() => setShowSplash(false)} />
      )}
      
      {/* Esconder banners e notificações no mobile - já está dentro do MobileDashboardHome */}
      {!isMobile && <ImpersonationBanner />}
      {!isMobile && <GlobalNotifications />}
      
      <div style={{
        paddingTop: isMobile ? '0px' : 'var(--impersonation-banner-height, 0px)'
      }} className={isMobile ? 'flex-1' : 'flex-1 py-[4px]'}>
        <RoleRedirect />
        <PageFunctionStatusWrapper>
          <Routes>
            <Route path="/" element={<Index />} />

            {/* Mantém o Dashboard montado ao navegar entre funções (evita piscada do menu) */}
            <Route element={<Dashboard />}>
              <Route path="/dashboard" element={<DashboardOutlet />}>
                <Route index element={<DashboardHome />} />
                <Route path="my-purchases" element={<MyPurchases />} />
                <Route path="composer" element={<Composer />} />
                <Route path="cifrador" element={<Cifrador />} />
                <Route path="bases" element={<Bases />} />
                <Route path="templates" element={<Templates />} />
                <Route path="folders/*" element={<Folders />} />
                <Route path="drafts" element={<Drafts />} />
                <Route path="partnerships" element={<Partnerships />} />
                <Route path="author-registration" element={<AuthorRegistration />} />
                <Route path="registered-works" element={<RegisteredWorks />} />
                <Route path="tutorials" element={<Tutorials />} />
                <Route path="ranking" element={<Ranking />} />
                <Route path="acordes" element={<Acordes />} />
                <Route path="settings" element={<Settings />} />
                <Route path="trash" element={<Trash />} />
                <Route path="pendrive" element={<Pendrive />} />
              </Route>

              {/* Rotas antigas fora de /dashboard continuam funcionando sem remontar o layout */}
              <Route path="/composer" element={<Composer />} />
              <Route path="/cifrador" element={<Cifrador />} />
              <Route path="/cifrador-neo" element={<CifradorNeo />} />
              <Route path="/bases" element={<Bases />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/folders/*" element={<Folders />} />
              <Route path="/drafts" element={<Drafts />} />
              <Route path="/partnerships" element={<Partnerships />} />
              <Route path="/pendrive" element={<Pendrive />} />
              <Route path="/plans" element={<Plans />} />
              <Route path="/checkout" element={<Checkout />} />
            </Route>

            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/moderator" element={<ModeratorDashboard />} />
            <Route path="/affiliate" element={<AffiliateDashboard />} />
            <Route path="/affiliate-application" element={<AffiliateApplication />} />
            <Route path="/affiliate/*" element={<AffiliateDashboard />} />
            <Route path="/moderator/users" element={<ModeratorDashboard />} />
            <Route path="/moderator/transactions" element={<ModeratorDashboard />} />
            <Route path="/moderator/profile" element={<ModeratorDashboard />} />
            <Route path="/moderator/updates" element={<ModeratorDashboard />} />
            <Route path="/moderator/recharge" element={<ModeratorRecharge />} />
            <Route path="/moderator-auth" element={<ModeratorAuth />} />
            <Route path="/ref/:code" element={<AffiliateLink />} />
            <Route path="/formulario" element={<PublicRegistrationForm />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/credits-checkout" element={<CreditsCheckout />} />
            <Route path="/subscription-checkout" element={<SubscriptionCheckout />} />
            <Route path="/pendrive-checkout" element={<PendriveCheckout />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageFunctionStatusWrapper>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ImpersonationProvider>
          <LoginMessageProvider>
            <NotificationProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <AppContent />
                </BrowserRouter>
              </TooltipProvider>
            </NotificationProvider>
          </LoginMessageProvider>
        </ImpersonationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
