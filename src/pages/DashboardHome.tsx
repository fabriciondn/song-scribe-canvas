import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';
import { Edit, Users, Shield, Folder, Music, FileText, TrendingUp, Clock, Star, Award, Eye, EyeOff, Settings } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { CardSelector } from "@/components/dashboard/CardSelector";
import { useDashboardCardSelection } from "@/hooks/useDashboardCardSelection";
import FeatureCarousel from "@/components/dashboard/FeatureCarousel";
const DashboardHome = () => {
  const {
    profile
  } = useProfile();
  const {
    stats,
    isLoading: statsLoading,
    error: statsError
  } = useDashboardStats();
  const {
    expandedSections,
    toggleSection,
    isExpanded
  } = useDashboardCardSelection();
  const handleToggleSection = toggleSection;
  const isCardVisible = isExpanded;
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };
  const displayName = profile?.name || profile?.artistic_name || 'Usuário';
  const renderStatsCard = (title: string, value: number | string, icon: React.ElementType, color: string, description: string) => <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium">{title}</p>
            <p className="text-xl font-bold mt-1 group-hover:text-primary transition-colors">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className={`p-3 rounded-lg ${color} group-hover:scale-110 transition-transform duration-300`}>
            {React.createElement(icon, {
            className: "h-4 w-4 text-white"
          })}
          </div>
        </div>
      </CardContent>
    </Card>;
  return <div className="min-h-screen bg-background">
      {/* Topo fixo com altura definida */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="h-20 flex items-center justify-center px-8">
          <div className="w-full max-w-6xl">
            <FeatureCarousel />
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="px-8 py-[85px]">
        {/* Saudação e botão personalizar */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {getGreeting()}, {displayName}! 👋
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Bem-vindo ao seu painel de controle
              </p>
            </div>
            
            <CardSelector expandedSections={expandedSections} onToggleSection={handleToggleSection}>
              <Button variant="ghost" size="sm" className="text-xs">
                <Settings className="h-3 w-3 mr-1" />
                Personalizar
              </Button>
            </CardSelector>
          </div>
        </div>

        {/* Cards de estatísticas - menores e centralizados */}
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {statsLoading ? Array.from({
            length: 4
          }).map((_, i) => <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                      <div className="h-5 bg-muted rounded w-3/4"></div>
                      <div className="h-2 bg-muted rounded w-full"></div>
                    </div>
                  </CardContent>
                </Card>) : statsError ? <Card className="col-span-full">
                <CardContent className="p-4 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-muted-foreground/50" />
                    <p className="text-sm">Erro ao carregar estatísticas</p>
                  </div>
                </CardContent>
              </Card> : <>
                {renderStatsCard("Composições", stats?.compositions?.total || 0, Music, "bg-gradient-to-r from-blue-500 to-blue-600", "Total de obras criadas")}
                {renderStatsCard("Parcerias", stats?.partnerships?.active || 0, Users, "bg-gradient-to-r from-purple-500 to-purple-600", "Colaborações ativas")}
                {renderStatsCard("Obras Registradas", stats?.registeredWorks?.total || 0, Shield, "bg-gradient-to-r from-green-500 to-green-600", "Registros autorais")}
                {renderStatsCard("Pastas", stats?.folders?.total || 0, Folder, "bg-gradient-to-r from-orange-500 to-orange-600", "Organização de conteúdo")}
              </>}
          </div>
        </div>
      </div>
    </div>;
};
export default DashboardHome;