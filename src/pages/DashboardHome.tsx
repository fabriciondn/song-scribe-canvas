
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { 
  Edit, 
  Users, 
  Shield, 
  Folder,
  Music,
  FileText,
  Plus
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useDashboardStats } from "@/hooks/useDashboardStats";

const DashboardHome = () => {
  const { profile } = useProfile();
  const { 
    stats, 
    isLoading: statsLoading, 
    error: statsError 
  } = useDashboardStats();

  const displayName = profile?.name || profile?.artistic_name || 'Usuário';

  if (statsLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-card/50">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (statsError) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Erro ao carregar estatísticas do dashboard
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo de Composições */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Music className="h-6 w-6 text-blue-500" />
            </div>
            Resumo de Composições
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {stats?.compositions?.total || 0}
              </div>
              <p className="text-sm text-muted-foreground">Total de Letras</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {stats?.compositions?.finished || 0}
              </div>
              <p className="text-sm text-muted-foreground">Finalizadas</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {stats?.compositions?.drafts || 0}
              </div>
              <p className="text-sm text-muted-foreground">Rascunhos</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link to="/composer" className="flex-1">
              <Button className="w-full bg-blue-500 hover:bg-blue-600">
                <Plus className="h-4 w-4 mr-2" />
                Nova Composição
              </Button>
            </Link>
            <Link to="/drafts" className="flex-1">
              <Button variant="outline" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Ver Rascunhos
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Parcerias */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Users className="h-6 w-6 text-purple-500" />
            </div>
            Parcerias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-foreground">
                {stats?.partnerships?.active || 0}
              </div>
              <p className="text-sm text-muted-foreground">Colaborações Ativas</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-muted-foreground">
                {stats?.partnerships?.recent?.length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Recentes</p>
            </div>
          </div>
          <Link to="/partnerships">
            <Button className="w-full bg-purple-500 hover:bg-purple-600">
              <Users className="h-4 w-4 mr-2" />
              Gerenciar Parcerias
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Obras Registradas */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Shield className="h-6 w-6 text-green-500" />
            </div>
            Obras Registradas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-foreground">
                {stats?.registeredWorks?.total || 0}
              </div>
              <p className="text-sm text-muted-foreground">Obras Protegidas</p>
            </div>
            {stats?.registeredWorks?.lastRegistered && (
              <div className="text-right">
                <div className="text-sm font-medium text-foreground truncate max-w-[120px]">
                  {stats.registeredWorks.lastRegistered.title}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.registeredWorks.lastRegistered.date}
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Link to="/dashboard/author-registration" className="flex-1">
              <Button className="w-full bg-green-500 hover:bg-green-600">
                <Plus className="h-4 w-4 mr-2" />
                Novo Registro
              </Button>
            </Link>
            <Link to="/registered-works" className="flex-1">
              <Button variant="outline" className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                Ver Registros
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Organização de Pastas */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Folder className="h-6 w-6 text-yellow-500" />
            </div>
            Organização de Pastas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-foreground">
                {stats?.folders?.total || 0}
              </div>
              <p className="text-sm text-muted-foreground">Total de Pastas</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-muted-foreground">
                {stats?.folders?.breakdown?.length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Com Conteúdo</p>
            </div>
          </div>
          <Link to="/folders">
            <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black">
              <Folder className="h-4 w-4 mr-2" />
              Gerenciar Pastas
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHome;
