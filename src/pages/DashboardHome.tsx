
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from 'react-router-dom';
import { 
  Edit, 
  Users, 
  Shield, 
  Folder,
  Music
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import FeatureCarousel from "@/components/dashboard/FeatureCarousel";
import { TransactionCard } from "@/components/dashboard/TransactionCard";

const DashboardHome = () => {
  const { profile } = useProfile();
  const { 
    stats, 
    isLoading: statsLoading, 
    error: statsError 
  } = useDashboardStats();

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
              stats?.compositions.total || 0, 
              Music, 
              "bg-blue-500",
              "Total de obras criadas"
            )}
            {renderStatsCard(
              "Parcerias", 
              stats?.partnerships.active || 0, 
              Users, 
              "bg-purple-500",
              "Colaborações ativas"
            )}
            {renderStatsCard(
              "Obras Registradas", 
              stats?.registeredWorks.total || 0, 
              Shield, 
              "bg-green-500",
              "Registros autorais"
            )}
            {renderStatsCard(
              "Pastas", 
              stats?.folders.total || 0, 
              Folder, 
              "bg-yellow-500",
              "Organização de conteúdo"
            )}
          </>
        )}
      </div>

      {/* Feature Carousel */}
      <FeatureCarousel />

      {/* Transaction Card */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <TransactionCard />
      </div>
    </div>
  );
};

export default DashboardHome;
