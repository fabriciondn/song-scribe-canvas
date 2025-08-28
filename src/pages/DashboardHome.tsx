
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
import { TransactionCard } from "@/components/dashboard/TransactionCard";

const DashboardHome = () => {
  const { profile } = useProfile();
  const { 
    stats, 
    isLoading: statsLoading, 
    error: statsError 
  } = useDashboardStats();
  
  const {
    expandedSections,
    handleToggleSection,
    isCardVisible
  } = useDashboardCardSelection();

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
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className={`p-3 rounded-lg ${color}`}>
            {React.createElement(icon, { className: "h-6 w-6 text-white" })}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {getGreeting()}, {displayName}! 👋
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo ao seu painel de controle
          </p>
        </div>
        <CardSelector 
          expandedSections={expandedSections}
          onToggleSection={handleToggleSection}
        >
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Personalizar Cards
          </Button>
        </CardSelector>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
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
              Erro ao carregar estatísticas
            </CardContent>
          </Card>
        ) : (
          <>
            {renderStatsCard(
              "Composições", 
              stats?.compositions?.total || 0, 
              Music, 
              "bg-blue-500",
              "Total de obras criadas"
            )}
            {renderStatsCard(
              "Parcerias", 
              stats?.partnerships?.active || 0, 
              Users, 
              "bg-purple-500",
              "Colaborações ativas"
            )}
            {renderStatsCard(
              "Obras Registradas", 
              stats?.registeredWorks?.total || 0, 
              Shield, 
              "bg-green-500",
              "Registros autorais"
            )}
            {renderStatsCard(
              "Pastas", 
              stats?.folders?.total || 0, 
              Folder, 
              "bg-yellow-500",
              "Organização de conteúdo"
            )}
          </>
        )}
      </div>

      {/* Feature Carousel */}
      <FeatureCarousel />

      {/* Expanded Cards Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Composições Card */}
        {isCardVisible('compositions') && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-blue-600" />
                  <span>Minhas Composições</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleSection('compositions')}
                >
                  <EyeOff className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {stats?.compositions?.total || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Composições criadas
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Finalizadas</span>
                    <span>{stats?.compositions?.finished || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Rascunhos</span>
                    <span>{stats?.compositions?.drafts || 0}</span>
                  </div>
                </div>
                <Link to="/composer">
                  <Button className="w-full" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Nova Composição
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Parcerias Card */}
        {isCardVisible('partnerships') && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <span>Parcerias</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleSection('partnerships')}
                >
                  <EyeOff className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {stats?.partnerships?.active || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Parcerias ativas
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Recentes</span>
                    <span>{stats?.partnerships?.recent?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total</span>
                    <span>{stats?.partnerships?.active || 0}</span>
                  </div>
                </div>
                <Link to="/partnerships">
                  <Button className="w-full" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Ver Parcerias
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Obras Registradas Card */}
        {isCardVisible('registeredWorks') && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span>Obras Registradas</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleSection('registeredWorks')}
                >
                  <EyeOff className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {stats?.registeredWorks?.total || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Registros autorais
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Última obra</span>
                    <span>{stats?.registeredWorks?.lastRegistered?.title || 'Nenhuma'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Data</span>
                    <span>{stats?.registeredWorks?.lastRegistered?.date || '-'}</span>
                  </div>
                </div>
                <Link to="/dashboard/author-registration">
                  <Button className="w-full" size="sm">
                    <Shield className="h-4 w-4 mr-2" />
                    Novo Registro
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pastas Card */}
        {isCardVisible('folders') && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Folder className="h-5 w-5 text-yellow-600" />
                  <span>Organização</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleSection('folders')}
                >
                  <EyeOff className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {stats?.folders?.total || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Pastas criadas
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Com conteúdo</span>
                    <span>{stats?.folders?.breakdown?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Rascunhos</span>
                    <span>{stats?.compositions?.drafts || 0}</span>
                  </div>
                </div>
                <Link to="/folders">
                  <Button className="w-full" size="sm">
                    <Folder className="h-4 w-4 mr-2" />
                    Gerenciar Pastas
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transaction Card */}
      <TransactionCard />
    </div>
  );
};

export default DashboardHome;
