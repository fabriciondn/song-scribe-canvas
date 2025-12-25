import React from 'react';
import { CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { NotificationCenter } from './NotificationCenter';
import { useUserCredits } from '@/hooks/useUserCredits';

interface DashboardHeaderProps {
  userName?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userName }) => {
  const { credits } = useUserCredits();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
          {userName ? `Olá, ${userName}` : 'Bem-vindo'}
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1">
          Gerencie suas composições e obras
        </p>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3">
        <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 text-sm">
          <CreditCard className="h-4 w-4" />
          {credits || 0} créditos
        </Badge>
        
        <NotificationCenter />
      </div>
    </div>
  );
};
