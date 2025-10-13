import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Users, 
  MousePointer, 
  Target,
  Calendar,
  Award
} from 'lucide-react';
import { useAffiliate } from '@/hooks/useAffiliate';
import { useEffect } from 'react';

export const AffiliateMetrics = () => {
  const { affiliate, stats, refreshData } = useAffiliate();
  
  // Atualizar dados a cada 10 segundos para mostrar em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [refreshData]);

  if (!stats || !affiliate) {
    return <div>Carregando métricas...</div>;
  }

  const getLevelProgress = () => {
    if (affiliate.level === 'bronze') {
      return {
        current: affiliate.total_registrations,
        target: 5,
        nextLevel: 'Silver',
        description: 'registros para desbloquear 50% de comissão'
      };
    } else if (affiliate.level === 'silver') {
      return {
        current: affiliate.total_registrations,
        target: 100,
        nextLevel: 'Gold',
        description: 'registros para desbloquear comissões recorrentes'
      };
    } else {
      return {
        current: affiliate.total_registrations,
        target: affiliate.total_registrations,
        nextLevel: 'Máximo',
        description: 'Parabéns! Você atingiu o nível máximo'
      };
    }
  };

  const levelProgress = getLevelProgress();
  const progressPercentage = (levelProgress.current / levelProgress.target) * 100;

  return (
    <div className="space-y-6 px-2">
      {/* Progresso do Nível */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Progresso do Nível
          </CardTitle>
          <CardDescription>
            Sua evolução no programa de afiliados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-2xl font-bold">{affiliate.level.toUpperCase()}</div>
              <div className="text-sm text-muted-foreground">
                {levelProgress.current} de {levelProgress.target} {levelProgress.description}
              </div>
            </div>
            <Badge variant="outline">
              Próximo: {levelProgress.nextLevel}
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </CardContent>
      </Card>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cliques Totais</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_clicks}</div>
            <p className="text-xs text-muted-foreground">
              Links de afiliado acessados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversões</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_conversions}</div>
            <p className="text-xs text-muted-foreground">
              Registros + Assinaturas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversion_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.total_clicks > 0 ? 'Ótima performance!' : 'Comece a divulgar'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registros Autorais</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.registrations_count}</div>
            <p className="text-xs text-muted-foreground">
              Obras registradas através do seu link
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.subscriptions_count}</div>
            <p className="text-xs text-muted-foreground">
              {affiliate.level === 'gold' ? 'Gerando comissão recorrente' : 'Disponível no nível Gold'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.this_month_earnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Ganhos em {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">Total Ganho</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">
              R$ {stats.total_earnings.toFixed(2)}
            </div>
            <p className="text-sm text-green-700 mt-1">
              Desde o início do programa
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">A Receber</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-900">
              R$ {stats.pending_earnings.toFixed(2)}
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Processamento em até 7 dias
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Já Recebido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">
              R$ {stats.paid_earnings.toFixed(2)}
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Pagamentos realizados
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};