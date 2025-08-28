
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
      {/* Feature Carousel - Primeira posição */}
      <div className="px-6 pt-6">
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

        {/* Expanded Cards Section - Layout mais interativo */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Composições Card */}
          {isCardVisible('compositions') && (
            <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Edit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-lg">Minhas Composições</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleSection('compositions')}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <EyeOff className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-4">
                  <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                    {stats?.compositions?.finished || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Composições criadas
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-card rounded-lg p-3 border">
                    <span className="text-muted-foreground">Este mês</span>
                    <div className="font-semibold">0</div>
                  </div>
                  <div className="bg-card rounded-lg p-3 border">
                    <span className="text-muted-foreground">Rascunhos</span>
                    <div className="font-semibold">{stats?.compositions?.drafts || 0}</div>
                  </div>
                </div>
                <Link to="/composer">
                  <Button className="w-full group-hover:shadow-md transition-all" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Nova Composição
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Parcerias Card */}
          {isCardVisible('partnerships') && (
            <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-purple-500">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-lg">Parcerias</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleSection('partnerships')}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <EyeOff className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg p-4">
                  <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                    {stats?.partnerships?.active || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Parcerias ativas
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-card rounded-lg p-3 border">
                    <span className="text-muted-foreground">Pendentes</span>
                    <div className="font-semibold">0</div>
                  </div>
                  <div className="bg-card rounded-lg p-3 border">
                    <span className="text-muted-foreground">Concluídas</span>
                    <div className="font-semibold">0</div>
                  </div>
                </div>
                <Link to="/partnerships">
                  <Button className="w-full group-hover:shadow-md transition-all" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Ver Parcerias
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Obras Registradas Card */}
          {isCardVisible('registeredWorks') && (
            <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-green-500">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-lg">Obras Registradas</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleSection('registeredWorks')}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <EyeOff className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg p-4">
                  <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                    {stats?.registeredWorks?.total || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Registros autorais
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-card rounded-lg p-3 border">
                    <span className="text-muted-foreground">Em análise</span>
                    <div className="font-semibold">0</div>
                  </div>
                  <div className="bg-card rounded-lg p-3 border">
                    <span className="text-muted-foreground">Aprovados</span>
                    <div className="font-semibold">{stats?.registeredWorks?.total || 0}</div>
                  </div>
                </div>
                <Link to="/dashboard/author-registration">
                  <Button className="w-full group-hover:shadow-md transition-all" size="sm">
                    <Shield className="h-4 w-4 mr-2" />
                    Novo Registro
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Pastas Card */}
          {isCardVisible('folders') && (
            <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-orange-500">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                      <Folder className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="text-lg">Organização</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleSection('folders')}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <EyeOff className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950 dark:to-yellow-950 rounded-lg p-4">
                  <div className="text-4xl font-bold text-orange-600 dark:text-orange-400">
                    {stats?.folders?.total || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pastas criadas
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-card rounded-lg p-3 border">
                    <span className="text-muted-foreground">Itens</span>
                    <div className="font-semibold">{stats?.compositions?.total || 0}</div>
                  </div>
                  <div className="bg-card rounded-lg p-3 border">
                    <span className="text-muted-foreground">Rascunhos</span>
                    <div className="font-semibold">{stats?.compositions?.drafts || 0}</div>
                  </div>
                </div>
                <Link to="/folders">
                  <Button className="w-full group-hover:shadow-md transition-all" size="sm">
                    <Folder className="h-4 w-4 mr-2" />
                    Gerenciar Pastas
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
