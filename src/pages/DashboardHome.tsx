
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';
import { 
  Edit, 
  Users, 
  Shield, 
  Folder,
  Music,
  FileText,
  TrendingUp,
  Clock,
  Star,
  Award,
  Eye,
  EyeOff,
  Settings
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { CardSelector } from "@/components/dashboard/CardSelector";
import { useDashboardCardSelection } from "@/hooks/useDashboardCardSelection";
import FeatureCarousel from "@/components/dashboard/FeatureCarousel";

const DashboardHome = () => {
  const { profile } = useProfile();
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

  const renderStatsCard = (
    title: string,
    value: number | string,
    icon: React.ElementType,
    color: string,
    description: string
  ) => (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold mt-1 group-hover:text-primary transition-colors">{value}</p>
            <p className="text-xs text-muted-foreground mt-2">{description}</p>
          </div>
          <div className={`p-4 rounded-xl ${color} group-hover:scale-110 transition-transform duration-300`}>
            {React.createElement(icon, { className: "h-6 w-6 text-white" })}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Feature Carousel - Primeira posição com padding reduzido */}
      <div className="px-6 pt-2">
        <FeatureCarousel />
      </div>

      {/* Saudação menor abaixo do carrossel */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {getGreeting()}, {displayName}! 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Bem-vindo ao seu painel de controle
            </p>
          </div>
          
          {/* Botão personalizar cards minimalista */}
          <CardSelector 
            expandedSections={expandedSections}
            onToggleSection={handleToggleSection}
          >
            <Button variant="ghost" size="sm" className="text-xs">
              <Settings className="h-3 w-3 mr-1" />
              Personalizar
            </Button>
          </CardSelector>
        </div>
      </div>

      {/* Container com margens adequadas */}
      <div className="px-6 pb-20 md:pb-6 space-y-8">
        {/* Stats Overview - Cards mais interativos */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-8 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : statsError ? (
            <Card className="col-span-full">
              <CardContent className="p-6 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
                  <p>Erro ao carregar estatísticas</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {renderStatsCard(
                "Composições", 
                stats?.compositions?.total || 0, 
                Music, 
                "bg-gradient-to-r from-blue-500 to-blue-600",
                "Total de obras criadas"
              )}
              {renderStatsCard(
                "Parcerias", 
                stats?.partnerships?.active || 0, 
                Users, 
                "bg-gradient-to-r from-purple-500 to-purple-600",
                "Colaborações ativas"
              )}
              {renderStatsCard(
                "Obras Registradas", 
                stats?.registeredWorks?.total || 0, 
                Shield, 
                "bg-gradient-to-r from-green-500 to-green-600",
                "Registros autorais"
              )}
              {renderStatsCard(
                "Pastas", 
                stats?.folders?.total || 0, 
                Folder, 
                "bg-gradient-to-r from-orange-500 to-orange-600",
                "Organização de conteúdo"
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
