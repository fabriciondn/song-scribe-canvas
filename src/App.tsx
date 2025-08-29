import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, LoginMessageProvider } from "./context/AuthContext";
import { ImpersonationProvider } from "./context/ImpersonationContext";
import { useImpersonationSync } from "./hooks/useImpersonationSync";
import { NotificationProvider } from "@/components/ui/notification";
import { ImpersonationBanner } from "@/components/ui/impersonation-banner";
import { RoleRedirect } from "@/components/layout/RoleRedirect";
import { GlobalNotifications } from "@/components/GlobalNotifications";
import { PageFunctionStatusWrapper } from "@/components/layout/FunctionStatusWrapper";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/DashboardHome";
import Composer from "./pages/Composer";
import Cifrador from "./pages/Cifrador";
import CifradorNeo from "./pages/CifradorNeo";
import Bases from "./pages/Bases";
import Templates from "./pages/Templates";
import Plans from "./pages/Plans";
import Checkout from "./pages/Checkout";
import CreditsCheckout from "./pages/CreditsCheckout";
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
import ModeratorAuth from "./pages/ModeratorAuth";
import PublicRegistrationForm from "./pages/PublicRegistrationForm";
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
  return <div className="flex flex-col min-h-screen">
      <ImpersonationBanner />
      <GlobalNotifications />
      
      <div style={{
      paddingTop: 'var(--impersonation-banner-height, 0px)'
    }} className="flex-1 py-[4px]">
        <RoleRedirect />
        <PageFunctionStatusWrapper>
          <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<DashboardHome />} />
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
          <Route path="settings" element={<Settings />} />
          <Route path="trash" element={<Trash />} />
        </Route>
        <Route path="/composer" element={<Dashboard />}>
          <Route index element={<Composer />} />
        </Route>
        <Route path="/cifrador" element={<Dashboard />}>
          <Route index element={<Cifrador />} />
        </Route>
        <Route path="/cifrador-neo" element={<Dashboard />}>
          <Route index element={<CifradorNeo />} />
        </Route>
        <Route path="/bases" element={<Dashboard />}>
          <Route index element={<Bases />} />
        </Route>
        <Route path="/templates" element={<Dashboard />}>
          <Route index element={<Templates />} />
        </Route>
        <Route path="/folders/*" element={<Dashboard />}>
          <Route path="*" element={<Folders />} />
        </Route>
        <Route path="/drafts" element={<Dashboard />}>
          <Route index element={<Drafts />} />
        </Route>
        <Route path="/partnerships" element={<Dashboard />}>
          <Route index element={<Partnerships />} />
        </Route>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/moderator" element={<ModeratorDashboard />} />
        <Route path="/moderator/users" element={<ModeratorDashboard />} />
        <Route path="/moderator/transactions" element={<ModeratorDashboard />} />
        <Route path="/moderator/profile" element={<ModeratorDashboard />} />
        <Route path="/moderator/debug" element={<ModeratorDashboard />} />
        <Route path="/moderator-auth" element={<ModeratorAuth />} />
        <Route path="/formulario" element={<PublicRegistrationForm />} />
        <Route path="/plans" element={<Dashboard />}>
          <Route index element={<Plans />} />
        </Route>
        <Route path="/checkout" element={<Dashboard />}>
          <Route index element={<Checkout />} />
        </Route>
        <Route path="/credits-checkout" element={<CreditsCheckout />} />
        <Route path="*" element={<NotFound />} />
          </Routes>
        </PageFunctionStatusWrapper>
      </div>
    </div>;
};
const App = () => {
  return <QueryClientProvider client={queryClient}>
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
  </QueryClientProvider>;
};
export default App;