import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  TrendingUp, 
  Users, 
  MousePointer, 
  Target,
  Calendar,
  Award,
  UserPlus,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAffiliate } from '@/hooks/useAffiliate';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ReferredUser {
  name: string;
  email: string;
  conversion_date: string;
  commission_amount: number | null;
  commission_status: string | null;
}

export const AffiliateMetrics = () => {
  const { affiliate, stats, refreshData } = useAffiliate();
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  
  // Atualizar dados a cada 10 segundos para mostrar em tempo real
  // Buscar usuários indicados
  useEffect(() => {
    const loadReferredUsers = async () => {
      if (!affiliate?.id) return;

      const { data, error } = await supabase
        .from('affiliate_conversions')
        .select(`
          user_id,
          created_at,
          profiles!inner(name, email),
          affiliate_commissions(amount, status)
        `)
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const users = data.map((conv: any) => ({
          name: conv.profiles?.name || 'Sem nome',
          email: conv.profiles?.email || 'Sem email',
          conversion_date: conv.created_at,
          commission_amount: conv.affiliate_commissions?.[0]?.amount || null,
          commission_status: conv.affiliate_commissions?.[0]?.status || null
        }));
        setReferredUsers(users);
      }
    };

    loadReferredUsers();
  }, [affiliate?.id]);

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

      {/* NOVA SEÇÃO: Meus Indicados */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Meus Indicados
          </CardTitle>
          <CardDescription>
            Usuários que se cadastraram através do seu link de afiliado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum indicado ainda</p>
              <p className="text-sm mt-1">Compartilhe seu link para começar a ganhar comissões</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead>Comissão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referredUsers.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {new Date(user.conversion_date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {user.commission_amount ? (
                          <div className="flex items-center gap-2">
                            {user.commission_status === 'paid' ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-green-600 font-semibold">
                                  R$ {user.commission_amount.toFixed(2)} paga
                                </span>
                              </>
                            ) : (
                              <>
                                <Clock className="h-4 w-4 text-orange-600" />
                                <span className="text-orange-600 font-semibold">
                                  R$ {user.commission_amount.toFixed(2)} pendente
                                </span>
                              </>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline">Aguardando pagamento</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};