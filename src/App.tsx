
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { useTheme } from '@/components/ui/use-theme';
import { AuthProvider } from '@/context/AuthContext';
import { ImpersonationProvider } from '@/context/ImpersonationContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SiteLayout } from '@/components/layout/SiteLayout';
import { FunctionStatusAlert } from '@/components/layout/FunctionAwareMenuItem';

import Home from '@/pages/Home';
import Pricing from '@/pages/Pricing';
import DashboardHome from '@/pages/DashboardHome';
import Composer from '@/pages/Composer';
import Cifrador from '@/pages/Cifrador';
import CifradorNeo from '@/pages/CifradorNeo';
import Bases from '@/pages/Bases';
import Folders from '@/pages/Folders';
import Drafts from '@/pages/Drafts';
import Partnerships from '@/pages/Partnerships';
import SettingsPage from '@/pages/SettingsPage';
import Plans from '@/pages/Plans';
import Trash from '@/pages/Trash';
import Admin from '@/pages/Admin';
import Moderator from '@/pages/Moderator';
import AuthorRegistration from '@/pages/AuthorRegistration';
import Tutorials from '@/pages/Tutorials';
import CreditsCheckout from '@/pages/CreditsCheckout';
import Purchases from '@/pages/Purchases';

const queryClient = new QueryClient();

function AppRoutes() {
  const { theme } = useTheme();
  const [isSSR, setIsSSR] = useState(true);

  useEffect(() => {
    setIsSSR(false);
  }, []);

  return (
    <>
      {!isSSR && (
        <Routes>
          <Route path="/" element={<SiteLayout><Home /></SiteLayout>} />
          <Route path="/pricing" element={<SiteLayout><Pricing /></SiteLayout>} />
          <Route path="/credits-checkout" element={<SiteLayout><CreditsCheckout /></SiteLayout>} />

          <Route path="/dashboard" element={
            <DashboardLayout>
              <DashboardHome />
            </DashboardLayout>
          } />
          <Route path="/dashboard/author-registration" element={
            <DashboardLayout>
              <AuthorRegistration />
            </DashboardLayout>
          } />
          <Route path="/composer" element={
            <DashboardLayout>
              <Composer />
            </DashboardLayout>
          } />
          <Route path="/cifrador" element={
            <DashboardLayout>
              <Cifrador />
            </DashboardLayout>
          } />
          <Route path="/cifrador-neo" element={
            <DashboardLayout>
              <CifradorNeo />
            </DashboardLayout>
          } />
          <Route path="/bases" element={
            <DashboardLayout>
              <Bases />
            </DashboardLayout>
          } />
          <Route path="/folders" element={
            <DashboardLayout>
              <Folders />
            </DashboardLayout>
          } />
          <Route path="/drafts" element={
            <DashboardLayout>
              <Drafts />
            </DashboardLayout>
          } />
          <Route path="/partnerships" element={
            <DashboardLayout>
              <Partnerships />
            </DashboardLayout>
          } />
          <Route path="/dashboard/tutorials" element={
            <DashboardLayout>
              <Tutorials />
            </DashboardLayout>
          } />
          <Route path="/dashboard/purchases" element={
            <DashboardLayout>
              <Purchases />
            </DashboardLayout>
          } />
          <Route path="/dashboard/settings" element={
            <DashboardLayout>
              <SettingsPage />
            </DashboardLayout>
          } />
          <Route path="/plans" element={
            <DashboardLayout>
              <Plans />
            </DashboardLayout>
          } />
          <Route path="/dashboard/trash" element={
            <DashboardLayout>
              <Trash />
            </DashboardLayout>
          } />
          <Route path="/admin" element={
            <DashboardLayout>
              <Admin />
            </DashboardLayout>
          } />
          <Route path="/moderator" element={
            <DashboardLayout>
              <Moderator />
            </DashboardLayout>
          } />
        </Routes>
      )}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <AuthProvider>
        <ImpersonationProvider>
          <ThemeProvider defaultTheme="dark" storageKey="vite-react-theme">
            <Router>
              <AppRoutes />
              <FunctionStatusAlert />
            </Router>
          </ThemeProvider>
        </ImpersonationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
