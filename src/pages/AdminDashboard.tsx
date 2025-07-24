import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, FileText, DraftingCompass, Handshake, Award, Activity, Folder, FileImage } from 'lucide-react';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { adminService } from '@/services/adminService';

const AdminDashboard = () => {
  const { data: stats, isLoading, error, refetch } = useAdminDashboard();

  useEffect(() => {
    // Update user session when component mounts
    adminService.updateUserSession();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground">Visão geral do sistema</p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive">Erro ao carregar dados</h2>
          <p className="text-muted-foreground">Não foi possível carregar as estatísticas do sistema.</p>
        </div>
        <button 
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const cards = [
    {
      title: "Total de Usuários",
      value: stats.total_users,
      description: "Usuários registrados na plataforma",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Usuários Ativos",
      value: stats.active_users,
      description: "Ativos nas últimas 24 horas",
      icon: Activity,
      color: "text-green-600"
    },
    {
      title: "Composições",
      value: stats.total_songs,
      description: "Total de composições criadas",
      icon: FileText,
      color: "text-purple-600"
    },
    {
      title: "Rascunhos",
      value: stats.total_drafts,
      description: "Rascunhos salvos",
      icon: DraftingCompass,
      color: "text-orange-600"
    },
    {
      title: "Parcerias",
      value: stats.total_partnerships,
      description: "Parcerias ativas",
      icon: Handshake,
      color: "text-pink-600"
    },
    {
      title: "Obras Registradas",
      value: stats.total_registered_works,
      description: "Registros de autoria",
      icon: Award,
      color: "text-yellow-600"
    },
    {
      title: "Pastas",
      value: stats.total_folders,
      description: "Pastas organizacionais",
      icon: Folder,
      color: "text-indigo-600"
    },
    {
      title: "Templates",
      value: stats.total_templates,
      description: "Templates de documentos",
      icon: FileImage,
      color: "text-teal-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <p className="text-muted-foreground">Visão geral do sistema</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status do Sistema</CardTitle>
          <CardDescription>
            Informações atualizadas em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-green-600 border-green-200">
              <Activity className="w-3 h-3 mr-1" />
              Sistema Online
            </Badge>
            <Badge variant="outline">
              Última atualização: {new Date().toLocaleTimeString()}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;