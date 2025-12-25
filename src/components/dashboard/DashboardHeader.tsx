import React from 'react';
import { Search, Bell, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';

interface DashboardHeaderProps {
  userName?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userName }) => {
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
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar obras..." 
            className="pl-10 w-48 lg:w-64 bg-card/50 border-border/50 focus:bg-card text-sm"
          />
        </div>
        
        <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4 bg-primary rounded-full text-[9px] sm:text-[10px] font-bold flex items-center justify-center text-primary-foreground">
            2
          </span>
        </Button>
        
        <Button asChild size="sm" className="gap-1.5 sm:gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 h-9 sm:h-10 px-3 sm:px-4">
          <Link to="/credits-checkout">
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Adicionar</span>
          </Link>
        </Button>
      </div>
    </div>
  );
};
