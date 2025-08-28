
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Users, 
  FileText, 
  Folder,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Music,
  Shield
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import FeatureCarousel from '@/components/dashboard/FeatureCarousel';
import { TransactionCard } from '@/components/dashboard/TransactionCard';

export default function DashboardHome() {
  const { user } = useAuth();
  const { stats, isLoading } = useDashboardStats();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const isExpanded = (section: string) => expandedSections.includes(section);

  const userName = user?.user_metadata?.name || user?.user_metadata?.artistic_name || 'Usuário';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Carregando suas informações...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-muted rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Olá, {userName}! 👋</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao seu dashboard. Aqui você encontra um resumo de suas atividades.
          </p>
        </div>
      </div>

      {/* Cards de Estatísticas Básicos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Músicas</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.compositions?.finished || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(Math.random() * 5)} este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parcerias</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.partnerships?.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              Colaborações ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registros</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.registeredWorks?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Obras registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pastas</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.folders?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Organizadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* TransactionCard */}
      <TransactionCard />

      {/* Feature Carousel */}
      <FeatureCarousel />
    </div>
  );
}
