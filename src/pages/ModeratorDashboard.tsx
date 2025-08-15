import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { ModeratorSidebar } from '@/components/moderator/ModeratorSidebar';
import { ModeratorOverview } from '@/components/moderator/ModeratorOverview';
import { ModeratorUsers } from '@/components/moderator/ModeratorUsers';
import { ModeratorProfile } from '@/components/moderator/ModeratorProfile';
import { ModeratorTransactions } from '@/components/moderator/ModeratorTransactions';
import { useModeratorAccess } from '@/hooks/useModeratorAccess';
import { useUserCredits } from '@/hooks/useUserCredits';
import { ImpersonationBanner } from '@/components/ui/impersonation-banner';
import { ModeratorDashboard } from '@/components/moderator/ModeratorDashboard';

const ModeratorDashboardPage = () => {
  // Determinar qual tab mostrar baseado na URL
  const path = window.location.pathname;
  let activeTab = 'overview';
  
  if (path.includes('/users')) {
    activeTab = 'users';
  } else if (path.includes('/transactions')) {
    activeTab = 'transactions';
  } else if (path.includes('/profile')) {
    activeTab = 'profile';
  } else if (path.includes('/debug')) {
    activeTab = 'debug';
  }

  return <ModeratorDashboard activeTab={activeTab} />;
};

export default ModeratorDashboardPage;